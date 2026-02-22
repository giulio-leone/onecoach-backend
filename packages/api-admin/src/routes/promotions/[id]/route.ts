/**
 * Admin Promotion Detail API Route
 *
 * GET: Dettagli promozione con statistiche (solo admin)
 * PUT: Aggiorna promozione (solo admin)
 * DELETE: Disattiva promozione (solo admin)
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const { id } = await params;

    const promotion = await prisma.promotions.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            promotion_uses: true,
          },
        },
      },
    });

    if (!promotion) {
      return NextResponse.json({ error: 'Promozione non trovata' }, { status: 404 });
    }

    // Statistiche dettagliate
    const [totalUses, uniqueUsers, recentUses] = await Promise.all([
      prisma.promotion_uses.count({
        where: { promotionId: id },
      }),
      prisma.promotion_uses.groupBy({
        by: ['userId'],
        where: { promotionId: id },
      }),
      prisma.promotion_uses.findMany({
        where: { promotionId: id },
        orderBy: { appliedAt: 'desc' },
        take: 10,
        include: {
          users: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
    ]);

    type RecentUseType = (typeof recentUses)[number];

    return NextResponse.json({
      success: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        type: promotion.type,
        stripeCouponId: promotion.stripeCouponId,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue ? Number(promotion.discountValue) : null,
        bonusCredits: promotion.bonusCredits,
        maxUses: promotion.maxUses,
        maxUsesPerUser: promotion.maxUsesPerUser,
        validFrom: promotion.validFrom,
        validUntil: promotion.validUntil,
        isActive: promotion.isActive,
        description: promotion.description,
        createdBy: promotion.createdBy,
        createdAt: promotion.createdAt,
        updatedAt: promotion.updatedAt,
        stats: {
          totalUses,
          uniqueUsers: uniqueUsers.length,
          remainingUses: promotion.maxUses ? promotion.maxUses - totalUses : null,
          recentUses: recentUses.map((use: RecentUseType) => ({
            id: use.id,
            userId: use.userId,
            userEmail: use.users?.email || 'N/A',
            userName: use.users?.name || 'Unknown',
            appliedAt: use.appliedAt,
            paymentId: use.paymentId,
          })),
        },
      },
    });
  } catch (error: unknown) {
    logError('Errore nel recupero della promozione', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const { id } = await params;
    const body = await _req.json();
    const { isActive, validUntil, description } = body;

    // Solo campi modificabili dopo creazione
    const updateData: {
      isActive?: boolean;
      validUntil?: Date;
      description?: string | null;
    } = {};

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (validUntil) {
      updateData.validUntil = new Date(validUntil);
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const promotion = await prisma.promotions.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      promotion,
    });
  } catch (error: unknown) {
    logError("Errore nell'aggiornamento della promozione", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const { id } = await params;

    // Soft delete: disattiva promozione
    const promotion = await prisma.promotions.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Promozione disattivata con successo',
      promotion,
    });
  } catch (error: unknown) {
    logError('Errore nella disattivazione della promozione', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
