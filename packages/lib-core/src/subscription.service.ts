/**
 * Subscription Service
 *
 * Gestione abbonamenti Stripe
 * Implementa ISubscriptionService contract
 */

import Stripe from 'stripe';
import { createId } from '@paralleldrive/cuid2';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { getSubscriptionPriceId, getCreditsFromPriceId } from '@giulio-leone/constants';
import type { ISubscriptionService } from '@giulio-leone/lib-shared';
import { logger } from './logger.service';
import { creditService } from './credit.service';
import { SetupIntentService } from './setup-intent.service';
import { getStripe } from './stripe';
import { prisma } from './prisma';

// ----------------------------------------------------------------------------
// Interfaces for External Services (to break cyclic dependencies)
// ----------------------------------------------------------------------------

export interface IAffiliateService {
  handlePostRegistration(params: {
    userId: string;
    referralCode: string;
    now: Date;
  }): Promise<void>;
  handleSubscriptionCancellation(params: { userId: string; occurredAt: Date }): Promise<void>;
  handleInvoicePaid(params: {
    userId: string;
    stripeInvoiceId: string;
    stripeSubscriptionId: string;
    totalAmountCents: number;
    currency: string;
    occurredAt: Date;
  }): Promise<void>;
  ensureUserReferralCode?(userId: string, programId: string): Promise<void>;
}

export interface IPromotionService {
  getPromotionByCode(
    code: string
  ): Promise<{ id: string; type: string; bonusCredits?: number } | null>;
  applyBonusCredits(promotionId: string, userId: string): Promise<void>;
}

export interface IOpenRouterSubkeyService {
  createSubkey(params: {
    userId: string;
    credits: number;
    paymentIntentId: string;
  }): Promise<{ keyLabel: string; keyHash: string; limit: number }>;
  saveSubkeyToDb(data: Record<string, unknown>, tx?: unknown): Promise<void>;
  revokeSubkey(keyLabel: string): Promise<void>;
}

export interface IMarketplaceService {
  createPurchase(data: Record<string, unknown>): Promise<{ id: string }>;
  updatePurchaseStatus(purchaseId: string, status: string): Promise<void>;
}

export interface SubscriptionDependencies {
  affiliateService?: IAffiliateService;
  promotionService?: IPromotionService;
  openRouterSubkeyService?: IOpenRouterSubkeyService;
  marketplaceService?: IMarketplaceService;
}
/**
 * Implementazione Subscription Service
 */
export class SubscriptionService implements ISubscriptionService {
  private deps: SubscriptionDependencies = {};

  /**
   * Inject external dependencies to resolve cyclic imports
   */
  setDependencies(deps: SubscriptionDependencies) {
    this.deps = { ...this.deps, ...deps };
  }
  async createSetupIntent(
    userId: string,
    plan: SubscriptionPlan,
    promoCode?: string,
    referralCode?: string
  ): Promise<Stripe.SetupIntent> {
    const metadata: Record<string, string> = { plan };

    if (promoCode) metadata.promoCode = promoCode;
    if (referralCode) metadata.referralCode = referralCode;

    return await SetupIntentService.createSetupIntent({
      userId,
      metadata,
    });
  }

  async createSubscription(
    userId: string,
    setupIntentId: string, // This is actually paymentMethodId in logic? No, apps/next uses paymentMethodId
    plan: SubscriptionPlan,
    promoCode?: string,
    referralCode?: string
  ): Promise<Stripe.Subscription> {
    // Note: The contract might say setupIntentId, but typically we use paymentMethodId from the setupIntent
    // But if the interface says setupIntentId, let's retrieve it.
    // apps/next createSubscription accepts paymentMethodId directly.

    // Let's check setupIntentId. If it starts with 'seti_', retrieve it to get paymentMethod.
    let paymentMethodId = setupIntentId;

    if (setupIntentId.startsWith('seti_')) {
      const setupIntent = await SetupIntentService.retrieveSetupIntent(setupIntentId);
      if (!setupIntent.payment_method) {
        throw new Error('Payment method not attached to setup intent');
      }
      paymentMethodId = setupIntent.payment_method as string;
    }

    const stripe = await getStripe();
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get or create customer (reuse SetupIntentService logic if possible, or duplicate for now)
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      // Should have been created by setup intent step ideally, but ensure it here
      const customerParams: Stripe.CustomerCreateParams = {
        metadata: { userId },
        email: user.email || undefined,
      };
      const customer = await stripe.customers.create(customerParams);
      customerId = customer.id;
      await prisma.users.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set default
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const priceId = this.getPriceIdForPlan(plan);

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
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

    return await stripe.subscriptions.create(subscriptionParams);
  }

