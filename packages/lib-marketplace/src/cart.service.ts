/**
 * Cart Service
 *
 * Gestione carrello, totali, promozioni e offerte cross/upsell.
 * Segue principi KISS/SOLID: una singola responsabilità per operazioni di cart.
 */

import { prisma } from '@giulio-leone/lib-core';
import { findCreditPackOption } from '@giulio-leone/constants';
import { marketplaceService } from './marketplace.service';
import { PromotionService } from './promotion.service';
import type { CartItemType, CartStatus, cart_items, carts } from '@prisma/client';

export type CartItemInput = {
  itemType: CartItemType;
  itemId: string;
  quantity?: number;
};

export type CartWithItems = carts & { cart_items: cart_items[] };

interface OfferEvaluationContext {
  subtotal: number;
  itemIds: string[];
}

class CartService {
  /**
   * Restituisce il carrello attivo dell'utente, creandolo se non esiste.
   */
  async getOrCreateCart(userId: string): Promise<CartWithItems> {
    const existing = await prisma.carts.findFirst({
      where: { userId, status: 'ACTIVE' as CartStatus },
      include: { cart_items: true },
    });

    if (existing) {
      return existing;
    }

    return await prisma.carts.create({
      data: {
        userId,
        currency: 'EUR',
      },
      include: { cart_items: true },
    });
  }

  /**
   * Recupera un carrello per ID garantendo l'appartenenza all'utente.
   */
  async getCart(cartId: string, userId: string): Promise<CartWithItems | null> {
    return await prisma.carts.findFirst({
      where: { id: cartId, userId },
      include: { cart_items: true },
    });
  }

  /**
   * Aggiunge o aggiorna un item nel carrello.
   */
  async addOrUpdateItem(userId: string, input: CartItemInput): Promise<CartWithItems> {
    const cart = await this.getOrCreateCart(userId);

    const { itemType, itemId } = input;
    const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;

    // Recupera info prodotto per prezzatura
    const product = await this.resolveItem(itemType, itemId);

    await prisma.cart_items.upsert({
      where: {
        cartId_itemType_itemId: {
          cartId: cart.id,
          itemType,
          itemId,
        },
      },
      create: {
        cartId: cart.id,
        itemType,
        itemId,
        quantity,
        unitPrice: product.price,
        currency: product.currency.toUpperCase(),
        title: product.title,
        description: product.description,
        image: product.image,
      },
      update: {
        quantity,
        unitPrice: product.price,
        currency: product.currency.toUpperCase(),
        title: product.title,
        description: product.description,
        image: product.image,
      },
    });

    return await this.recalculate(cart.id);
  }

  /**
   * Aggiorna la quantità di un item.
   */
  async updateQuantity(
    userId: string,
    itemType: CartItemType,
    itemId: string,
    quantity: number
  ): Promise<CartWithItems> {
    const cart = await this.getOrCreateCart(userId);
    if (quantity <= 0) {
      await prisma.cart_items.deleteMany({
        where: { cartId: cart.id, itemType, itemId },
      });
    } else {
      await prisma.cart_items.updateMany({
        where: { cartId: cart.id, itemType, itemId },
        data: { quantity },
      });
    }
    return await this.recalculate(cart.id);
  }

  /**
   * Rimuove un item dal carrello.
   */
  async removeItem(userId: string, itemType: CartItemType, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    await prisma.cart_items.deleteMany({
      where: { cartId: cart.id, itemType, itemId },
    });
    return await this.recalculate(cart.id);
  }

  /**
   * Pulisce il carrello.
   */
  async clear(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await prisma.cart_items.deleteMany({ where: { cartId: cart.id } });
    return await this.recalculate(cart.id);
  }

  /**
   * Applica un codice promo sul carrello (sconto immediato se STRIPE_COUPON).
   */
  async applyPromo(userId: string, promoCode: string | null): Promise<CartWithItems> {
    const cart = await this.getOrCreateCart(userId);

    if (!promoCode) {
      await prisma.carts.update({
        where: { id: cart.id },
        data: { promoCode: null, discountTotal: 0 },
      });
      return await this.recalculate(cart.id);
    }

    const promo = await PromotionService.getPromotionByCode(promoCode);
    if (!promo || !promo.isActive) {
      throw new Error('Codice promo non valido');
    }

    await prisma.carts.update({
      where: { id: cart.id },
      data: { promoCode: promo.code },
    });

    return await this.recalculate(cart.id);
  }

