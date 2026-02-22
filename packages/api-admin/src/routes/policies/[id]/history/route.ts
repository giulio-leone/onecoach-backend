/**
 * Admin Policy History API Route
 *
 * GET: Ottiene lo storico di una policy
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { PolicyService } from '@giulio-leone/lib-core/policy.service';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const { id } = await params;

    const history = await PolicyService.getPolicyHistory(id);

    return NextResponse.json({ history });
  } catch (error: unknown) {
    logError('Errore nel recupero dello storico della policy', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
