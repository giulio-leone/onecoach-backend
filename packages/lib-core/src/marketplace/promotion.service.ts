import { prisma } from '../prisma';
import { getStripe } from '../stripe';
import { createId } from '@paralleldrive/cuid2';
import { creditService } from '../credit.service';
import { logger } from '@giulio-leone/lib-shared';

import { Prisma, PromotionType, DiscountType } from '@prisma/client';

const log = logger.child('PromotionService');

/**
 * Promotion Service
 *
 * Gestione promozioni: codici Stripe coupon e bonus crediti
 * Segue principi KISS, SOLID, DRY
 */

export interface CreatePromotionParams {
  code: string;
  type: PromotionType;
  stripeCouponId?: string;
  discountType?: DiscountType;
  discountValue?: number;
  bonusCredits?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  validFrom: Date;
  validUntil?: Date;
  description?: string;
  createdBy: string;
}

export interface PromotionValidationResult {
  valid: boolean;
  promotion?: {
    id: string;
    code: string;
    type: PromotionType;
    discountType?: DiscountType;
    discountValue?: number;
    bonusCredits?: number;
    description?: string;
  };
  error?: string;
}

export interface ApplyPromotionResult {
  success: boolean;
  promotionId?: string;
  stripeCouponId?: string;
  bonusCredits?: number;
  error?: string;
}

/**
 * Promotion Service
 */
export class PromotionService {
  /**
   * Crea una nuova promozione
   */
  static async createPromotion(params: CreatePromotionParams): Promise<string> {
    const {
      code,
      type,
      stripeCouponId,
      discountType,
      discountValue,
      bonusCredits,
      maxUses,
      maxUsesPerUser = 1,
      validFrom,
      validUntil,
      description,
      createdBy,
    } = params;

    // Validazione input
    if (!code || code.trim().length === 0) {
      throw new Error('Codice promozionale richiesto');
    }

    if (type === 'STRIPE_COUPON') {
      if (!discountType || !discountValue) {
        throw new Error('discountType e discountValue richiesti per STRIPE_COUPON');
      }
      if (discountType === 'PERCENTAGE' && (discountValue < 1 || discountValue > 100)) {
        throw new Error('Percentuale sconto deve essere tra 1 e 100');
      }
      if (discountType === 'FIXED_AMOUNT' && discountValue <= 0) {
        throw new Error('Importo sconto deve essere maggiore di 0');
      }
    } else if (type === 'BONUS_CREDITS') {
      if (!bonusCredits || bonusCredits <= 0) {
        throw new Error('bonusCredits richiesto e deve essere maggiore di 0');
      }
    }

    if (validUntil && validUntil <= validFrom) {
      throw new Error('validUntil deve essere successiva a validFrom');
    }

    // Verifica codice univoco
    const existing = await prisma.promotions.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existing) {
      throw new Error('Codice promozionale già esistente');
    }