  async getSubscription(userId: string): Promise<{
    id: string;
    status: SubscriptionStatus;
    plan: SubscriptionPlan;
    currentPeriodEnd: Date;
  } | null> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const subscription = user?.subscriptions[0];
    if (!subscription) return null;

    return {
      id: subscription.id,
      status: subscription.status,
      plan: subscription.plan,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const dbSub = await prisma.subscriptions.findUnique({ where: { id: subscription.id } });
    if (!dbSub?.stripeSubscriptionId) throw new Error('Stripe Subscription ID missing');

    const stripe = await getStripe();
    await stripe.subscriptions.update(dbSub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true, updatedAt: new Date() },
    });
  }

  async updateSubscription(userId: string, plan: SubscriptionPlan): Promise<Stripe.Subscription> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) throw new Error('Subscription not found');

    const dbSub = await prisma.subscriptions.findUnique({ where: { id: subscription.id } });
    if (!dbSub?.stripeSubscriptionId) throw new Error('Stripe Subscription ID missing');

    const stripe = await getStripe();
    const priceId = this.getPriceIdForPlan(plan);

    // Get current subscription item
    const currentSub = await stripe.subscriptions.retrieve(dbSub.stripeSubscriptionId);
    const itemId = currentSub.items.data[0]?.id;

    if (!itemId) {
      throw new Error('Subscription item non trovato per aggiornamento');
    }

    // Determine if upgrade or downgrade based on plan tier
    // SubscriptionPlan enum only has 'PLUS' and 'PRO'
    const planTiers: Record<SubscriptionPlan, number> = {
      PLUS: 1,
      PRO: 2,
    };

    const currentTier = planTiers[subscription.plan] || 0;
    const newTier = planTiers[plan] || 0;
    const isUpgrade = newTier > currentTier;
    const isDowngrade = newTier < currentTier;

    // Handle proration: always create prorations for upgrades, always_invoice for downgrades
    const prorationBehavior: Stripe.SubscriptionUpdateParams.ProrationBehavior = isUpgrade
      ? 'create_prorations'
      : isDowngrade
        ? 'always_invoice'
        : 'create_prorations';

    return await stripe.subscriptions.update(dbSub.stripeSubscriptionId, {
      items: [
        {
          id: itemId,
          price: priceId,
        },
      ],
      proration_behavior: prorationBehavior,
    });
  }

  async getActiveSubscription(userId: string) {
    const dbSub = await prisma.subscriptions.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!dbSub) return null;
    return dbSub;
  }

  async createPortalSession(userId: string, returnUrl: string): Promise<string> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    const customerId = user?.stripeCustomerId;

    if (!customerId) {
      throw new Error('Customer Stripe non trovato');
    }

    const stripe = await getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    logger.warn(`[SubscriptionService] Handling webhook: ${event.type}`);

    const eventType = event.type as string;

    switch (eventType) {
      case 'payment_intent.succeeded': {
        await this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
          event.id
        );
        break;
      }
      case 'payment_intent.refunded':
      case 'charge.refunded': {
        await this.handlePaymentRefunded(event.data.object as Stripe.PaymentIntent, event.id);
        break;
      }
      case 'customer.subscription.created': {
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      }
      case 'customer.subscription.updated': {
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }
      case 'invoice.paid': {
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      }
      case 'invoice.payment_failed': {
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }
      default: {
        logger.warn(`Unhandled event type: ${event.type}`);
      }
    }
  }

  // ============================================
  // PRIVATE HANDLERS
  // ============================================

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    const plan = subscription.metadata?.plan as SubscriptionPlan;

    if (!userId || !plan) {
      logger.error('[Subscription] Missing userId or plan in metadata');
      return;
    }

    await prisma.subscriptions.create({
      data: {
        id: createId(),
        userId,
        plan,
        status: 'ACTIVE',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0]?.price.id ?? '',
        currentPeriodStart: new Date(
          (subscription.items.data[0]?.current_period_start ?? 0) * 1000
        ),
        currentPeriodEnd: new Date((subscription.items.data[0]?.current_period_end ?? 0) * 1000),
        updatedAt: new Date(),
      },
    });

    if (plan === 'PLUS') {
      await creditService.addCredits({
        userId,
        amount: 500,
        type: 'SUBSCRIPTION_RENEWAL',
        description: 'Crediti iniziali PLUS',
      });
    }

    // Handle affiliate referral if present
    const referralCode = subscription.metadata?.referralCode;
    if (referralCode && this.deps.affiliateService) {
      await this.deps.affiliateService.handlePostRegistration({
        userId,
        referralCode,
        now: new Date(),
      });
    }

    // Handle promotion code if present
    const promoCode = subscription.metadata?.promoCode;
    if (promoCode && this.deps.promotionService) {
      try {
        const promotion = await this.deps.promotionService.getPromotionByCode(promoCode);
        if (promotion && promotion.type === 'BONUS_CREDITS' && promotion.bonusCredits) {
          await this.deps.promotionService.applyBonusCredits(promotion.id, userId);
        }
      } catch (error) {
        logger.error('[Subscription] Error applying promotion:', error);
      }
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const dbSubscription = await prisma.subscriptions.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (dbSubscription) {
      const newStatus = this.mapStripeStatus(subscription.status);

      await prisma.subscriptions.update({
        where: { id: dbSubscription.id },
        data: {
          status: newStatus,
          currentPeriodStart: new Date(
            (subscription.items.data[0]?.current_period_start ?? 0) * 1000
          ),
          currentPeriodEnd: new Date((subscription.items.data[0]?.current_period_end ?? 0) * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date(),
        },
      });

      if (newStatus === 'CANCELLED' || newStatus === 'EXPIRED') {
        if (dbSubscription.userId && this.deps.affiliateService) {
          await this.deps.affiliateService.handleSubscriptionCancellation({
            userId: dbSubscription.userId,
            occurredAt: new Date(),
          });
        }
      }
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await prisma.subscriptions.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    const dbSubscriptions = await prisma.subscriptions.findMany({
      where: { stripeSubscriptionId: subscription.id },
    });

    await Promise.all(
      dbSubscriptions
        .filter((sub) => sub.userId && this.deps.affiliateService)
        .map((sub) =>
          this.deps.affiliateService!.handleSubscriptionCancellation({
            userId: sub.userId!,
            occurredAt: new Date(),
          })
        )
    );
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const sub = invoice.parent?.subscription_details?.subscription;
    const subscriptionId = typeof sub === 'string' ? sub : (sub?.id ?? null);
    if (!subscriptionId) return;
    const subscription = await prisma.subscriptions.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (subscription && subscription.plan === 'PLUS' && subscription.userId) {
      // Rinnovo crediti mensili PLUS
      await creditService.addCredits({
        userId: subscription.userId,
        amount: 500,
        type: 'SUBSCRIPTION_RENEWAL',
        description: 'Rinnovo crediti mensili PLUS',
      });
    }

    if (subscription && subscription.userId && invoice.total && this.deps.affiliateService) {
      const totalAmountCents = invoice.total;
      const currency = invoice.currency || 'usd';

      await this.deps.affiliateService.handleInvoicePaid({
        userId: subscription.userId,
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId: subscriptionId,
        totalAmountCents,
        currency,
        occurredAt: new Date(invoice.created * 1000),
      });
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const sub = invoice.parent?.subscription_details?.subscription;
    const subscriptionId = typeof sub === 'string' ? sub : (sub?.id ?? null);
    if (!subscriptionId) return;
    await prisma.subscriptions.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'PAST_DUE',
        updatedAt: new Date(),
      },
    });
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, eventId: string) {
    // Basic implementation for credits purchase
    const userId = paymentIntent.metadata?.userId;
    if (!userId) return;

    const paymentType = paymentIntent.metadata?.type;
    if (paymentType === 'marketplace') {
      await this.handleMarketplacePurchase(paymentIntent, eventId, userId);
      return;
    }

    // Credits logic
    let credits = 0;
    if (paymentIntent.metadata?.credits) {
      credits = parseInt(paymentIntent.metadata.credits, 10);
    } else if (paymentIntent.metadata?.price_id) {
      credits = getCreditsFromPriceId(paymentIntent.metadata.price_id) || 0;
    }

    if (credits > 0) {
      await prisma.$transaction(async (tx) => {
        // Create OpenRouter subkey for credits purchase
        if (this.deps.openRouterSubkeyService) {
          try {
            const subkeyResult = await this.deps.openRouterSubkeyService.createSubkey({
              userId,
              credits,
              paymentIntentId: paymentIntent.id,
            });

            // Save subkey to database
            await this.deps.openRouterSubkeyService.saveSubkeyToDb(
              {
                userId,
                provider: 'OPENROUTER',
                keyLabel: subkeyResult.keyLabel,
                keyHash: subkeyResult.keyHash,
                limit: subkeyResult.limit,
                stripePaymentIntentId: paymentIntent.id,
              },
              tx
            );
          } catch (error) {
            logger.error('[Subscription] Error creating OpenRouter subkey:', error);
            // Continue with credit addition even if subkey creation fails
          }
        }

        await creditService.addCredits({
          userId,
          amount: credits,
          type: 'PURCHASE',
          description: `Acquisto ${credits} crediti`,
          metadata: { stripePaymentIntentId: paymentIntent.id },
        });

        // Create payment record
        await tx.payments.create({
          data: {
            id: createId(),
            userId,
            stripePaymentId: paymentIntent.id,
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'SUCCEEDED',
            type: 'CREDITS',
            creditsAdded: credits,
            metadata: { eventId },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      });
    }
  }

  private async handlePaymentRefunded(refundData: Stripe.PaymentIntent, eventId: string) {
    const userId = refundData.metadata?.userId;
    if (!userId) {
      logger.warn('[Subscription] Refund without userId', {
        eventId,
        paymentIntentId: refundData.id,
      });
      return;
    }

    // Find payment record
    const payment = await prisma.payments.findFirst({
      where: {
        stripePaymentIntentId: refundData.id,
        userId,
      },
    });

    if (!payment) {
      logger.warn('[Subscription] Payment record not found for refund', {
        eventId,
        paymentIntentId: refundData.id,
        userId,
      });
      return;
    }

    // Update payment status
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        updatedAt: new Date(),
        metadata: {
          ...((payment.metadata as Record<string, unknown>) || {}),
          refundEventId: eventId,
          refundedAt: new Date().toISOString(),
        },
      },
    });

    // If credits were added, remove them
    if (payment.creditsAdded && payment.creditsAdded > 0) {
      await creditService.consumeCredits({
        userId,
        amount: payment.creditsAdded,
        type: 'REFUND',
        description: `Rimborso per acquisto ${payment.creditsAdded} crediti`,
        metadata: {
          originalPaymentId: payment.id,
          stripePaymentIntentId: refundData.id,
          refundEventId: eventId,
        },
      });
    }

    // Revoke OpenRouter subkey if exists
    const apiKey = await prisma.user_api_keys.findFirst({
      where: {
        userId,
        stripePaymentIntentId: refundData.id,
        status: 'ACTIVE',
        provider: 'OPENROUTER',
      },
    });

    if (apiKey && this.deps.openRouterSubkeyService) {
      try {
        await this.deps.openRouterSubkeyService.revokeSubkey(apiKey.keyLabel);
      } catch (error) {
        logger.error('[Subscription] Error revoking OpenRouter subkey:', error);
      }
    }
  }

  private async handleMarketplacePurchase(
    paymentIntent: Stripe.PaymentIntent,
    eventId: string,
    userId: string
  ): Promise<void> {
    const marketplacePlanId = paymentIntent.metadata?.marketplacePlanId;
    if (!marketplacePlanId) {
      logger.warn('[Subscription] Marketplace purchase without planId', {
        eventId,
        paymentIntentId: paymentIntent.id,
        userId,
      });
      return;
    }

    // Find or create purchase record
    let purchase: { id: string } | null = await prisma.plan_purchases.findFirst({
      where: {
        userId,
        marketplacePlanId,
        stripePaymentId: paymentIntent.id,
      },
    });

    if (!purchase && this.deps.marketplaceService) {
      // Create purchase record if it doesn't exist
      purchase = await this.deps.marketplaceService.createPurchase({
        userId,
        marketplacePlanId,
        stripePaymentId: paymentIntent.id,
        price: paymentIntent.amount / 100, // Convert from cents to currency unit
        currency: paymentIntent.currency || 'usd',
      });
    }

    // Update purchase status to completed
    if (purchase && this.deps.marketplaceService) {
      await this.deps.marketplaceService.updatePurchaseStatus(purchase.id, 'COMPLETED');
    }
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
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

  private getPriceIdForPlan(plan: SubscriptionPlan): string {
    const priceId = getSubscriptionPriceId(plan);

    if (!priceId) {
      throw new Error(`Price ID not found for plan: ${plan}`);
    }

    return priceId;
  }
}

/**
 * Singleton instance
 */
export const subscriptionService: SubscriptionService = new SubscriptionService();
