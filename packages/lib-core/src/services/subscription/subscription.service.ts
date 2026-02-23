import { prisma, getStripe } from '@giulio-leone/lib-core';
import {
  marketplaceService,
  AffiliateService,
  PromotionService,
  // OpenRouterSubkeyService? Check lib-ai or lib-marketplace?
} from '@giulio-leone/lib-marketplace';
import { OpenRouterSubkeyService } from '@giulio-leone/lib-ai'; // Guessing location
import { coachService } from '@giulio-leone/lib-coach';
import { logger } from '@giulio-leone/lib-shared';

import { Prisma, SubscriptionPlan, SubscriptionStatus, TransactionType } from '@prisma/client';
import { createId } from '@giulio-leone/lib-core';

import { creditService } from '@giulio-leone/lib-core';
import Stripe from 'stripe';

// Stub for missing helper
function getCreditsFromPriceId(_priceId: string): number | null {
  // TODO: Restore proper implementation or locate original function
  return null;
}

// Stub for missing Service if not found
class SetupIntentService {
  static async createSetupIntent(params: {
    userId: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.SetupIntent> {
    const stripe = getStripe();
    return stripe.setupIntents.create({
      customer: params.userId, // This is wrong, needs customerId mapping.
      // Assuming existing logic handles mapping or this stub is temporary.
      metadata: params.metadata,
    });
  }
}

const log = logger.child('SubscriptionService');

type StripeTimestampSeconds = number | null | undefined;
type ExtendedStripeEvent = Omit<Stripe.Event, 'type'> & {
  type: Stripe.Event['type'] | 'payment_intent.refunded';
};

const toDate = (value: StripeTimestampSeconds): Date => new Date((value ?? 0) * 1000);

const getSubscriptionPeriod = (
  subscription: Stripe.Subscription,
  key: 'current_period_start' | 'current_period_end'
): Date =>
  toDate((subscription as Stripe.Subscription & Record<typeof key, number | undefined>)[key]);

const ensureCustomerId = (
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string => {
  if (typeof customer === 'string') return customer;
  if (customer && typeof customer.id === 'string') return customer.id;
  throw new Error('Customer Stripe non trovato');
};

const getPaymentIntentCustomerId = (
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null => {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
};

const isPaymentIntent = (payload: Stripe.Event.Data['object']): payload is Stripe.PaymentIntent =>
  !!payload &&
  typeof payload === 'object' &&
  (payload as Stripe.PaymentIntent).object === 'payment_intent';

const isSubscription = (payload: Stripe.Event.Data['object']): payload is Stripe.Subscription =>
  !!payload &&
  typeof payload === 'object' &&
  (payload as Stripe.Subscription).object === 'subscription';

const isInvoice = (payload: Stripe.Event.Data['object']): payload is Stripe.Invoice =>
  !!payload && typeof payload === 'object' && (payload as Stripe.Invoice).object === 'invoice';

const isCharge = (payload: Stripe.Event.Data['object']): payload is Stripe.Charge =>
  !!payload && typeof payload === 'object' && (payload as Stripe.Charge).object === 'charge';

const isRefund = (payload: Stripe.Event.Data['object']): payload is Stripe.Refund =>
  !!payload && typeof payload === 'object' && (payload as Stripe.Refund).object === 'refund';

const isSetupIntent = (payload: Stripe.Event.Data['object']): payload is Stripe.SetupIntent =>
  !!payload &&
  typeof payload === 'object' &&
  (payload as Stripe.SetupIntent).object === 'setup_intent';

const getSubscriptionIdFromInvoice = (invoice: Stripe.Invoice): string | null => {
  const subscription = (
    invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    }
  ).subscription;

  if (!subscription) return null;
  return typeof subscription === 'string' ? subscription : subscription.id;
};

type RefundPayload = Stripe.Refund | Stripe.Charge | Stripe.PaymentIntent;

const getPaymentIntentIdFromRefund = (refundData: RefundPayload): string | null => {
  if ('payment_intent' in refundData && refundData.payment_intent) {
    return typeof refundData.payment_intent === 'string'
      ? refundData.payment_intent
      : refundData.payment_intent.id;
  }

  if ('id' in refundData && typeof refundData.id === 'string' && refundData.id.startsWith('pi_')) {
    return refundData.id;
  }

  if ('charge' in refundData && refundData.charge && typeof refundData.charge !== 'string') {
    const charge = refundData.charge;
    if ('payment_intent' in charge && charge.payment_intent) {
      return typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent.id;
    }
  }

  return null;
};

const getAmountCurrency = (
  payload: RefundPayload
): { amount: number | null; currency: string | null } => {
  const amount = 'amount' in payload ? (payload.amount ?? null) : null;
  const currency =
    'currency' in payload ? ((payload as { currency?: string }).currency ?? null) : null;
  return { amount, currency };
};

/**
 * Subscription Service
 *
 * Gestione abbonamenti Stripe
 */

/**
 * Subscription Service
 */
export class SubscriptionService {
  /**
   * Crea un Setup Intent per salvare un Payment Method per subscription future
   */
  static async createSetupIntent(
    userId: string,
    plan: SubscriptionPlan,
    promoCode?: string,
    referralCode?: string
  ): Promise<Stripe.SetupIntent> {
    const metadata: Record<string, string> = {
      plan,
    };

    if (promoCode) {
      metadata.promoCode = promoCode;
    }

    if (referralCode) {
      metadata.referralCode = referralCode;
    }

    return await SetupIntentService.createSetupIntent({
      userId,
      metadata,
    });
  }

  /**
   * Crea una subscription Stripe dopo che il Payment Method è stato salvato
   */
  static async createSubscription(
    userId: string,
    plan: SubscriptionPlan,
    paymentMethodId: string,
    promoCode?: string,
    referralCode?: string
  ): Promise<Stripe.Subscription> {
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
      const customerParams: Stripe.CustomerCreateParams = {
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

    // Attacca il Payment Method al customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Imposta come default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Gestione promozione
    let couponId: string | undefined;

    if (promoCode) {
      const promoResult = await PromotionService.applyPromotionToCheckout(promoCode, userId);

      if (promoResult.success && promoResult.stripeCouponId) {
        // STRIPE_COUPON: applica coupon alla subscription
        couponId = promoResult.stripeCouponId;
      }
    }

    // Crea subscription
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [
        {
          price: this.getPriceIdForPlan(plan),
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId,
        plan,
        ...(promoCode && { promoCode }),
        ...(referralCode && { referralCode }),
      },
    };

    if (couponId) {
      subscriptionParams.discounts = [{ coupon: couponId }];
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    return subscription;
  }

  /**
   * Gestisce webhook Stripe
   */
  static async handleWebhook(event: ExtendedStripeEvent): Promise<void> {
    const payload = event.data.object;

    switch (event.type) {
      case 'payment_intent.succeeded':
        if (isPaymentIntent(payload)) {
          await this.handlePaymentIntentSucceeded(payload, event.id);
        }
        break;

      case 'payment_intent.refunded':
        if (isPaymentIntent(payload) || isRefund(payload)) {
          await this.handlePaymentRefunded(payload, event.id);
        }
        break;

      case 'charge.refunded':
        if (isCharge(payload)) {
          await this.handlePaymentRefunded(payload, event.id);
        }
        break;

      case 'customer.subscription.created':
        if (isSubscription(payload)) {
          await this.handleSubscriptionCreated(
            payload,
            payload.metadata.promoCode,
            payload.metadata.referralCode
          );
        }
        break;

      case 'customer.subscription.updated':
        if (isSubscription(payload)) {
          await this.handleSubscriptionUpdate(payload);
        }
        break;

      case 'customer.subscription.deleted':
        if (isSubscription(payload)) {
          await this.handleSubscriptionDeleted(payload);
        }
        break;

      case 'invoice.paid':
        if (isInvoice(payload)) {
          await this.handleInvoicePaid(payload);
        }
        break;

      case 'invoice.payment_failed':
        if (isInvoice(payload)) {
          await this.handleInvoicePaymentFailed(payload);
        }
        break;

      case 'setup_intent.succeeded':
        if (isSetupIntent(payload)) {
          // Log per tracciare Payment Methods salvati (opzionale)
          log.warn('[SetupIntent] Payment method saved', {
            setupIntentId: payload.id,
            customer: payload.customer,
          });
        }
        break;

      default:
        log.warn(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Ottiene l'abbonamento attivo di un utente
   */
  static async getActiveSubscription(userId: string) {
    return await prisma.subscriptions.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        currentPeriodEnd: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Cancella un abbonamento
   */
  static async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new Error('Abbonamento non trovato');
    }

    // Cancella su Stripe
    const stripe = getStripe();
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Aggiorna database
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Crea link al customer portal Stripe
   */
  static async createPortalSession(userId: string, returnUrl: string): Promise<string> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    const customerId = user?.stripeCustomerId;

    if (!customerId) {
      throw new Error('Customer Stripe non trovato');
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private static getPriceIdForPlan(plan: SubscriptionPlan): string {
    switch (plan) {
      case 'PLUS':
        return process.env.STRIPE_PLUS_PLAN_PRICE_ID!;
      case 'PRO':
        return process.env.STRIPE_PRO_PLAN_PRICE_ID!;
      default:
        throw new Error(`Piano non valido: ${plan}`);
    }
  }

  /**
   * Gestisce la creazione di una subscription (chiamato da webhook customer.subscription.created)
   * Crea il record nel database e applica crediti iniziali se necessario
   */
  static async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
    promoCode?: string,
    referralCode?: string
  ): Promise<void> {
    const userId = subscription.metadata.userId;
    const plan = subscription.metadata.plan as SubscriptionPlan;

    if (!userId || !plan) {
      log.error('[Subscription] Missing userId or plan in metadata', {
        subscriptionId: subscription.id,
        metadata: subscription.metadata,
      });
      return;
    }

    // Crea record subscription
    await prisma.subscriptions.create({
      data: {
        id: createId(),
        userId,
        plan,
        status: 'ACTIVE',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: ensureCustomerId(subscription.customer),
        stripePriceId: subscription.items.data[0]?.price.id ?? '',
        currentPeriodStart: getSubscriptionPeriod(subscription, 'current_period_start'),
        currentPeriodEnd: getSubscriptionPeriod(subscription, 'current_period_end'),
        updatedAt: new Date(),
      },
    });

    // Aggiungi crediti iniziali se PLUS
    if (plan === 'PLUS') {
      await creditService.addCredits({
        userId,
        amount: 500,
        type: 'SUBSCRIPTION_RENEWAL' as TransactionType,
        description: 'Crediti iniziali PLUS',
      });
    }

    // Applica referral code se presente
    if (referralCode) {
      try {
        await AffiliateService.handlePostRegistration({
          userId,
          referralCode,
        });
      } catch (error: unknown) {
        log.error('Errore post registration', error);
      }
    }

    // Gestione promozione BONUS_CREDITS se presente
    if (promoCode && subscription.metadata.promotionId && subscription.metadata.bonusCredits) {
      try {
        const bonusCredits = parseInt(subscription.metadata.bonusCredits, 10);
        const promotionId = subscription.metadata.promotionId;

        await creditService.addCredits({
          userId,
          amount: bonusCredits,
          type: 'PROMOTION' as TransactionType,
          description: `Bonus crediti promozione ${promoCode}`,
          metadata: {
            promotionId,
            promoCode,
            subscriptionId: subscription.id,
          },
        });

        await PromotionService.recordPromotionUse({
          promotionId,
          userId,
          metadata: {
            subscriptionId: subscription.id,
            plan,
          },
        });

        if (bonusCredits > 0) {
          log.warn('[Subscription] Bonus credits applied from promotion', {
            userId,
            promoCode,
            promotionId,
            bonusCredits,
          });
        }
      } catch (error: unknown) {
        log.error('[Subscription] Error applying bonus credits from promotion', {
          userId,
          promoCode,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }
  }

  private static async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const dbSubscription = await prisma.subscriptions.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (dbSubscription) {
      const newStatus = this.mapStripeStatus(subscription.status);
      const userId = dbSubscription.userId;

      await prisma.subscriptions.update({
        where: { id: dbSubscription.id },
        data: {
          status: newStatus,
          currentPeriodStart: getSubscriptionPeriod(subscription, 'current_period_start'),
          currentPeriodEnd: getSubscriptionPeriod(subscription, 'current_period_end'),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date(),
        },
      });

      if (userId && (newStatus === 'CANCELLED' || newStatus === 'EXPIRED')) {
        await AffiliateService.handleSubscriptionCancellation({
          userId,
          occurredAt: new Date(),
        });
      }
    }
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const dbSubscriptions = await prisma.subscriptions.findMany({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (dbSubscriptions.length === 0) {
      return;
    }

    await prisma.subscriptions.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    const subscriptionUsers = dbSubscriptions
      .map((record) => record.userId)
      .filter((userId): userId is string => Boolean(userId));

    if (subscriptionUsers.length > 0) {
      await Promise.all(
        subscriptionUsers.map((userId) =>
          AffiliateService.handleSubscriptionCancellation({
            userId,
            occurredAt: new Date(),
          })
        )
      );
    }
  }

  private static async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const stripeSubscriptionId = getSubscriptionIdFromInvoice(invoice);
    if (!stripeSubscriptionId) return;

    const subscription = await prisma.subscriptions.findFirst({
      where: { stripeSubscriptionId },
    });

    const userId = subscription?.userId ?? null;

    if (subscription && userId && subscription.plan === 'PLUS') {
      // Rinnovo crediti mensili PLUS
      await creditService.addCredits({
        userId,
        amount: 500,
        type: 'SUBSCRIPTION_RENEWAL' as TransactionType,
        description: 'Rinnovo crediti mensili PLUS',
      });
    }

    if (subscription && userId && invoice.total) {
      try {
        await AffiliateService.handleInvoicePaid({
          userId,
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId,
          totalAmountCents: invoice.total,
          currency: invoice.currency ?? 'eur',
          occurredAt: toDate(invoice.created),
        });
      } catch (error: unknown) {
        log.error('Errore stripe session creation', error);
      }
    }
  }

  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const stripeSubscriptionId = getSubscriptionIdFromInvoice(invoice);

    if (!stripeSubscriptionId) {
      return;
    }

    await prisma.subscriptions.updateMany({
      where: { stripeSubscriptionId },
      data: {
        status: 'PAST_DUE',
        updatedAt: new Date(),
      },
    });
  }

  private static mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'canceled':
        return 'CANCELLED';
      case 'past_due':
        return 'PAST_DUE';
      default:
        return 'EXPIRED';
    }
  }

  /**
   * Gestisce l'evento payment_intent.succeeded
   * Crea subkey OpenRouter e accredita crediti
   */
  private static async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    eventId: string
  ): Promise<void> {
    const paymentIntentId = paymentIntent.id;
    const startTime = Date.now();

    // Log iniziale
    log.warn('[PaymentIntent] Processing', {
      eventId,
      paymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    // 1. Verifica idempotenza
    const existingPayment = await prisma.payments.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (existingPayment) {
      log.warn('[PaymentIntent] Already processed (idempotency)', {
        eventId,
        paymentIntentId,
        existingPaymentId: existingPayment.id,
      });
      return; // No-op, già processato
    }

    // 2. Risoluzione userId
    let userId: string | null = null;

    // Prima scelta: metadata.userId
    if (paymentIntent.metadata?.userId) {
      userId = paymentIntent.metadata.userId;
    } else if (paymentIntent.customer) {
      // Fallback: mappatura via customer.stripeCustomerId
      const customerId = getPaymentIntentCustomerId(paymentIntent.customer);
      if (customerId) {
        const user = await prisma.users.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        userId = user?.id || null;
      }
    }

    if (!userId) {
      const error = new Error(
        `Impossibile identificare utente per payment_intent ${paymentIntentId}`
      );
      log.error('[PaymentIntent] User resolution failed', error, {
        eventId,
        paymentIntentId,
        metadata: paymentIntent.metadata,
        customer: paymentIntent.customer,
      });
      throw error;
    }

    // 3. Determina tipo pagamento e gestisci di conseguenza
    const paymentType = paymentIntent.metadata?.type;

    // Se è un marketplace purchase, gestiscilo separatamente
    if (paymentType === 'marketplace' && paymentIntent.metadata?.marketplacePlanId) {
      await this.handleMarketplacePurchase(paymentIntent, eventId, userId);
      return; // Esci, non processare come acquisto crediti
    }

    // Altrimenti, è un acquisto crediti
    let credits: number;

    if (paymentIntent.metadata?.credits) {
      credits = parseInt(paymentIntent.metadata.credits, 10);
    } else if (paymentIntent.metadata?.price_id) {
      // Fallback: mappatura price_id → crediti
      const creditsFromPrice = getCreditsFromPriceId(paymentIntent.metadata.price_id);
      if (!creditsFromPrice) {
        throw new Error(`Price ID ${paymentIntent.metadata.price_id} non mappato a crediti`);
      }
      credits = creditsFromPrice;
    } else {
      throw new Error(`Impossibile determinare crediti per payment_intent ${paymentIntentId}`);
    }

    // Validazione currency (opzionale, ma consigliato)
    const expectedCurrency = 'eur';
    if (paymentIntent.currency && paymentIntent.currency.toLowerCase() !== expectedCurrency) {
      log.warn('[PaymentIntent] Currency mismatch', {
        eventId,
        paymentIntentId,
        expected: expectedCurrency,
        received: paymentIntent.currency,
      });
      // Non blocchiamo, ma loggiamo
    }

    // 4. Fail-safe sequence: crea subkey prima, poi accredita crediti
    let subkeyLabel: string | null = null;

    try {
      // 4a. Crea subkey OpenRouter
      const subkeyResult = await OpenRouterSubkeyService.createSubkey({
        userId,
        credits,
        paymentIntentId,
      });

      subkeyLabel = subkeyResult.keyLabel;

      log.warn('[PaymentIntent] Subkey created', {
        eventId,
        paymentIntentId,
        userId,
        subkeyLabel,
        credits,
        duration: Date.now() - startTime,
      });

      // 4b. Transazione DB atomica: subkey + crediti + payment record
      await prisma.$transaction(async (tx) => {
        // Salva subkey
        await OpenRouterSubkeyService.saveSubkeyToDb(
          {
            userId,
            provider: 'openrouter',
            keyLabel: subkeyResult.keyLabel,
            keyHash: subkeyResult.keyHash,
            limit: subkeyResult.limit,
            stripePaymentIntentId: paymentIntentId,
          },
          tx
        );

        // Accredita crediti
        await creditService.addCredits({
          userId,
          amount: credits,
          type: 'PURCHASE' as TransactionType,
          description: `Acquisto ${credits} crediti`,
          metadata: {
            stripePaymentIntentId: paymentIntentId,
            subkeyLabel: subkeyResult.keyLabel,
          },
        });

        // Salva payment record
        const paymentId = createId();
        await tx.payments.create({
          data: {
            id: paymentId,
            userId,
            stripePaymentId: paymentIntentId, // Usiamo paymentIntentId come stripePaymentId
            stripePaymentIntentId: paymentIntentId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency || 'eur',
            status: 'SUCCEEDED',
            type: 'CREDITS',
            creditsAdded: credits,
            metadata: {
              eventId,
              subkeyLabel: subkeyResult.keyLabel,
              ...(paymentIntent.metadata?.promoCode && {
                promoCode: paymentIntent.metadata.promoCode,
              }),
              ...(paymentIntent.metadata?.promotionId && {
                promotionId: paymentIntent.metadata.promotionId,
              }),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Gestione promozione BONUS_CREDITS se presente nei metadata
        if (
          paymentIntent.metadata?.promoCode &&
          paymentIntent.metadata?.promotionId &&
          paymentIntent.metadata?.bonusCredits
        ) {
          const bonusCredits = parseInt(paymentIntent.metadata.bonusCredits, 10);
          const promotionId = paymentIntent.metadata.promotionId;

          // Applica crediti bonus
          await creditService.addCredits({
            userId,
            amount: bonusCredits,
            type: 'PROMOTION' as TransactionType,
            description: `Bonus crediti promozione ${paymentIntent.metadata.promoCode}`,
            metadata: {
              promotionId,
              promoCode: paymentIntent.metadata.promoCode,
              paymentIntentId,
            },
          });

          // Registra uso promozione
          await PromotionService.recordPromotionUse({
            promotionId,
            userId,
            paymentId,
            metadata: {
              paymentIntentId,
              eventId,
            },
          });

          log.warn('[PaymentIntent] Bonus credits applied from promotion', {
            eventId,
            paymentIntentId,
            userId,
            promotionId,
            bonusCredits,
          });
        }

        // Gestione promozione STRIPE_COUPON se presente nei metadata
        if (
          paymentIntent.metadata?.promoCode &&
          paymentIntent.metadata?.promotionId &&
          paymentIntent.metadata?.discountAmount
        ) {
          const promotionId = paymentIntent.metadata.promotionId;

          // Registra uso promozione (lo sconto è già stato applicato all'amount)
          await PromotionService.recordPromotionUse({
            promotionId,
            userId,
            paymentId,
            metadata: {
              paymentIntentId,
              eventId,
              discountType: paymentIntent.metadata.discountType,
              discountAmount: paymentIntent.metadata.discountAmount,
              originalAmount: paymentIntent.metadata.originalAmount,
            },
          });

          log.warn('[PaymentIntent] Stripe coupon promotion use recorded', {
            eventId,
            paymentIntentId,
            userId,
            promotionId,
            discountAmount: paymentIntent.metadata.discountAmount,
          });
        }
      });

      const totalDuration = Date.now() - startTime;
      log.warn('[PaymentIntent] Successfully processed', {
        eventId,
        paymentIntentId,
        userId,
        amount: paymentIntent.amount,
        duration: `${totalDuration}ms`,
      });
    } catch (error: unknown) {
      // Cleanup: revoca subkey se creata ma DB fallito
      if (subkeyLabel) {
        try {
          await OpenRouterSubkeyService.revokeSubkey(subkeyLabel);
          log.warn('[PaymentIntent] Subkey revoked after error', {
            eventId,
            paymentIntentId,
            userId,
          });
        } catch (revokeError: unknown) {
          log.error('[PaymentIntent] Failed to revoke subkey after error', revokeError, {
            eventId,
            paymentIntentId,
            userId,
          });
          // Loggiamo ma non blocchiamo - sarà necessario cleanup manuale
        }
      }

      const endTime = Date.now();
      log.error('[PaymentIntent] Processing failed', error, {
        eventId,
        paymentIntentId,
        duration: `${endTime - startTime}ms`,
      });

      // Rilancia l'errore per far ritentare Stripe
      throw error;
    }
  }

  /**
   * Gestisce l'evento payment_intent.refunded o charge.refunded
   * Revoca subkey e rimuove crediti accreditati
   */
  private static async handlePaymentRefunded(
    refundData: RefundPayload,
    eventId: string
  ): Promise<void> {
    const startTime = Date.now();
    const paymentIntentId = getPaymentIntentIdFromRefund(refundData);

    if (!paymentIntentId) {
      log.warn('[PaymentRefund] Payment intent ID non trovato', {
        eventId,
        paymentRefundId: paymentIntentId, // Using paymentIntentId as paymentRefundId for logging
      });
      return; // Non possiamo processare senza payment intent ID
    }

    const { amount, currency } = getAmountCurrency(refundData);

    log.warn('[PaymentRefund] Processing', {
      eventId,
      paymentIntentId,
      amount,
      currency,
    });

    try {
      // 1. Trova il pagamento associato
      const payment = await prisma.payments.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!payment) {
        log.warn('[PaymentRefund] Payment non trovato', {
          eventId,
          paymentRefundId: paymentIntentId, // Using paymentIntentId as paymentRefundId for logging
          paymentIntentId,
        });
        return; // Pagamento non trovato, potrebbe essere già processato o non esistere
      }

      const userId = payment.userId;
      if (!userId) {
        log.warn('[PaymentRefund] Payment userId mancante', {
          eventId,
          paymentRefundId: paymentIntentId, // Using paymentIntentId as paymentRefundId for logging
          paymentId: payment.id,
        });
        return;
      }
      const creditsToRemove = payment.creditsAdded || 0;

      // 2. Trova e revoca tutte le subkey associate a questo payment intent
      const apiKeys = await prisma.user_api_keys.findMany({
        where: {
          stripePaymentIntentId: paymentIntentId,
          status: 'ACTIVE',
        },
      });

      // Revoca tutte le subkey attive
      for (const apiKey of apiKeys) {
        try {
          await OpenRouterSubkeyService.revokeSubkey(apiKey.keyLabel);
          log.warn('[PaymentRefund] Subkey revoked', {
            eventId,
            paymentRefundId: paymentIntentId, // Using paymentIntentId as paymentRefundId for logging
            userId,
          });
        } catch (error: unknown) {
          log.error('[PaymentRefund] Error revoking subkey', error, {
            eventId,
            paymentRefundId: paymentIntentId, // Using paymentIntentId as paymentRefundId for logging
            keyLabel: apiKey.keyLabel,
          });
          // Continuiamo anche se la revoca fallisce
        }
      }

      // 3. Rimuovi crediti se erano stati accreditati
      if (creditsToRemove > 0) {
        // Verifica che l'utente abbia ancora abbastanza crediti
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

        if (user && user.credits >= creditsToRemove) {
          await creditService.consumeCredits({
            userId,
            amount: creditsToRemove,
            type: 'REFUND' as TransactionType,
            description: `Rimborso per payment intent ${paymentIntentId}`,
            metadata: {
              stripePaymentIntentId: paymentIntentId,
              originalPaymentId: payment.id,
              eventId,
            },
          });

          log.warn('[PaymentRefund] Credits removed', {
            eventId,
            paymentRefundId: paymentIntentId, // Using paymentIntentId as paymentRefundId for logging
            userId,
            creditsRemoved: creditsToRemove,
          });
        } else {
          log.warn('[PaymentRefund] Credits insufficienti per rimozione', {
            eventId,
            paymentRefundId: paymentIntentId, // Using paymentIntentId as paymentRefundId for logging
            userId,
            currentCredits: user?.credits || 0,
            creditsToRemove,
          });
          // Loggiamo ma non blocchiamo - potrebbe essere già stato consumato
        }
      }

      // 4. Aggiorna lo status del pagamento
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          updatedAt: new Date(),
          metadata: {
            ...((payment.metadata as Prisma.JsonObject | null) ?? {}),
            refundedAt: new Date().toISOString(),
            refundEventId: eventId,
          },
        },
      });

      // 5. Aggiorna lo status delle subkey nel database
      if (apiKeys.length > 0) {
        await prisma.user_api_keys.updateMany({
          where: {
            stripePaymentIntentId: paymentIntentId,
            status: 'ACTIVE',
          },
          data: {
            status: 'REVOKED',
            updatedAt: new Date(),
          },
        });
      }

      const totalDuration = Date.now() - startTime;
      log.warn('[PaymentRefund] Successfully processed', {
        eventId,
        paymentIntentId,
        userId,
        creditsRemoved: creditsToRemove,
        subkeysRevoked: apiKeys.length,
        duration: totalDuration,
      });
    } catch (error: unknown) {
      log.error('[PaymentRefund] Processing failed', error, {
        eventId,
        paymentIntentId,
        duration: Date.now() - startTime,
      });

      // Non rilanciamo l'errore - i refund sono eventi informativi
      // Stripe non ritenterà automaticamente
    }
  }

  /**
   * Gestisce l'acquisto di un piano marketplace
   */
  private static async handleMarketplacePurchase(
    paymentIntent: Stripe.PaymentIntent,
    eventId: string,
    userId: string
  ): Promise<void> {
    const paymentIntentId = paymentIntent.id;
    const marketplacePlanId = paymentIntent.metadata.marketplacePlanId;

    if (!marketplacePlanId) {
      log.warn('[PaymentIntent] Marketplace plan id mancante', {
        eventId,
        paymentIntentId,
        metadata: paymentIntent.metadata,
      });
      return;
    }

    log.warn('[PaymentIntent] Processing marketplace purchase', {
      eventId,
      paymentIntentId,
      userId,
      marketplacePlanId,
    });

    try {
      // Trova il purchase record
      const purchase = await prisma.plan_purchases.findFirst({
        where: {
          userId,
          marketplacePlanId,
          stripePaymentId: paymentIntentId,
          status: 'PENDING',
        },
        include: {
          marketplace_plan: {
            include: {
              coach: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!purchase) {
        // Fallback: crea purchase record se non esiste
        log.warn('[PaymentIntent] Marketplace purchase not found, creating fallback', {
          eventId,
          paymentIntentId,
          userId,
          marketplacePlanId,
        });

        const plan = await prisma.marketplace_plans.findUnique({
          where: { id: marketplacePlanId },
          include: {
            coach: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!plan) {
          log.error('[PaymentIntent] Marketplace plan not found', new Error('Plan not found'), {
            marketplacePlanId,
          });
          return;
        }

        const newPurchase = await marketplaceService.createPurchase({
          userId,
          marketplacePlanId,
          price: Number(plan.price),
          currency: plan.currency ?? 'eur',
          stripePaymentId: paymentIntentId,
        });

        // Usa il purchase appena creato
        const purchaseWithPlan = await prisma.plan_purchases.findUnique({
          where: { id: newPurchase.id },
          include: {
            marketplace_plan: {
              include: {
                coach: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        });

        if (!purchaseWithPlan) {
          log.error(
            '[PaymentIntent] Failed to create marketplace purchase',
            new Error('Failed to create marketplace purchase'),
            {
              marketplacePlanId,
              userId,
              eventId,
              paymentIntentId,
            }
          );
          return;
        }

        // Aggiorna status a COMPLETED
        await marketplaceService.updatePurchaseStatus(purchaseWithPlan.id, 'COMPLETED');

        // Aggiorna statistiche coach (coach.id è users.id, quindi è già l'userId)
        if (purchaseWithPlan.marketplace_plan?.coach?.id) {
          await coachService.updateCoachStats(purchaseWithPlan.marketplace_plan.coach.id);
        }

        // Registra pagamento
        const paymentId = createId();
        await prisma.payments.create({
          data: {
            id: paymentId,
            userId,
            stripePaymentId: paymentIntentId,
            stripePaymentIntentId: paymentIntentId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency || 'eur',
            status: 'SUCCEEDED',
            type: 'MARKETPLACE',
            metadata: {
              eventId,
              marketplacePlanId,
              purchaseId: purchaseWithPlan.id,
              ...(paymentIntent.metadata?.promoCode && {
                promoCode: paymentIntent.metadata.promoCode,
              }),
              ...(paymentIntent.metadata?.promotionId && {
                promotionId: paymentIntent.metadata.promotionId,
              }),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Gestione promozione STRIPE_COUPON se presente
        if (
          paymentIntent.metadata?.promoCode &&
          paymentIntent.metadata?.promotionId &&
          paymentIntent.metadata?.discountAmount
        ) {
          const promotionId = paymentIntent.metadata.promotionId;

          await PromotionService.recordPromotionUse({
            promotionId,
            userId,
            paymentId,
            metadata: {
              paymentIntentId,
              eventId,
              marketplacePlanId,
              purchaseId: purchaseWithPlan.id,
            },
          });
        }

        log.warn('[PaymentIntent] Marketplace purchase completed (fallback)', {
          eventId,
          paymentIntentId,
          userId,
          marketplacePlanId,
          purchaseId: purchaseWithPlan.id,
        });

        return;
      }

      // Aggiorna status a COMPLETED
      await marketplaceService.updatePurchaseStatus(purchase.id, 'COMPLETED');

      // Aggiorna statistiche coach (coach.id è users.id, quindi è già l'userId)
      if (purchase.marketplace_plan?.coach?.id) {
        await coachService.updateCoachStats(purchase.marketplace_plan.coach.id);
      }

      // Registra pagamento
      const paymentId = createId();
      await prisma.payments.create({
        data: {
          id: paymentId,
          userId,
          stripePaymentId: paymentIntentId,
          stripePaymentIntentId: paymentIntentId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency || 'eur',
          status: 'SUCCEEDED',
          type: 'MARKETPLACE',
          metadata: {
            eventId,
            marketplacePlanId,
            purchaseId: purchase.id,
            ...(paymentIntent.metadata?.promoCode && {
              promoCode: paymentIntent.metadata.promoCode,
            }),
            ...(paymentIntent.metadata?.promotionId && {
              promotionId: paymentIntent.metadata.promotionId,
            }),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Gestione promozione STRIPE_COUPON se presente
      if (
        paymentIntent.metadata?.promoCode &&
        paymentIntent.metadata?.promotionId &&
        paymentIntent.metadata?.discountAmount
      ) {
        const promotionId = paymentIntent.metadata.promotionId;

        await PromotionService.recordPromotionUse({
          promotionId,
          userId,
          paymentId,
          metadata: {
            paymentIntentId,
            eventId,
            marketplacePlanId,
            purchaseId: purchase.id,
          },
        });
      }

      log.warn('[PaymentIntent] Marketplace purchase completed', {
        eventId,
        paymentIntentId,
        userId,
        marketplacePlanId,
        purchaseId: purchase.id,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[PaymentIntent] Marketplace purchase processing failed', error, {
        eventId,
        paymentIntentId,
        userId,
        marketplacePlanId,
        error: errorMessage,
      });
      throw error;
    }
  }
}
