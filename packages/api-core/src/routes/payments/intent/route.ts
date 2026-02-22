/**
 * Payment Intent API Route
 *
 * POST: Crea un Payment Intent per pagamento one-time (crediti o marketplace)
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { paymentService } from '@giulio-leone/lib-core';
import { PromotionService, cartService, marketplaceService } from '@giulio-leone/lib-marketplace';
import type { PromotionValidationResult } from '@giulio-leone/lib-marketplace';
import { findCreditPackOption } from '@giulio-leone/constants';

import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Pagamento non disponibile: STRIPE_SECRET_KEY mancante' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { type, amount, planId, promoCode, cartId, referralCode } = body;

    const computeDiscount = (baseAmount: number, validation: PromotionValidationResult): number => {
      if (!validation.valid || !validation.promotion) return 0;
      const { discountType, discountValue } = validation.promotion;
      if (!discountType || !discountValue) return 0;
      if (discountType === 'PERCENTAGE') {
        return Math.max(0, (baseAmount * discountValue) / 100);
      }
      if (discountType === 'FIXED_AMOUNT') {
        return Math.max(0, discountValue);
      }
      return 0;
    };

    if (!type || (type !== 'credits' && type !== 'marketplace' && type !== 'cart')) {
      return NextResponse.json({ error: 'Tipo di pagamento non valido' }, { status: 400 });
    }

    if (type === 'cart') {
      const cart =
        cartId && typeof cartId === 'string'
          ? await cartService.getCart(cartId, userOrError.id)
          : await cartService.getOrCreateCart(userOrError.id);

      if (!cart) {
        return NextResponse.json({ error: 'Carrello non trovato' }, { status: 404 });
      }

      if (cart.cart_items.length === 0) {
        return NextResponse.json({ error: 'Carrello vuoto' }, { status: 400 });
      }

      // Gestione promozione lato cart se presente
      const finalAmount = Number(cart.total);

      const paymentIntent = await paymentService.createPaymentIntent({
        userId: userOrError.id,
        amount: finalAmount,
        currency: cart.currency || 'eur',
        type: 'cart',
        metadata: {
          type: 'cart',
          cartId: cart.id,
          promoCode: promoCode || null,
          referralCode: referralCode || null,
        },
        description: 'Checkout carrello',
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
      });
    }

    if (type === 'credits') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Importo crediti non valido' }, { status: 400 });
      }

      // Trova il pack crediti corrispondente
      const creditPack = findCreditPackOption(amount);
      if (!creditPack) {
        return NextResponse.json(
          { error: 'Importo crediti non valido. Usa uno dei pack disponibili.' },
          { status: 400 }
        );
      }

      // Applica promo code se presente
      let finalAmount = creditPack.price;
      let appliedPromo: { code?: string; discountAmount: number } | null = null;

      if (promoCode) {
        const promoValidation = await PromotionService.validatePromotionCode(promoCode);
        if (promoValidation.valid) {
          const discountAmount = computeDiscount(finalAmount, promoValidation);
          finalAmount = Math.max(0, finalAmount - discountAmount);
          appliedPromo = {
            code: promoValidation.promotion?.code ?? promoCode,
            discountAmount,
          };
        }
      }

      // Crea Payment Intent per crediti
      const paymentIntent = await paymentService.createPaymentIntent({
        userId: userOrError.id,
        amount: finalAmount,
        currency: 'eur',
        type: 'credits',
        metadata: {
          type: 'credits',
          creditAmount: amount,
          creditPackId: creditPack.id,
          promoCode: promoCode || null,
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
        creditAmount: amount,
        appliedPromo,
      });
    }

    if (type === 'marketplace') {
      if (!planId) {
        return NextResponse.json({ error: 'planId richiesto per marketplace' }, { status: 400 });
      }

      // Recupera il piano dal marketplace
      const plan = await marketplaceService.getPlan(planId);
      if (!plan) {
        return NextResponse.json({ error: 'Piano non trovato' }, { status: 404 });
      }

      // Applica promo code se presente
      let finalAmount = Number(plan.price);
      let appliedPromo: { code?: string; discountAmount: number } | null = null;

      if (promoCode) {
        const promoValidation = await PromotionService.validatePromotionCode(promoCode);
        if (promoValidation.valid) {
          const discountAmount = computeDiscount(finalAmount, promoValidation);
          finalAmount = Math.max(0, finalAmount - discountAmount);
          appliedPromo = {
            code: promoValidation.promotion?.code ?? promoCode,
            discountAmount,
          };
        }
      }

      // Crea Payment Intent per marketplace
      const paymentIntent = await paymentService.createPaymentIntent({
        userId: userOrError.id,
        amount: finalAmount,
        currency: 'eur',
        type: 'marketplace',
        metadata: {
          type: 'marketplace',
          planId,
          promoCode: promoCode || null,
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
        plan,
        appliedPromo,
      });
    }

    return NextResponse.json({ error: 'Tipo di pagamento non supportato' }, { status: 400 });
  } catch (error: unknown) {
    logError('Errore nella creazione del Payment Intent', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
