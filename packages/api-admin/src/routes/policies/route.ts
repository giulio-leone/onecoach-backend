/**
 * Admin Policies API Route
 *
 * GET: Ottiene tutte le policy
 * POST: Crea una nuova policy (solo admin)
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { PolicyService } from '@giulio-leone/lib-core/policy.service';
import { PolicyType, PolicyStatus } from '@giulio-leone/types';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const policies = await PolicyService.getAllPolicies(true);
    const stats = await PolicyService.getPolicyStats();

    return NextResponse.json({
      policies,
      stats,
    });
  } catch (error: unknown) {
    logError('Errore nel recupero delle policy', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function POST(_req: Request) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _req.json();
    const { slug, type, title, content, metaDescription, status } = body;

    // Validazione
    if (!slug || !type || !title || !content) {
      return NextResponse.json(
        { error: 'Campi obbligatori: slug, type, title, content' },
        { status: 400 }
      );
    }

    // Verifica che il tipo sia valido
    if (!['PRIVACY', 'TERMS', 'GDPR', 'CONTENT'].includes(type)) {
      return NextResponse.json({ error: 'Tipo policy non valido' }, { status: 400 });
    }

    // Verifica che lo slug non sia già in uso
    const slugAvailable = await PolicyService.isSlugAvailable(slug);
    if (!slugAvailable) {
      return NextResponse.json({ error: 'Slug già in uso' }, { status: 400 });
    }

    // Verifica che non esista già una policy di questo tipo
    const existingPolicy = await PolicyService.getPolicyByType(type);
    if (existingPolicy) {
      return NextResponse.json({ error: `Esiste già una policy di tipo ${type}` }, { status: 400 });
    }

    const policy = await PolicyService.createPolicy({
      slug,
      type: type as PolicyType,
      title,
      content,
      metaDescription,
      status: status as PolicyStatus,
      createdById: userOrError.id,
    });

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (error: unknown) {
    logError('Errore nella creazione della policy', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
