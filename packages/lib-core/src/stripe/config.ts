/**
 * Stripe Configuration
 *
 * Configurazione piani e prodotti Stripe
 */

import type { PlanPricing, CreditPackPricing } from '@giulio-leone/types';
import {
  CREDIT_PACK_OPTIONS,
  getCreditPackPriceId,
  getCreditPackPricing,
} from '@giulio-leone/lib-shared';

/**
 * Piani abbonamento
 */
export const STRIPE_PLANS: {
  plus: PlanPricing;
  pro: PlanPricing;
} = {
  plus: {
    plan: 'PLUS',
    name: 'Plus',
    price: 9.99,
    currency: 'eur',
    interval: 'month',
    credits: 500,
    stripePriceId: process.env.STRIPE_PLUS_PLAN_PRICE_ID || '',
    features: [
      '500 crediti al mese',
      'Programmi allenamento illimitati',
      'Piani nutrizionali illimitati',
      'Supporto via email',
      'Accesso a tutti i modelli AI',
    ],
  },
  pro: {
    plan: 'PRO',
    name: 'Pro',
    price: 19.99,
    currency: 'eur',
    interval: 'month',
    credits: 'unlimited',
    stripePriceId: process.env.STRIPE_PRO_PLAN_PRICE_ID || '',
    features: [
      'Crediti illimitati',
      'Programmi allenamento illimitati',
      'Piani nutrizionali illimitati',
      'Supporto prioritario',
      'Accesso anticipato a nuove funzionalità',
      'Modelli AI premium',
    ],
  },
};

/**
 * Pacchetti crediti
 */
export const CREDIT_PACKS: CreditPackPricing[] = getCreditPackPricing();

export { CREDIT_PACK_OPTIONS, getCreditPackPriceId };

/**
 * Webhook events da gestire
 */
export const STRIPE_WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
} as const;