    // Transazione atomica: crea promo + coupon Stripe se necessario
    return await prisma.$transaction(async (tx) => {
      let finalStripeCouponId = stripeCouponId;

      // Se STRIPE_COUPON e non fornito stripeCouponId, crea coupon Stripe
      if (type === 'STRIPE_COUPON' && !stripeCouponId) {
        try {
          const stripe = getStripe();
          const couponParams: {
            name: string;
            id: string;
            percent_off?: number;
            amount_off?: number;
            currency?: string;
            max_redemptions?: number;
            redeem_by?: number;
          } = {
            name: code.toUpperCase().trim(),
            id: `promo_${code
              .toUpperCase()
              .trim()
              .replace(/[^A-Z0-9]/g, '_')}`,
          };

          if (discountType === 'PERCENTAGE') {
            couponParams.percent_off = discountValue;
          } else if (discountValue !== undefined) {
            couponParams.amount_off = Math.round(discountValue); // centesimi
            couponParams.currency = 'eur';
          }

          if (maxUses) {
            couponParams.max_redemptions = maxUses;
          }

          if (validUntil) {
            couponParams.redeem_by = Math.floor(validUntil.getTime() / 1000);
          }

          const coupon = await stripe.coupons.create(couponParams);
          finalStripeCouponId = coupon.id;

          log.warn('[Promotion] Stripe coupon created', {
            code,
            couponId: finalStripeCouponId,
          });
        } catch (error: unknown) {
          log.error('[Promotion] Error creating Stripe coupon', error, {
            code,
          });
          throw new Error(
            `Errore creazione coupon Stripe: ${error instanceof Error ? error.message : 'Unknown'}`
          );
        }
      }

      // Crea promo nel database
      const promotion = await tx.promotions.create({
        data: {
          id: createId(),
          code: code.toUpperCase().trim(),
          type,
          stripeCouponId: finalStripeCouponId,
          discountType,
          discountValue: discountValue ? new Prisma.Decimal(discountValue) : null,
          bonusCredits,
          maxUses,
          maxUsesPerUser,
          validFrom,
          validUntil,
          description,
          createdBy,
        },
      });

      return promotion.id;
    });
  }

  /**
   * Valida un codice promozionale per un utente
   */
  static async validatePromotionCode(
    code: string,
    userId?: string
  ): Promise<PromotionValidationResult> {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: 'Codice promozionale richiesto' };
    }

    const promotion = await prisma.promotions.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!promotion) {
      return { valid: false, error: 'Codice promozionale non trovato' };
    }

    if (!promotion.isActive) {
      return { valid: false, error: 'Codice promozionale non attivo' };
    }

    const now = new Date();
    if (promotion.validFrom > now) {
      return { valid: false, error: 'Codice promozionale non ancora valido' };
    }

    if (promotion.validUntil && promotion.validUntil < now) {
      return { valid: false, error: 'Codice promozionale scaduto' };
    }

    // Verifica usi totali
    if (promotion.maxUses !== null) {
      const totalUses = await prisma.promotion_uses.count({
        where: { promotionId: promotion.id },
      });

      if (totalUses >= promotion.maxUses) {
        return { valid: false, error: 'Codice promozionale esaurito' };
      }
    }

    // Verifica usi per utente
    if (userId) {
      const userUses = await prisma.promotion_uses.count({
        where: {
          promotionId: promotion.id,
          userId,
        },
      });

      if (userUses >= promotion.maxUsesPerUser) {
        return { valid: false, error: 'Hai già utilizzato questo codice promozionale' };
      }
    }

    return {
      valid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        type: promotion.type,
        discountType: promotion.discountType || undefined,
        discountValue: promotion.discountValue ? Number(promotion.discountValue) : undefined,
        bonusCredits: promotion.bonusCredits || undefined,
        description: promotion.description || undefined,
      },
    };
  }

  /**
   * Recupera promozione per codice
   */
  static async getPromotionByCode(code: string) {
    return await prisma.promotions.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
  }

  /**
   * Conta usi di una promozione per utente
   */
  static async getUserPromotionUses(promotionId: string, userId: string): Promise<number> {
    return await prisma.promotion_uses.count({
      where: {
        promotionId,
        userId,
      },
    });
  }

  /**
   * Applica bonus crediti manualmente
   */
  static async applyBonusCredits(
    promotionId: string,
    userId: string,
    appliedBy?: string
  ): Promise<void> {
    const promotion = await prisma.promotions.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new Error('Promozione non trovata');
    }

    if (promotion.type !== 'BONUS_CREDITS') {
      throw new Error('Promozione non è di tipo BONUS_CREDITS');
    }

    if (!promotion.bonusCredits || promotion.bonusCredits <= 0) {
      throw new Error('Promozione non ha crediti bonus configurati');
    }

    // Valida promo
    const validation = await this.validatePromotionCode(promotion.code, userId);
    if (!validation.valid) {
      throw new Error(validation.error || 'Promozione non valida');
    }

    // Transazione atomica: accredita crediti + registra uso
    await prisma.$transaction(async (tx) => {
      // Accredita crediti
      if (!promotion.bonusCredits) {
        throw new Error('Promozione non ha crediti bonus configurati');
      }

      await creditService.addCredits({
        userId,
        amount: promotion.bonusCredits,
        type: 'PROMOTION',
        description: `Bonus crediti promozione ${promotion.code}`,
        metadata: {
          promotionId: promotion.id,
          promotionCode: promotion.code,
          appliedBy,
        },
      });

      // Registra uso
      await tx.promotion_uses.create({
        data: {
          id: createId(),
          promotionId: promotion.id,
          userId,
          appliedAt: new Date(),
          metadata: {
            appliedBy,
            appliedManually: true,
          },
        },
      });
    });

    log.warn('[Promotion] Bonus credits applied', {
      promotionId,
      userId,
      bonusCredits: promotion.bonusCredits,
    });
  }

  /**
   * Registra uso promozione
   */
  static async recordPromotionUse(params: {
    promotionId: string;
    userId: string;
    paymentId?: string;
    stripeCheckoutSessionId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { promotionId, userId, paymentId, stripeCheckoutSessionId, metadata } = params;

    // Verifica se già registrato (idempotenza)
    const existing = await prisma.promotion_uses.findFirst({
      where: {
        promotionId,
        userId,
      },
    });

    if (existing) {
      log.warn('[Promotion] Use already recorded (idempotency)', {
        promotionId,
        userId,
        existingId: existing.id,
      });
      return;
    }

    await prisma.promotion_uses.create({
      data: {
        id: createId(),
        promotionId,
        userId,
        paymentId,
        stripeCheckoutSessionId,
        metadata: metadata as Prisma.InputJsonValue,
        appliedAt: new Date(),
      },
    });

    log.warn('[Promotion] Use recorded', {
      promotionId,
      userId,
      paymentId,
      stripeCheckoutSessionId,
    });
  }

  /**
   * Applica promozione a checkout session Stripe
   * Restituisce configurazione per checkout session
   */
  static async applyPromotionToCheckout(
    code: string,
    userId: string
  ): Promise<ApplyPromotionResult> {
    const validation = await this.validatePromotionCode(code, userId);

    if (!validation.valid || !validation.promotion) {
      return {
        success: false,
        error: validation.error || 'Promozione non valida',
      };
    }

    const promotion = validation.promotion;

    if (promotion.type === 'STRIPE_COUPON') {
      // Per STRIPE_COUPON, restituiamo il coupon ID da applicare alla session
      const fullPromotion = await this.getPromotionByCode(code);
      return {
        success: true,
        promotionId: promotion.id,
        stripeCouponId: fullPromotion?.stripeCouponId || undefined,
      };
    } else {
      // Per BONUS_CREDITS, salveremo in metadata e applicheremo dopo pagamento
      return {
        success: true,
        promotionId: promotion.id,
        bonusCredits: promotion.bonusCredits,
      };
    }
  }
}
