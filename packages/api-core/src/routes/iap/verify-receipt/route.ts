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
 * POST /api/iap/verify-receipt
 * Verify iOS or Android in-app purchase receipt
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receipt, productId, platform, purchaseToken } = body;

    if (!receipt || !productId || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let verificationResult;

    if (platform === 'ios') {
      // Verify Apple receipt
      verificationResult = await verifyAppleReceipt(receipt);
    } else if (platform === 'android') {
      // Verify Google receipt
      if (!purchaseToken) {
        return NextResponse.json({ error: 'Purchase token required for Android' }, { status: 400 });
      }
      verificationResult = await verifyGoogleReceipt(productId, purchaseToken);
    } else {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    if (!verificationResult.valid) {
      return NextResponse.json({
        valid: false,
        error: 'Receipt verification failed',
      });
    }

    // Store/update subscription in database
    const { createId } = await import('@giulio-leone/lib-shared/id-generator');
    const existingSubscription = await db.subscriptions.findFirst({
      where: { userId: session.user.id },
    });

    // Map productId to SubscriptionPlan enum
    const plan: SubscriptionPlan =
      verificationResult.subscription!.productId === 'PRO' ? 'PRO' : 'PLUS';

    if (existingSubscription) {
      await db.subscriptions.update({
        where: { id: existingSubscription.id },
        data: {
          status: 'ACTIVE',
          plan,
          currentPeriodStart: new Date(verificationResult.subscription!.purchaseDate),
          currentPeriodEnd: new Date(verificationResult.subscription!.expirationDate),
          cancelAtPeriodEnd: !verificationResult.subscription!.willAutoRenew,
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
          currentPeriodStart: new Date(verificationResult.subscription!.purchaseDate),
          currentPeriodEnd: new Date(verificationResult.subscription!.expirationDate),
          cancelAtPeriodEnd: !verificationResult.subscription!.willAutoRenew,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      valid: true,
      subscription: {
        productId: verificationResult.subscription!.productId,
        expirationDate: verificationResult.subscription!.expirationDate,
        isActive: true,
        isInTrial: verificationResult.subscription!.isInTrial || false,
        willAutoRenew: verificationResult.subscription!.willAutoRenew || true,
      },
    });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
