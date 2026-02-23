/**
 * Admin API: Affiliate Payouts Management
 *
 * Gestisce il workflow completo dei payout per reward affiliate
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { AffiliateRewardStatus, Prisma } from '@giulio-leone/types';
import { PayoutAuditService } from '@giulio-leone/lib-marketplace/payout-audit.service';
import { getCurrentUserId } from '@giulio-leone/lib-core';
import { affiliateLogger } from '@giulio-leone/lib-marketplace';
import { logger } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * GET: Lista payout disponibili (reward CLEARED raggruppati per utente)
 */
export async function GET(_req: Request) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get('userId');
    const statusParam = searchParams.get('status') as AffiliateRewardStatus | null;

    const where: Prisma.affiliate_rewardsWhereInput = {
      status: statusParam || AffiliateRewardStatus.CLEARED,
      type: 'SUBSCRIPTION_COMMISSION', // Solo commissioni monetarie per payout
    };

    if (userId) {
      where.userId = userId;
    }

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));

    // Fetch rewards grouped by user
    const rewards = await prisma.affiliate_rewards.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        affiliate_programs: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    // Group by user and calculate totals
    const payoutsByUser = new Map<
      string,
      {
        userId: string;
        userName: string;
        userEmail: string;
        rewards: typeof rewards;
        totalAmount: number;
        currency: string;
      }
    >();

    // Filter out rewards without userId and group by user
    const validRewards = rewards.filter((r) => r.userId !== null);
    for (const reward of validRewards) {
      const key = reward.userId!;
      if (!payoutsByUser.has(key)) {
        payoutsByUser.set(key, {
          userId: key,
          userName: reward.users?.name || 'N/D',
          userEmail: reward.users?.email || 'N/D',
          rewards: [],
          totalAmount: 0,
          currency: reward.currencyCode || 'EUR',
        });
      }

      const payout = payoutsByUser.get(key)!;
      payout.rewards.push(reward);
      if (reward.currencyAmount) {
        payout.totalAmount += Number(reward.currencyAmount);
      }
    }

    type PayoutEntry = {
      userId: string;
      userName: string;
      userEmail: string;
      rewards: typeof rewards;
      totalAmount: number;
      currency: string;
    };

    const payouts = Array.from(payoutsByUser.values()).map((payout: PayoutEntry) => ({
      ...payout,
      totalAmount: Number(payout.totalAmount.toFixed(2)),
      rewardsCount: payout.rewards.length,
    }));

    const total = await prisma.affiliate_rewards.count({ where });

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      totalAmount: payouts.reduce((sum: number, p) => sum + p.totalAmount, 0),
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Errore nel recupero dei payout' }, { status: 500 });
  }
}

/**
 * POST: Crea payout batch per uno o più utenti
 * Body: { userIds: string[] } o { rewardIds: string[] }
 */
