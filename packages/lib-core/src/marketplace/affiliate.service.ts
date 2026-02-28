import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { creditService } from '../credit.service';
import {
  AffiliateRewardStatus,
  AffiliateRewardType,
  ReferralAttributionStatus,
} from '@prisma/client';
import { logger } from '@giulio-leone/lib-shared';

const log = logger.child('AffiliateService');
const affiliateLogger = {
  logRegistration: (data: unknown) => log.info('Affiliate registration', data),
  logSubscription: (data: unknown) => log.info('Affiliate subscription', data),
  logRewardReleased: (data: unknown) => log.info('Affiliate reward released', data),
  logPayoutApproved: (data: unknown) => log.info('Affiliate payout approved', data),
  logError: (data: unknown) => log.error('Affiliate error', data),
  error: (data: unknown) => log.error('Affiliate error', data), // Alias for compatibility
};
// Utility locale per generare codici senza dipendenze esterne
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generateCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    out += ALPHABET[idx];
  }
  return out;
}

const REFERRAL_CODE_LENGTH = 10;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

type AffiliateProgramWithLevels = Prisma.affiliate_programsGetPayload<{
  include: { affiliate_program_levels: true };
}>;

type ReferralChainItem = {
  level: number;
  referrerUserId: string;
  referralCodeId: string;
};

