import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth/config';
import { prisma as db } from '@giulio-leone/lib-core';
import {
  verifyAppleReceipt,
  verifyGoogleReceipt,
} from '@giulio-leone/lib-core/iap-verification.server';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import type { SubscriptionPlan } from '@giulio-leone/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/iap/restore-purchases
 * Restore previous purchases for the authenticated user
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { purchases } = body;

    if (!purchases || !Array.isArray(purchases)) {
      return NextResponse.json({ error: 'Invalid purchases data' }, { status: 400 });
    }

    let activeSubscription = null;
    let latestExpirationDate = 0;

    // Verify each purchase
    for (const purchase of purchases) {
      const { receipt, productId, platform, purchaseToken } = purchase;

      let verificationResult;

      if (platform === 'ios') {
        verificationResult = await verifyAppleReceipt(receipt);
      } else if (platform === 'android') {
        if (!purchaseToken) continue;
        verificationResult = await verifyGoogleReceipt(productId, purchaseToken);
      } else {
        continue;
      }

      // Keep track of the most recent active subscription
      if (
        verificationResult.valid &&
        verificationResult.subscription &&
        verificationResult.subscription.expirationDate > latestExpirationDate
      ) {
        activeSubscription = {
          ...verificationResult.subscription,
          platform: platform.toUpperCase(),
          platformSubscriptionId:
            platform === 'ios'
              ? verificationResult.subscription.originalTransactionId
              : purchaseToken,
        };
        latestExpirationDate = verificationResult.subscription.expirationDate;
      }
    }

    // Update database with the most recent active subscription
    if (activeSubscription) {
      const { createId } = await import('@giulio-leone/lib-shared/id-generator');
      const existingSubscription = await db.subscriptions.findFirst({
        where: { userId: session.user.id },
      });

      // Map productId to SubscriptionPlan enum
      const plan: SubscriptionPlan = activeSubscription.productId === 'PRO' ? 'PRO' : 'PLUS';

      if (existingSubscription) {
        await db.subscriptions.update({
          where: { id: existingSubscription.id },
          data: {
            status: 'ACTIVE',
            plan,
            currentPeriodStart: new Date(activeSubscription.purchaseDate),
            currentPeriodEnd: new Date(activeSubscription.expirationDate),
            cancelAtPeriodEnd: !activeSubscription.willAutoRenew,
            updatedAt: new Date(),
          },
        });
      } else {
        await db.subscriptions.create({
          data: {
            id: createId(),
            userId: session.user.id,
            status: 'ACTIVE',
            plan,
            currentPeriodStart: new Date(activeSubscription.purchaseDate),
            currentPeriodEnd: new Date(activeSubscription.expirationDate),
            cancelAtPeriodEnd: !activeSubscription.willAutoRenew,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        restored: true,
        subscription: {
          productId: activeSubscription.productId,
          expirationDate: activeSubscription.expirationDate,
          platform: activeSubscription.platform.toLowerCase(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      restored: false,
      message: 'No active subscriptions found',
    });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