export async function POST(_req: Request) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _req.json();
    const { userIds, rewardIds } = body;

    if (!userIds && !rewardIds) {
      return NextResponse.json({ error: 'Fornire userIds o rewardIds' }, { status: 400 });
    }

    let targetRewards;

    if (rewardIds && Array.isArray(rewardIds)) {
      targetRewards = await prisma.affiliate_rewards.findMany({
        where: {
          id: { in: rewardIds },
          status: AffiliateRewardStatus.CLEARED,
          type: 'SUBSCRIPTION_COMMISSION',
        },
      });
    } else if (userIds && Array.isArray(userIds)) {
      targetRewards = await prisma.affiliate_rewards.findMany({
        where: {
          userId: { in: userIds },
          status: AffiliateRewardStatus.CLEARED,
          type: 'SUBSCRIPTION_COMMISSION',
        },
      });
    } else {
      return NextResponse.json(
        { error: 'userIds e rewardIds devono essere array' },
        { status: 400 }
      );
    }

    if (targetRewards.length === 0) {
      return NextResponse.json(
        { error: 'Nessun reward CLEARED trovato per il payout' },
        { status: 404 }
      );
    }

    type RewardType = (typeof targetRewards)[number];

    // Verifica che tutti i reward siano ancora CLEARED
    const invalidRewards = targetRewards.filter(
      (r: RewardType) => r.status !== AffiliateRewardStatus.CLEARED
    );
    if (invalidRewards.length > 0) {
      return NextResponse.json(
        {
          error: `Alcuni reward non sono più CLEARED: ${invalidRewards.map((r: RewardType) => r.id).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Group by user (filter out null userIds)
    const rewardsByUser = new Map<string, RewardType[]>();
    for (const reward of targetRewards) {
      if (!reward.userId) continue;
      if (!rewardsByUser.has(reward.userId)) {
        rewardsByUser.set(reward.userId, []);
      }
      rewardsByUser.get(reward.userId)!.push(reward);
    }

    const payoutSummary = Array.from(rewardsByUser.entries()).map(
      ([userId, userRewards]: [string, RewardType[]]) => {
        const totalAmount = userRewards.reduce(
          (sum: number, r: RewardType) => sum + Number(r.currencyAmount || 0),
          0
        );
        return {
          userId,
          rewardIds: userRewards.map((r: RewardType) => r.id),
          rewardCount: userRewards.length,
          totalAmount: Number(totalAmount.toFixed(2)),
          currency: userRewards[0]?.currencyCode || 'EUR',
        };
      }
    );

    // Audit log per creazione payout batch
    const adminUserId = await getCurrentUserId();
    if (adminUserId) {
      for (const summary of payoutSummary) {
        await PayoutAuditService.createAuditLog({
          userId: summary.userId,
          rewardIds: summary.rewardIds,
          action: 'CREATED',
          amount: summary.totalAmount,
          currencyCode: summary.currency,
          performedBy: adminUserId,
          notes: `Payout batch creato per ${summary.rewardCount} reward`,
          metadata: {
            rewardCount: summary.rewardCount,
          },
        });

        // Log strutturato
        affiliateLogger.logPayoutCreated({
          payoutId: `batch_${Date.now()}`,
          userId: summary.userId,
          rewardIds: summary.rewardIds,
          totalAmount: summary.totalAmount,
          currency: summary.currency,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Creato payout batch per ${payoutSummary.length} utente/i`,
      summary: payoutSummary,
      totalRewards: targetRewards.length,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Errore nella creazione del payout' }, { status: 500 });
  }
}

/**
 * PUT: Approva payout (aggiorna reward status a SETTLED tramite settledAt)
 * Body: { rewardIds: string[] }
 */
export async function PUT(_req: Request) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _req.json();
    const { rewardIds } = body;

    if (!rewardIds || !Array.isArray(rewardIds) || rewardIds.length === 0) {
      return NextResponse.json({ error: 'Fornire array di rewardIds' }, { status: 400 });
    }

    // Verifica che tutti i reward siano CLEARED
    const rewards = await prisma.affiliate_rewards.findMany({
      where: {
        id: { in: rewardIds },
      },
    });

    type PUTRewardType = (typeof rewards)[number];

    const invalidRewards = rewards.filter(
      (r: PUTRewardType) => r.status !== AffiliateRewardStatus.CLEARED || r.settledAt !== null
    );
    if (invalidRewards.length > 0) {
      return NextResponse.json(
        {
          error: `Alcuni reward non possono essere approvati: ${invalidRewards.map((r: PUTRewardType) => r.id).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Aggiorna reward impostando settledAt
    // Nota: Non abbiamo status SETTLED nello schema, usiamo settledAt come indicatore
    const now = new Date();
    const updated = await prisma.affiliate_rewards.updateMany({
      where: {
        id: { in: rewardIds },
        status: AffiliateRewardStatus.CLEARED,
        settledAt: null,
      },
      data: {
        settledAt: now,
      },
    });

    // Recupera reward aggiornati per calcolare totali e audit log
    const updatedRewards = await prisma.affiliate_rewards.findMany({
      where: { id: { in: rewardIds } },
      select: {
        id: true,
        userId: true,
        currencyAmount: true,
        currencyCode: true,
      },
    });

    type UpdatedRewardType = (typeof updatedRewards)[number];

    // Group by user for audit log (filter out null userIds)
    const rewardsByUser = new Map<string, UpdatedRewardType[]>();
    for (const reward of updatedRewards) {
      if (!reward.userId) continue;
      if (!rewardsByUser.has(reward.userId)) {
        rewardsByUser.set(reward.userId, []);
      }
      rewardsByUser.get(reward.userId)!.push(reward);
    }

    // Audit log per approvazione payout
    const adminUserId = await getCurrentUserId();
    if (adminUserId) {
      for (const [userId, userRewards] of rewardsByUser.entries()) {
        const totalAmount = userRewards.reduce(
          (sum: number, r: UpdatedRewardType) => sum + Number(r.currencyAmount || 0),
          0
        );
        await PayoutAuditService.createAuditLog({
          userId,
          rewardIds: userRewards.map((r: UpdatedRewardType) => r.id),
          action: 'APPROVED',
          amount: Number(totalAmount.toFixed(2)),
          currencyCode: userRewards[0]?.currencyCode || 'EUR',
          performedBy: adminUserId,
          notes: `Payout approvato per ${userRewards.length} reward`,
          metadata: {
            rewardCount: userRewards.length,
          },
        });

        // Log strutturato
        affiliateLogger.logPayoutApproved({
          userId,
          rewardIds: userRewards.map((r: UpdatedRewardType) => r.id),
          totalAmount: Number(totalAmount.toFixed(2)),
          currency: userRewards[0]?.currencyCode || 'EUR',
          approvedBy: adminUserId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Approvati ${updated.count} payout`,
      approvedCount: updated.count,
      settledAt: now.toISOString(),
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    return NextResponse.json({ error: "Errore nell'approvazione del payout" }, { status: 500 });
  }
}
