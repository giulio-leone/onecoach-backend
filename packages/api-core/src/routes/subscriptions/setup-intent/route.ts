/**
 * Setup Intent API Route
 *
 * POST: Crea un Setup Intent per salvare un Payment Method per subscription future
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { subscriptionService } from '@giulio-leone/lib-core';
import type { SubscriptionPlan } from '@giulio-leone/types';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const userOrError: any = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await req.json();
    const { plan, promoCode, referralCode } = body;

    if (!plan || (plan !== 'PLUS' && plan !== 'PRO')) {
      return NextResponse.json({ error: 'Piano non valido' }, { status: 400 });
    }

    // Crea Setup Intent
    const setupIntent = await subscriptionService.createSetupIntent(
      userOrError.id,
      plan as SubscriptionPlan,
      promoCode,
      referralCode
    );

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error: unknown) {
    logError('Errore nella creazione del Setup Intent', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
