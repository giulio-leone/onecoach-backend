/**
 * Subscription Create API Route
 *
 * POST: Crea una nuova subscription
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { subscriptionService, SetupIntentService } from '@giulio-leone/lib-core';
import type { SubscriptionPlan } from '@giulio-leone/types';
import type Stripe from 'stripe';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const userOrError: any = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await req.json();
    const { setupIntentId, plan, promoCode, referralCode } = body;

    if (!setupIntentId) {
      return NextResponse.json({ error: 'setupIntentId richiesto' }, { status: 400 });
    }

    if (!plan || (plan !== 'PLUS' && plan !== 'PRO')) {
      return NextResponse.json({ error: 'Piano non valido' }, { status: 400 });
    }

    // Recupera Setup Intent per ottenere il Payment Method
    const setupIntent = await SetupIntentService.retrieveSetupIntent(setupIntentId);

    if (!setupIntent.payment_method) {
      return NextResponse.json(
        { error: 'Payment Method non trovato nel Setup Intent' },
        { status: 400 }
      );
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method.id;

    // Crea subscription
    const subscription = await subscriptionService.createSubscription(
      userOrError.id,
      paymentMethodId,
      plan as SubscriptionPlan,
      promoCode,
      referralCode
    );

    // Gestione 3D Secure se necessario (per il primo pagamento)
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    const paymentIntent =
      latestInvoice && 'payment_intent' in latestInvoice
        ? (latestInvoice.payment_intent as Stripe.PaymentIntent | null)
        : null;

    if (paymentIntent?.status === 'requires_action') {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
      });
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error: unknown) {
    logError('Errore nella creazione della subscription', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
