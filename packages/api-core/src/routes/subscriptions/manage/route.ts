/**
 * Subscription Manage API Route
 *
 * GET: Ottiene subscription attiva
 * PUT: Aggiorna subscription (upgrade/downgrade)
 * DELETE: Cancella subscription
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { subscriptionService } from '@giulio-leone/lib-core';
import { getStripe } from '@giulio-leone/lib-core/stripe';
import { prisma } from '@giulio-leone/lib-core';
import type { SubscriptionPlan } from '@giulio-leone/types';
import { logError, getErrorMessage, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const subscription = await subscriptionService.getActiveSubscription(userOrError.id);

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription });
  } catch (error: unknown) {
    logError('Errore nel recupero della subscription', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function PUT(req: Request) {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await req.json();
    const { plan } = body;

    if (!plan || (plan !== 'PLUS' && plan !== 'PRO')) {
      return NextResponse.json({ error: 'Piano non valido' }, { status: 400 });
    }

    const subscription = await subscriptionService.getActiveSubscription(userOrError.id);

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Subscription non trovata' }, { status: 404 });
    }

    const stripe = getStripe();
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // Aggiorna subscription con nuovo price
    const newPriceId =
      plan === 'PLUS'
        ? process.env.STRIPE_PLUS_PLAN_PRICE_ID!
        : process.env.STRIPE_PRO_PLAN_PRICE_ID!;

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: stripeSubscription.items.data[0]?.id ?? '',
          price: newPriceId,
        },
      ],
      metadata: {
        ...stripeSubscription.metadata,
        plan,
      },
    });

    // Aggiorna database
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        plan: plan as SubscriptionPlan,
        stripePriceId: newPriceId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logError("Errore nell'aggiornamento della subscription", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function DELETE() {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    await subscriptionService.cancelSubscription(userOrError.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logError('Errore nella cancellazione della subscription', error);
    const errorMessage = getErrorMessage(error);

    if (errorMessage.includes('non trovato')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
