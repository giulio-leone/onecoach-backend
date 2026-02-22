import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth/config';
import { prisma as db } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * GET /api/iap/subscription-status
 * Get current subscription status for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const subscription = await db.subscriptions.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json({
        subscription: {
          isActive: false,
          productId: null,
          expirationDate: null,
          isInTrialPeriod: false,
          willAutoRenew: false,
          platform: null,
        },
      });
    }

    const now = new Date();
    const isActive = subscription.status === 'ACTIVE' && subscription.currentPeriodEnd > now;

    return NextResponse.json({
      subscription: {
        isActive,
        productId: subscription.plan,
        expirationDate: subscription.currentPeriodEnd.getTime(),
        isInTrialPeriod: false, // trialEnd non esiste nel schema
        willAutoRenew: subscription.cancelAtPeriodEnd !== true,
        platform: null, // platform non esiste nel schema
      },
    });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
