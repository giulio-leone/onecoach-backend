/**
 * Payment Confirm API Route
 *
 * POST: Conferma un Payment Intent con un Payment Method
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { paymentService } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse, getErrorMessage } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const userOrError: any = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await req.json();
    const { paymentIntentId, paymentMethodId } = body;

    if (!paymentIntentId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'paymentIntentId e paymentMethodId richiesti' },
        { status: 400 }
      );
    }

    // Conferma Payment Intent
    const paymentIntent = await paymentService.confirmPaymentIntent({
      paymentIntentId,
      paymentMethodId,
    });

    // Gestione 3D Secure se necessario
    if (paymentIntent.status === 'requires_action') {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
      });
    }

    // Pagamento completato
    if (paymentIntent.status === 'succeeded') {
      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
      });
    }

    // Altri stati (processing, etc.)
    return NextResponse.json({
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: unknown) {
    logError("Carta rifiutata. Verifica i dati della carta o prova con un'altra carta.", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });

    const errorMessage = getErrorMessage(error);

    // Gestione errori Stripe specifici
    if (errorMessage.includes('card_declined')) {
      return NextResponse.json(
        { error: "Carta rifiutata. Verifica i dati della carta o prova con un'altra carta." },
        { status: 400 }
      );
    }

    if (errorMessage.includes('insufficient_funds')) {
      return NextResponse.json({ error: 'Fondi insufficienti sulla carta.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Errore nella conferma del pagamento' }, { status: 500 });
  }
}
