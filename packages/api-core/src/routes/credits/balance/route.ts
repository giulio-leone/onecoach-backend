/**
 * Credits Balance API Route
 *
 * GET: Ottiene il saldo crediti dell'utente corrente
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { creditService } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const stats = await creditService.getCreditStats(userOrError.id);

    return NextResponse.json({
      balance: stats.balance,
      hasUnlimitedCredits: stats.hasUnlimitedCredits,
      totalConsumed: stats.totalConsumed,
      totalAdded: stats.totalAdded,
      lastTransaction: stats.lastTransaction,
    });
  } catch (error: unknown) {
    logError('Errore nel recupero del saldo crediti', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
