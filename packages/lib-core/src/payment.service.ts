/**
 * Payment Service
 *
 * Gestione Payment Intents per pagamenti one-time (crediti, marketplace)
 * Implementa IPaymentService contract
 */

import { getStripe } from './stripe';
import { prisma } from './prisma';
import type Stripe from 'stripe';
import type {
  IPaymentService,
  CreatePaymentIntentParams,
  ConfirmPaymentIntentParams,
} from '@giulio-leone/lib-shared';

/**
 * Payment Service
 */
export class PaymentService implements IPaymentService {
  /**
   * Crea un Payment Intent per pagamento one-time
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
    const { userId, amount, currency, type, metadata, description } = params;

    const stripe = getStripe();

    // Verifica che l'utente esista
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true },
    });

    if (!user) {
      throw new Error('Utente non trovato');
    }

    // Ottieni o crea Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customerParams: { email?: string; metadata: { userId: string } } = {
        metadata: {
          userId,
        },
      };

      if (user.email) {
        customerParams.email = String(user.email);
      }

      const customer = await stripe.customers.create(customerParams);
      customerId = customer.id;

      // Salva customer ID
      await prisma.users.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Crea Payment Intent con automatic payment methods per supportare Payment Element,
    // Link e wallet (Apple/Google Pay). Abilitiamo setup_future_usage per 1-click.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Converti in centesimi
      currency: currency.toLowerCase(),
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
      setup_future_usage: 'off_session',
      description: description || `Pagamento ${type}`,
      metadata: {
        userId,
        type,
        ...metadata,
      },
    });

    return paymentIntent;
  }

  /**
   * Conferma un Payment Intent con un Payment Method
   */
  async confirmPaymentIntent(params: ConfirmPaymentIntentParams): Promise<Stripe.PaymentIntent> {
    const { paymentIntentId, paymentMethodId } = params;

    const stripe = getStripe();

    // Conferma il Payment Intent
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return paymentIntent;
  }

  /**
   * Recupera un Payment Intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = getStripe();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }
}

export const paymentService: PaymentService = new PaymentService();
