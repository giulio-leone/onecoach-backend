/**
 * Admin Promotions API Route
 *
 * GET: Lista tutte le promozioni (solo admin)
 * POST: Crea una nuova promozione (solo admin)
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { PromotionService } from '@giulio-leone/lib-marketplace';
import { prisma } from '@giulio-leone/lib-core';
import type { PromotionType, DiscountType, Prisma } from '@giulio-leone/types';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const { searchParams } = new URL(_req.url);
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type') as PromotionType | null;
    const validFrom = searchParams.get('validFrom');
    const validUntil = searchParams.get('validUntil');

    // Costruisci filtri
    const where: Prisma.promotionsWhereInput = {};

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (type) {
      where.type = type;
    }

    if (validFrom) {
      where.validFrom = {
        lte: new Date(validFrom),
      };
    }

    if (validUntil) {
      where.validUntil = {
        gte: new Date(validUntil),
      };
    }

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));

    // Recupera promozioni con statistiche usi
    const promotions = await prisma.promotions.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            promotion_uses: true,
          },
        },
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    type PromotionWithCount = (typeof promotions)[number];

    // Arricchisci con statistiche dettagliate
    const promotionsWithStats = await Promise.all(
      promotions.map(async (promo: PromotionWithCount) => {
        const totalUses = promo._count.promotion_uses;
        const uniqueUsers = await prisma.promotion_uses.groupBy({
          by: ['userId'],
          where: { promotionId: promo.id },
        });

        return {
          id: promo.id,
          code: promo.code,
          type: promo.type,
          stripeCouponId: promo.stripeCouponId,
          discountType: promo.discountType,
          discountValue: promo.discountValue ? Number(promo.discountValue) : null,
          bonusCredits: promo.bonusCredits,
          maxUses: promo.maxUses,
          maxUsesPerUser: promo.maxUsesPerUser,
          validFrom: promo.validFrom,
          validUntil: promo.validUntil,
          isActive: promo.isActive,
          description: promo.description,
          createdBy: promo.createdBy,
          createdAt: promo.createdAt,
          updatedAt: promo.updatedAt,
          stats: {
            totalUses,
            uniqueUsers: uniqueUsers.length,
            remainingUses: promo.maxUses ? promo.maxUses - totalUses : null,
          },
        };
      })
    );

    const total = await prisma.promotions.count({ where });

    return NextResponse.json({
      success: true,
      promotions: promotionsWithStats,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: unknown) {
    logError('Errore nel recupero delle promozioni', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function POST(_req: Request) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const body = await _req.json();
    const {
      code,
      type,
      stripeCouponId,
      discountType,
      discountValue,
      bonusCredits,
      maxUses,
      maxUsesPerUser,
      validFrom,
      validUntil,
      description,
    } = body;

    // Validazione input
    if (!code || !type) {
      return NextResponse.json({ error: 'code e type richiesti' }, { status: 400 });
    }

    if (type === 'STRIPE_COUPON' && (!discountType || !discountValue)) {
      return NextResponse.json(
        { error: 'discountType e discountValue richiesti per STRIPE_COUPON' },
        { status: 400 }
      );
    }

    if (type === 'BONUS_CREDITS' && (!bonusCredits || bonusCredits <= 0)) {
      return NextResponse.json(
        { error: 'bonusCredits richiesto e deve essere maggiore di 0' },
        { status: 400 }
      );
    }

    if (!validFrom) {
      return NextResponse.json({ error: 'validFrom richiesto' }, { status: 400 });
    }

    // Crea promozione
    const promotionId = await PromotionService.createPromotion({
      code,
      type: type as PromotionType,
      stripeCouponId,
      discountType: discountType as DiscountType | undefined,
      discountValue: discountValue ? Number(discountValue) : undefined,
      bonusCredits: bonusCredits ? Number(bonusCredits) : undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
      maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : 1,
      validFrom: new Date(validFrom),
      validUntil: validUntil ? new Date(validUntil) : undefined,
      description,
      createdBy: adminOrError.id,
    });

    // Recupera promozione creata
    const promotion = await prisma.promotions.findUnique({
      where: { id: promotionId },
    });

    return NextResponse.json({
      success: true,
      promotion,
    });
  } catch (error: unknown) {
    logError('Errore nella creazione della promozione', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
