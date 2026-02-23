/**
 * Admin API - Update Payout
 *
 * PUT /api/admin/affiliates/payouts/[id]
 * Approva, rifiuta o marca pagato un payout
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { AffiliateService } from '@giulio-leone/lib-marketplace';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteParams = Promise<{ id: string }>;

const updatePayoutSchema = z.object({
  action: z.enum(['approve', 'reject', 'mark_paid']),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

export async function PUT(_req: NextRequest, context: { params: RouteParams }) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const params = await context.params;
    const { id: payoutId } = params;

    const body = await _req.json();
    const parsed = updatePayoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Dati non validi',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { action, notes, reason } = parsed.data;
    const adminUserId = userOrError.id;

    let payout;

    switch (action) {
      case 'approve':
        payout = await AffiliateService.approvePayout(payoutId, adminUserId, notes);
        break;

      case 'reject':
        if (!reason) {
          return NextResponse.json({ error: 'Motivo obbligatorio per rifiuto' }, { status: 400 });
        }
        payout = await AffiliateService.rejectPayout(payoutId, adminUserId, reason);
        break;

      case 'mark_paid':
        payout = await AffiliateService.markPayoutPaid(payoutId, adminUserId);
        break;

      default:
        return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payout,
      message: `Payout ${action === 'approve' ? 'approvato' : action === 'reject' ? 'rifiutato' : 'marcato come pagato'}`,
    });
  } catch (_error: unknown) {
    return NextResponse.json(
      {
        error: "Errore nell'aggiornamento payout",
        message: _error instanceof Error ? _error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    );
  }
}
