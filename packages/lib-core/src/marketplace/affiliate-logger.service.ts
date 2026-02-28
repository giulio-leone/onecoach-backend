/**
 * Affiliate Logger Service
 *
 * Servizio per logging strutturato di eventi affiliate
 */

import { prisma } from '../prisma';
import { logger } from '@giulio-leone/lib-shared';

interface AffiliateEvent {
  event: string;
  userId?: string;
  referralCode?: string;
  rewardId?: string;
  attributionId?: string;
  level?: number;
  amount?: number;
  currency?: string;
  credits?: number;
  status?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

class AffiliateLogger {
  private logEvent(event: AffiliateEvent) {
    const logEntry = {
      ...event,
      timestamp: event.timestamp.toISOString(),
      service: 'affiliate',
    };

    // Log strutturato per console (può essere sostituito con logger avanzato come pino)
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[AFFILIATE]', JSON.stringify(logEntry, null, 2));
    } else {
      // In produzione, log come JSON line per parsing da log aggregators
      logger.warn(JSON.stringify(logEntry));
    }

    // TODO: In futuro, inviare a servizio di monitoring (Datadog, Sentry, etc.)
  }

  logRegistration(params: {
    userId: string;
    referralCode?: string;
    rewardIds?: string[];
    credits?: number;
  }) {
    this.logEvent({
      event: 'affiliate.registration',
      userId: params.userId,
      referralCode: params.referralCode,
      rewardId: params.rewardIds?.[0],
      credits: params.credits,
      timestamp: new Date(),
      metadata: {
        rewardCount: params.rewardIds?.length || 0,
      },
    });
  }

  logSubscription(params: {
    userId: string;
    referralCode?: string;
    invoiceId: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    commissionRewards?: Array<{ level: number; amount: number; userId: string }>;
  }) {
    this.logEvent({
      event: 'affiliate.subscription',
      userId: params.userId,
      referralCode: params.referralCode,
      amount: params.amount,
      currency: params.currency,
      timestamp: new Date(),
      metadata: {
        invoiceId: params.invoiceId,
        subscriptionId: params.subscriptionId,
        commissionCount: params.commissionRewards?.length || 0,
        commissions: params.commissionRewards?.map((c: any) => ({
          level: c.level,
          amount: c.amount,
          userId: c.userId,
        })),
      },
    });
  }

  logCancellation(params: { userId: string; attributionIds: string[]; graceEndAt: Date }) {
    this.logEvent({
      event: 'affiliate.cancellation',
      userId: params.userId,
      attributionId: params.attributionIds[0],
      timestamp: new Date(),
      metadata: {
        attributionCount: params.attributionIds.length,
        graceEndAt: params.graceEndAt.toISOString(),
      },
    });
  }

  logRewardReleased(params: {
    rewardId: string;
    userId: string;
    type: string;
    level: number;
    credits?: number;
    amount?: number;
    currency?: string;
  }) {
    this.logEvent({
      event: 'affiliate.reward.released',
      rewardId: params.rewardId,
      userId: params.userId,
      level: params.level,
      credits: params.credits,
      amount: params.amount,
      currency: params.currency,
      status: 'CLEARED',
      timestamp: new Date(),
      metadata: {
        type: params.type,
      },
    });
  }

  logPayoutCreated(params: {
    payoutId: string;
    userId: string;
    rewardIds: string[];
    totalAmount: number;
    currency: string;
  }) {
    this.logEvent({
      event: 'affiliate.payout.created',
      userId: params.userId,
      amount: params.totalAmount,
      currency: params.currency,
      timestamp: new Date(),
      metadata: {
        payoutId: params.payoutId,
        rewardCount: params.rewardIds.length,
        rewardIds: params.rewardIds,
      },
    });
  }

  logPayoutApproved(params: {
    userId: string;
    rewardIds: string[];
    totalAmount: number;
    currency: string;
    approvedBy: string;
  }) {
    this.logEvent({
      event: 'affiliate.payout.approved',
      userId: params.userId,
      amount: params.totalAmount,
      currency: params.currency,
      status: 'APPROVED',
      timestamp: new Date(),
      metadata: {
        rewardCount: params.rewardIds.length,
        rewardIds: params.rewardIds,
        approvedBy: params.approvedBy,
      },
    });
  }

  logError(params: {
    event: string;
    error: Error;
    userId?: string;
    metadata?: Record<string, unknown>;
  }) {
    this.logEvent({
      event: `affiliate.error.${params.event}`,
      userId: params.userId,
      timestamp: new Date(),
      metadata: {
        error: params.error.message,
        stack: params.error.stack,
        ...params.metadata,
      },
    });
  }

  error(message: string, error: unknown) {
    this.logError({
      event: 'generic_error',
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { message },
    });
  }

  // Metriche aggregate (per monitoring)
  async getMetrics(params?: { startDate?: Date; endDate?: Date }) {
    const start = params?.startDate ?? new Date(0);
    const end = params?.endDate ?? new Date();

    // Registrazioni: numero di attributions create nel periodo
    const registrationsRows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM referral_attributions
      WHERE createdAt BETWEEN ${start} AND ${end}
    `;
    const registrationsCountValue = registrationsRows[0]?.count;
    const totalRegistrations = registrationsCountValue ? Number(registrationsCountValue) : 0;

    // Attivazioni: attributions attivate nel periodo
    const subscriptionsRows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM referral_attributions
      WHERE status = 'ACTIVE'
        AND activatedAt IS NOT NULL
        AND activatedAt BETWEEN ${start} AND ${end}
    `;
    const subscriptionsCountValue = subscriptionsRows[0]?.count;
    const totalSubscriptions = subscriptionsCountValue ? Number(subscriptionsCountValue) : 0;

    // Commissioni: somma importi CLEARED nel periodo usando COALESCE(settledAt, readyAt)
    const commissionRows = await prisma.$queryRaw<{ sum: number | null; avg: number | null }[]>`
      SELECT
        COALESCE(SUM(currencyAmount::numeric), 0) AS sum,
        AVG(currencyAmount::numeric) AS avg
      FROM affiliate_rewards
      WHERE status = 'CLEARED'
        AND COALESCE(settledAt, readyAt) BETWEEN ${start} AND ${end}
    `;
    const totalCommissions = Number(commissionRows[0]?.sum ?? 0);
    const avgCommission = Number(commissionRows[0]?.avg ?? 0);

    const conversionRate =
      totalRegistrations > 0 ? (totalSubscriptions / totalRegistrations) * 100 : 0;

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      metrics: {
        totalRegistrations,
        totalSubscriptions,
        totalCommissions,
        avgCommission,
        conversionRate,
      },
    };
  }
}

export const affiliateLogger = new AffiliateLogger();
