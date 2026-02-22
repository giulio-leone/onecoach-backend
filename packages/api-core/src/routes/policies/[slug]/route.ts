/**
 * Public Policy API Route
 *
 * GET: Ottiene una policy pubblicata per slug
 */

import { NextResponse } from 'next/server';
import { PolicyService } from '@giulio-leone/lib-core/policy.service';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const policy = await PolicyService.getPolicyBySlug(slug);

    if (!policy) {
      return NextResponse.json({ error: 'Policy non trovata' }, { status: 404 });
    }

    // Verifica che la policy sia pubblicata
    if (policy.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Policy non disponibile' }, { status: 404 });
    }

    return NextResponse.json({ policy });
  } catch (error: unknown) {
    logError('Errore nel recupero della policy', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
