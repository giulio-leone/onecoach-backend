/**
 * Stripe Server Client
 *
 * Client Stripe per operazioni server-side
 */

import Stripe from 'stripe';

/**
 * Restituisce un'istanza Stripe inizializzata
 */
export function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY non configurata');
  }
  return new Stripe(secret, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
    appInfo: {
      name: 'onecoach',
      version: '0.1.0',
    },
  });
}