export class AffiliateService {
  /**
   * Recupera il programma affiliati attivo con livelli
   */
  static async getActiveProgram(): Promise<AffiliateProgramWithLevels | null> {
    const program = await prisma.affiliate_programs.findFirst({
      where: { isActive: true },
      include: { affiliate_program_levels: { orderBy: { level: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return program ?? null;
  }

  /**
   * Genera (o restituisce) il referral code per l'utente
   */
  static async ensureUserReferralCode(userId: string, programId?: string) {
    const existing = await prisma.referral_codes.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    let targetProgramId = programId;

    if (!targetProgramId) {
      const program = await this.getActiveProgram();
      targetProgramId = program?.id;
    }

    if (!targetProgramId) {
      throw new Error('Nessun programma affiliati disponibile per generare un codice');
    }

    const code = await this.generateUniqueReferralCode();

    return prisma.referral_codes.create({
      data: {
        userId,
        programId: targetProgramId,
        code,
      },
    });
  }

  /**
   * Valida il referral code rispetto al programma attivo
   */
  static async validateReferralCode(code: string) {
    const program = await this.getActiveProgram();

    if (!program) {
      return null;
    }

    const normalizedCode = code.trim().toUpperCase();

    const referral = await prisma.referral_codes.findFirst({
      where: {
        code: normalizedCode,
        programId: program.id,
        isActive: true,
      },
    });

    if (!referral) {
      return null;
    }

    return { referral, program } as const;
  }

  /**
   * Gestisce la registrazione, creando attributions e reward pending
   */
  static async handlePostRegistration(params: {
    userId: string;
    referralCode?: string | null;
    now?: Date;
  }): Promise<void> {
    const { userId, referralCode } = params;
    const now = params.now ?? new Date();

    const program = await this.getActiveProgram();

    if (!program) {
      // Non c'è alcun programma attivo, esci dopo aver generato eventuale referral code
      return;
    }

    // Crea referral code personale
    await this.ensureUserReferralCode(userId, program.id);

    if (!referralCode) {
      return;
    }

    const normalizedCode = referralCode.trim().toUpperCase();

    await this.applyReferralCode({
      program,
      referralCode: normalizedCode,
      referredUserId: userId,
      now,
    });

    // Log registrazione con referral
    affiliateLogger.logRegistration({
      userId,
      referralCode: normalizedCode,
    });
  }

  /**
   * Crea reward monetario (commissione) per invoice pagata
   */
  static async handleInvoicePaid(params: {
    userId: string;
    stripeInvoiceId: string;
    stripeSubscriptionId: string;
    totalAmountCents: number;
    currency: string;
    occurredAt: Date;
  }): Promise<void> {
    const attributions = await prisma.referral_attributions.findMany({
      where: {
        referredUserId: params.userId,
        status: { in: [ReferralAttributionStatus.ACTIVE, ReferralAttributionStatus.CANCELLED] },
      },
      include: {
        affiliate_programs: { include: { affiliate_program_levels: true } },
      },
      orderBy: { level: 'asc' },
    });

    if (attributions.length === 0) {
      return;
    }

    const firstAttribution = attributions[0];
    if (!firstAttribution?.affiliate_programs) {
      return;
    }
    const program = firstAttribution.affiliate_programs;
    const invoiceTotal = params.totalAmountCents / 100;

    const existingReward = await prisma.affiliate_rewards.findFirst({
      where: {
        metadata: {
          path: ['stripeInvoiceId'],
          equals: params.stripeInvoiceId,
        },
      },
      select: { id: true },
    });

    if (existingReward) {
      // Idempotenza: reward già creati per questa invoice
      return;
    }

    const pendingUntil = new Date(
      params.occurredAt.getTime() + program.rewardPendingDays * DAY_IN_MS
    );

    for (const attribution of attributions) {
      if (
        attribution.status === ReferralAttributionStatus.CANCELLED &&
        attribution.graceEndAt &&
        params.occurredAt > attribution.graceEndAt
      ) {
        continue;
      }

      const levelConfig = program.affiliate_program_levels.find((level: any) => level.level === attribution.level
      );
      const commissionRateDecimal = levelConfig?.commissionRate ?? program.baseCommissionRate;
      const numericRate = Number(commissionRateDecimal);

      if (!numericRate || numericRate <= 0) {
        continue;
      }

      const commissionAmount = invoiceTotal * numericRate;

      if (commissionAmount <= 0) {
        continue;
      }

      await prisma.affiliate_rewards.create({
        data: {
          programId: program.id,
          attributionId: attribution.id,
          userId: attribution.referrerUserId,
          type: AffiliateRewardType.SUBSCRIPTION_COMMISSION,
          level: attribution.level,
          currencyAmount: new Prisma.Decimal(commissionAmount.toFixed(2)),
          currencyCode: params.currency.toUpperCase(),
          status: AffiliateRewardStatus.PENDING,
          pendingUntil,
          metadata: {
            stripeInvoiceId: params.stripeInvoiceId,
            stripeSubscriptionId: params.stripeSubscriptionId,
            invoiceTotal,
            commissionRate: numericRate,
          },
        },
      });

      // Log commissione creata
      affiliateLogger.logSubscription({
        userId: params.userId,
        invoiceId: params.stripeInvoiceId,
        subscriptionId: params.stripeSubscriptionId,
        amount: invoiceTotal,
        currency: params.currency,
        commissionRewards: [
          {
            level: attribution.level,
            amount: commissionAmount,
            userId: attribution.referrerUserId,
          },
        ],
      });
    }
  }

  /**
   * Annulla le attribution attive per l'utente dopo la cancellazione della subscription
   */
  static async handleSubscriptionCancellation(params: {
    userId: string;
    occurredAt: Date;
  }): Promise<void> {
    const attributions = await prisma.referral_attributions.findMany({
      where: {
        referredUserId: params.userId,
        status: { in: [ReferralAttributionStatus.ACTIVE, ReferralAttributionStatus.PENDING] },
      },
      include: { affiliate_programs: true },
    });

    if (attributions.length === 0) {
      return;
    }

    await Promise.all(
      attributions.map((attribution: any) =>
        prisma.referral_attributions.update({
          where: { id: attribution.id },
          data: {
            status: ReferralAttributionStatus.CANCELLED,
            cancelledAt: params.occurredAt,
            graceEndAt: new Date(
              params.occurredAt.getTime() +
                attribution.affiliate_programs.subscriptionGraceDays * DAY_IN_MS
            ),
          },
        })
      )
    );
  }

  /**
   * Rilascia le reward pending pronte per essere incassate
   * Per reward REGISTRATION_CREDIT, accredita i crediti al conto utente
   */
  static async releasePendingRewards(referenceDate = new Date()): Promise<number> {
    const rewards = await prisma.affiliate_rewards.findMany({
      where: {
        status: AffiliateRewardStatus.PENDING,
        pendingUntil: { lte: referenceDate },
      },
      select: {
        id: true,
        type: true,
        userId: true,
        creditAmount: true,
        level: true,
      },
    });

    if (rewards.length === 0) {
      return 0;
    }

    const creditRewards = rewards.filter((r: any) => r.type === AffiliateRewardType.REGISTRATION_CREDIT);

    // Accreditare crediti per reward REGISTRATION_CREDIT
    for (const reward of creditRewards) {
      if (reward.creditAmount && reward.creditAmount > 0) {
        try {
          await creditService.addCredits({
            userId: reward.userId || '',
            amount: Number(reward.creditAmount),
            type: 'ADMIN_ADJUSTMENT',
            description: `Crediti referral livello ${reward.level}`,
            metadata: {
              affiliateRewardId: reward.id,
              type: 'REGISTRATION_CREDIT',
              level: reward.level,
            },
          });

          affiliateLogger.logRewardReleased({
            rewardId: reward.id,
            userId: reward.userId,
            type: 'REGISTRATION_CREDIT',
            level: reward.level,
            credits: Number(reward.creditAmount),
          });
        } catch (error: unknown) {
          affiliateLogger.logError({
            event: 'reward.credit.failed',
            error: error instanceof Error ? error : new Error('Unknown error'),
            userId: reward.userId,
            metadata: {
              rewardId: reward.id,
              creditAmount: reward.creditAmount,
            },
          });
          // Non bloccare il processo se un accredito fallisce
        }
      }
    }

    // Aggiornare status di tutti i reward a CLEARED
    await prisma.affiliate_rewards.updateMany({
      where: { id: { in: rewards.map((reward: any) => reward.id) } },
      data: {
        status: AffiliateRewardStatus.CLEARED,
        readyAt: referenceDate,
      },
    });

    return rewards.length;
  }

  private static async applyReferralCode(params: {
    program: AffiliateProgramWithLevels;
    referralCode: string;
    referredUserId: string;
    now: Date;
  }): Promise<void> {
    const { program, referralCode, referredUserId, now } = params;

    const code = await prisma.referral_codes.findFirst({
      where: {
        code: referralCode,
        programId: program.id,
        isActive: true,
      },
    });

    if (!code) {
      throw new Error('Referral code non valido');
    }

    if (code.userId === referredUserId) {
      throw new Error('Impossibile utilizzare il proprio referral code');
    }

    const existingAttribution = await prisma.referral_attributions.findFirst({
      where: { programId: program.id, referredUserId },
    });

    if (existingAttribution) {
      return;
    }

    const referralChain = await this.buildReferralChain({
      startingCode: { ...code, userId: code.userId || '' },
      program,
    });

    const pendingUntil = new Date(now.getTime() + program.rewardPendingDays * DAY_IN_MS);
    const createdAttributionIds: string[] = [];

    await prisma.$transaction(async (tx: any) => {
      let parentAttributionId: string | undefined;

      for (const chainItem of referralChain) {
        const attribution = await tx.referral_attributions.create({
          data: {
            programId: program.id,
            referralCodeId: chainItem.referralCodeId,
            referrerUserId: chainItem.referrerUserId,
            referredUserId,
            level: chainItem.level,
            status: ReferralAttributionStatus.ACTIVE,
            attributedAt: now,
            activatedAt: now,
            parentAttributionId,
          },
        });

        createdAttributionIds.push(attribution.id);

        const levelConfig = program.affiliate_program_levels.find((level: any) => level.level === chainItem.level
        );

        const creditReward =
          levelConfig?.creditReward ?? (chainItem.level === 1 ? program.registrationCredit : 0);

        if (creditReward && creditReward > 0) {
          await tx.affiliate_rewards.create({
            data: {
              programId: program.id,
              attributionId: attribution.id,
              userId: chainItem.referrerUserId,
              type: AffiliateRewardType.REGISTRATION_CREDIT,
              level: chainItem.level,
              creditAmount: creditReward,
              status: AffiliateRewardStatus.PENDING,
              pendingUntil,
              metadata: {
                reason: 'registration',
              },
            },
          });
        }

        parentAttributionId = attribution.id;
      }
    });

    // Log registrazione con reward IDs creati (dopo transazione)
    if (createdAttributionIds.length > 0 && referralChain.length > 0) {
      const createdRewards = await prisma.affiliate_rewards.findMany({
        where: {
          attributionId: { in: createdAttributionIds },
          type: AffiliateRewardType.REGISTRATION_CREDIT,
        },
        select: { id: true },
      });

      affiliateLogger.logRegistration({
        userId: referralChain[0]?.referrerUserId || '',
        referralCode: referralCode,
        rewardIds: createdRewards.map((r: any) => r.id),
        credits: program.registrationCredit,
      });
    }
  }

  private static async buildReferralChain(params: {
    startingCode: { id: string; userId: string };
    program: AffiliateProgramWithLevels;
  }): Promise<ReferralChainItem[]> {
    const chain: ReferralChainItem[] = [];
    let currentLevel = 1;
    let currentCodeId = params.startingCode.id;
    let currentUserId: string | null = params.startingCode.userId;

    while (currentUserId && currentLevel <= params.program.maxLevels) {
      chain.push({
        level: currentLevel,
        referrerUserId: currentUserId,
        referralCodeId: currentCodeId,
      });

      const parentAttribution: Prisma.referral_attributionsGetPayload<{}> | null =
        await prisma.referral_attributions.findFirst({
          where: {
            programId: params.program.id,
            referredUserId: currentUserId,
            level: 1,
            status: ReferralAttributionStatus.ACTIVE,
          },
          orderBy: { attributedAt: 'desc' },
        });

      if (!parentAttribution) {
        break;
      }

      currentLevel += 1;
      currentCodeId = parentAttribution.referralCodeId;
      currentUserId = parentAttribution.referrerUserId;
    }

    return chain;
  }

  private static async generateUniqueReferralCode(): Promise<string> {
    while (true) {
      const candidate = generateCode(REFERRAL_CODE_LENGTH).toUpperCase();
      const exists = await prisma.referral_codes.findFirst({ where: { code: candidate } });

      if (!exists) {
        return candidate;
      }
    }
  }

  /**
   * Get or create referral code for user
   */
  static async getOrCreateReferralCode(userId: string, programId?: string) {
    const referralCode = await this.ensureUserReferralCode(userId, programId);

    // Calculate total uses
    const totalUses = await prisma.referral_attributions.count({
      where: { referralCodeId: referralCode.id },
    });

    return {
      ...referralCode,
      totalUses,
    };
  }

  /**
   * Get affiliate statistics for user
   */
  static async getAffiliateStats(userId: string) {
    const [totalRewards, pendingRewards, clearedRewards, cancelledRewards, totalAttributions] =
      await Promise.all([
        prisma.affiliate_rewards.count({
          where: { userId },
        }),
        prisma.affiliate_rewards.count({
          where: { userId, status: 'PENDING' },
        }),
        prisma.affiliate_rewards.count({
          where: { userId, status: 'CLEARED' },
        }),
        prisma.affiliate_rewards.count({
          where: { userId, status: 'CANCELLED' },
        }),
        prisma.referral_attributions.count({
          where: { referrerUserId: userId },
        }),
      ]);

    // Calculate total amounts
    const rewards = await prisma.affiliate_rewards.groupBy({
      by: ['status'],
      where: { userId },
      _sum: {
        currencyAmount: true,
        creditAmount: true,
      },
    });

    const getAmount = (status: string) => {
      const reward = rewards.find((r: any) => r.status === status);
      return {
        currencyAmount: reward?._sum.currencyAmount || 0,
        creditAmount: reward?._sum.creditAmount || 0,
      };
    };

    return {
      totalRewards,
      pendingRewards,
      clearedRewards,
      cancelledRewards,
      totalAttributions,
      amounts: {
        pending: getAmount('PENDING'),
        cleared: getAmount('CLEARED'),
        cancelled: getAmount('CANCELLED'),
      },
    };
  }

  /**
   * Approve a payout (affiliate reward)
   */
  static async approvePayout(payoutId: string, adminUserId: string, notes?: string) {
    const reward = await prisma.affiliate_rewards.findUnique({
      where: { id: payoutId },
    });

    if (!reward) {
      throw new Error('Payout not found');
    }

    if (reward.status !== 'PENDING') {
      throw new Error('Payout is not in pending status');
    }

    const updatedReward = await prisma.affiliate_rewards.update({
      where: { id: payoutId },
      data: {
        status: AffiliateRewardStatus.CLEARED,
        readyAt: new Date(),
      },
    });

    // Create audit log
    await prisma.payout_audit_log.create({
      data: {
        userId: reward.userId,
        rewardIds: [payoutId],
        action: 'APPROVED',
        amount: reward.currencyAmount,
        currencyCode: reward.currencyCode,
        performedBy: adminUserId,
        notes,
      },
    });

    affiliateLogger.logPayoutApproved({
      userId: reward.userId,
      rewardIds: [payoutId],
      totalAmount: Number(reward.currencyAmount),
      currency: reward.currencyCode || 'EUR',
      approvedBy: adminUserId,
    });

    return updatedReward;
  }

  /**
   * Reject a payout (affiliate reward)
   */
  static async rejectPayout(payoutId: string, adminUserId: string, reason: string) {
    const reward = await prisma.affiliate_rewards.findUnique({
      where: { id: payoutId },
    });

    if (!reward) {
      throw new Error('Payout not found');
    }

    if (reward.status !== 'PENDING') {
      throw new Error('Payout is not in pending status');
    }

    const updatedReward = await prisma.affiliate_rewards.update({
      where: { id: payoutId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Create audit log
    await prisma.payout_audit_log.create({
      data: {
        userId: reward.userId,
        rewardIds: [payoutId],
        action: 'REJECTED',
        amount: reward.currencyAmount,
        currencyCode: reward.currencyCode,
        performedBy: adminUserId,
        notes: reason,
      },
    });

    log.warn('[AFFILIATE] Payout rejected', {
      payoutId,
      userId: reward.userId,
      adminUserId,
      reason,
      amount: Number(reward.currencyAmount),
    });

    return updatedReward;
  }

  /**
   * Mark a payout as paid
   */
  static async markPayoutPaid(payoutId: string, adminUserId: string) {
    const reward = await prisma.affiliate_rewards.findUnique({
      where: { id: payoutId },
    });

    if (!reward) {
      throw new Error('Payout not found');
    }

    if (reward.status !== 'CLEARED') {
      throw new Error('Payout is not in cleared status');
    }

    // For now, just keep it as cleared since there's no SETTLED status
    // In a real implementation, you might want to add a SETTLED status to the enum
    const updatedReward = await prisma.affiliate_rewards.update({
      where: { id: payoutId },
      data: {
        settledAt: new Date(),
      },
    });

    // Create audit log
    await prisma.payout_audit_log.create({
      data: {
        userId: reward.userId,
        rewardIds: [payoutId],
        action: 'PAID',
        amount: reward.currencyAmount,
        currencyCode: reward.currencyCode,
        performedBy: adminUserId,
      },
    });

    log.warn('[AFFILIATE] Payout marked as paid', {
      payoutId,
      userId: reward.userId,
      adminUserId,
      amount: Number(reward.currencyAmount),
    });

    return updatedReward;
  }
}
