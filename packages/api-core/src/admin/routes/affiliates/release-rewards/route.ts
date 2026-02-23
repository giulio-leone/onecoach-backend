/**
 * Admin API: Release Affiliate Rewards
 *
 * Gestisce il rilascio manuale dei reward pending
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { AffiliateService } from '@giulio-leone/lib-marketplace';
import { prisma } from '@giulio-leone/lib-core';
import { AffiliateRewardStatus } from '@giulio-leone/types';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

/**
 * GET: Statistiche reward pending
 */
export async function GET() {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const now = new Date();

    const [pendingRewards, expiredRewardsCount] = await Promise.all([
      prisma.affiliate_rewards.findMany({
        where: {
          status: AffiliateRewardStatus.PENDING,
          pendingUntil: { lte: now },
        },
        select: {
          id: true,
          type: true,
          creditAmount: true,
          currencyAmount: true,
          currencyCode: true,
          userId: true,
          pendingUntil: true,
        },
      }),
      prisma.affiliate_rewards.count({
        where: {
          status: AffiliateRewardStatus.PENDING,
          pendingUntil: { lte: now },
        },
      }),
    ]);

    type PendingRewardType = (typeof pendingRewards)[number];

    const totalPendingCredits = pendingRewards
      .filter((r: PendingRewardType) => r.type === 'REGISTRATION_CREDIT')
      .reduce((sum: number, r: PendingRewardType) => sum + Number(r.creditAmount || 0), 0);

    const totalPendingCurrency = pendingRewards
      .filter((r: PendingRewardType) => r.type === 'SUBSCRIPTION_COMMISSION')
      .reduce((sum: number, r: PendingRewardType) => sum + Number(r.currencyAmount || 0), 0);

    return NextResponse.json({
      stats: {
        totalExpired: expiredRewardsCount,
        totalPendingCredits,
        totalPendingCurrency,
        byType: {
          registrationCredits: pendingRewards.filter(
            (r: PendingRewardType) => r.type === 'REGISTRATION_CREDIT'
          ).length,
          subscriptionCommissions: pendingRewards.filter(
            (r: PendingRewardType) => r.type === 'SUBSCRIPTION_COMMISSION'
          ).length,
        },
      },
      rewards: pendingRewards.slice(0, 50), // Limit per performance
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle statistiche reward' },
      { status: 500 }
    );
  }
}

/**
 * POST: Rilascia reward pending scaduti
 */
export async function POST() {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const referenceDate = new Date();
    const releasedCount = await AffiliateService.releasePendingRewards(referenceDate);

    return NextResponse.json({
      success: true,
      releasedCount,
      referenceDate,
      message: `Rilasciati ${releasedCount} reward pending`,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Errore nel rilascio dei reward pending' }, { status: 500 });
  }
}
