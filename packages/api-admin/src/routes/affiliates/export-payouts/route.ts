/**
 * Admin API: Export Affiliate Payouts CSV
 *
 * Esporta i payout in formato CSV
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { AffiliateRewardStatus, Prisma } from '@giulio-leone/types';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

/**
 * GET: Esporta payout in CSV
 * Query params: startDate, endDate, status
 */
export async function GET(_req: Request) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const { searchParams } = new URL(_req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const statusParam = searchParams.get('status') as AffiliateRewardStatus | null;

    // Parse date range
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // Build where clause
    const where: Prisma.affiliate_rewardsWhereInput = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    if (statusParam) {
      where.status = statusParam;
    }

    // Fetch rewards with all necessary data
    const rewards = await prisma.affiliate_rewards.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        referral_attributions: {
          include: {
            users_referred: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        affiliate_programs: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    type RewardWithRelations = (typeof rewards)[number];

    // Generate CSV
    const csvHeader = [
      'ID',
      'Data',
      'Programma',
      'Affiliate ID',
      'Affiliate Nome',
      'Affiliate Email',
      'Tipo',
      'Livello',
      'Stato',
      'Crediti',
      'Importo',
      'Valuta',
      'Pending Fino',
      'Pronto Il',
      'Pagato Il',
      'Utente Referito',
      'Email Utente Referito',
    ].join(',');

    const csvRows = rewards.map((reward: RewardWithRelations) => {
      const row = [
        reward.id,
        reward.createdAt.toISOString(),
        reward.affiliate_programs?.name || 'N/D',
        reward.userId,
        reward.users?.name || 'N/D',
        reward.users?.email || 'N/D',
        reward.type,
        reward.level.toString(),
        reward.status,
        (reward.creditAmount || 0).toString(),
        (reward.currencyAmount ? Number(reward.currencyAmount).toFixed(2) : '0.00').toString(),
        reward.currencyCode || 'N/A',
        reward.pendingUntil.toISOString(),
        reward.readyAt?.toISOString() || 'N/A',
        reward.settledAt?.toISOString() || 'N/A',
        reward.referral_attributions?.users_referred?.name || 'N/A',
        reward.referral_attributions?.users_referred?.email || 'N/A',
      ];

      // Escape commas and quotes in CSV
      return row
        .map((field: unknown) => {
          const str = String(field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Set headers for CSV download
    const filename = `payouts_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    logger.error("Errore nell'esportazione dei payout:", error);
    return NextResponse.json({ error: "Errore nell'esportazione dei payout" }, { status: 500 });
  }
}