  /**
   * Attacca un referral code al carrello.
   */
  async attachReferral(userId: string, referralCode: string | null): Promise<CartWithItems> {
    const cart = await this.getOrCreateCart(userId);
    await prisma.carts.update({
      where: { id: cart.id },
      data: { referralCode: referralCode || null },
    });
    return await this.recalculate(cart.id);
  }

  /**
   * Recupera offerte cross/upsell attive filtrate per condizioni base.
   */
  async getActiveOffers(cart: CartWithItems) {
    const now = new Date();
    const rules = await prisma.checkout_offer_rules.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startsAt: null },
              {
                startsAt: {
                  lte: now,
                },
              },
            ],
          },
          {
            OR: [
              { endsAt: null },
              {
                endsAt: {
                  gte: now,
                },
              },
            ],
          },
        ],
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      take: 5,
    });

    const ctx: OfferEvaluationContext = {
      subtotal: Number(cart.subtotal || 0),
      itemIds: cart.cart_items.map((i: any) => i.itemId),
    };

    return rules.filter((rule: any) =>
      this.evaluateRule(rule.conditions as Record<string, unknown> | null, ctx)
    );
  }

  /**
   * Recalcola totali tenendo conto di eventuali promo.
   */
  private async recalculate(cartId: string): Promise<CartWithItems> {
    const cart = await prisma.carts.findUnique({
      where: { id: cartId },
      include: { cart_items: true },
    });
    if (!cart) {
      throw new Error('Carrello non trovato');
    }

    const subtotal = cart.cart_items.reduce((sum: any, item: any) => {
      return sum + Number(item.unitPrice) * item.quantity;
    }, 0);

    let discountTotal = 0;

    if (cart.promoCode) {
      const promo = await PromotionService.getPromotionByCode(cart.promoCode);
      if (promo?.discountType && promo.discountValue) {
        if (promo.discountType === 'PERCENTAGE') {
          discountTotal = (subtotal * Number(promo.discountValue)) / 100;
        } else if (promo.discountType === 'FIXED_AMOUNT') {
          discountTotal = Number(promo.discountValue);
        }
      }
    }

    const total = Math.max(0, subtotal - discountTotal);

    const updated = await prisma.carts.update({
      where: { id: cart.id },
      data: {
        subtotal,
        discountTotal,
        total,
        lastSeenAt: new Date(),
      },
      include: { cart_items: true },
    });

    return updated;
  }

  /**
   * Valuta le condizioni di una regola (subset minimo: minSubtotal, includeItems, excludeItems).
   */
  private evaluateRule(
    conditions: Record<string, unknown> | null,
    ctx: OfferEvaluationContext
  ): boolean {
    if (!conditions) return true;
    const minSubtotal =
      typeof conditions['minSubtotal'] === 'number' ? (conditions['minSubtotal'] as number) : null;
    if (minSubtotal !== null && ctx.subtotal < minSubtotal) {
      return false;
    }

    const includeItems = Array.isArray(conditions['includeItems'])
      ? (conditions['includeItems'] as string[])
      : [];
    if (includeItems.length > 0 && !includeItems.some((id) => ctx.itemIds.includes(id))) {
      return false;
    }

    const excludeItems = Array.isArray(conditions['excludeItems'])
      ? (conditions['excludeItems'] as string[])
      : [];
    if (excludeItems.some((id) => ctx.itemIds.includes(id))) {
      return false;
    }

    return true;
  }

  /**
   * Risolve metadati e prezzo per un item.
   */
  private async resolveItem(
    itemType: CartItemType,
    itemId: string
  ): Promise<{
    price: number;
    currency: string;
    title: string;
    description?: string;
    image?: string;
  }> {
    if (itemType === 'CREDIT_PACK') {
      const pack = findCreditPackOption(parseInt(itemId, 10));
      if (!pack) {
        throw new Error('Pack crediti non trovato');
      }
      return {
        price: pack.price,
        currency: pack.currency,
        title: `${pack.credits} crediti`,
        description: `Pacchetto ${pack.credits} crediti`,

      };
    }

    if (itemType === 'MARKETPLACE_PLAN') {
      const plan = await marketplaceService.getPlan(itemId);
      if (!plan) {
        throw new Error('Piano marketplace non trovato');
      }
      return {
        price: Number(plan.price),
        currency: plan.currency || 'EUR',
        title: plan.title,
        description: `Piano di ${plan.coach?.name || 'Coach'}`,
        image: plan.coverImage || undefined,
      };
    }

    throw new Error('Tipo item non supportato');
  }
}

export const cartService = new CartService();
