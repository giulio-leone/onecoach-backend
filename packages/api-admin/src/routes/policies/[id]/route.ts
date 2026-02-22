/**
 * Admin Policy API Route
 *
 * GET: Ottiene una policy specifica
 * PUT: Aggiorna una policy (solo admin)
 * DELETE: Elimina una policy (solo admin)
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { PolicyService } from '@giulio-leone/lib-core/policy.service';
import type { PolicyStatus } from '@giulio-leone/types';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const { id } = await params;

    const policy = await PolicyService.getPolicyById(id, true);

    if (!policy) {
      return NextResponse.json({ error: 'Policy non trovata' }, { status: 404 });
    }

    return NextResponse.json({ policy });
  } catch (error: unknown) {
    logError('Errore nel recupero della policy', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const { id } = await params;
    const body = await _req.json();
    const { slug, title, content, metaDescription, status, changeReason } = body;

    // Validazione slug se fornito
    if (slug) {
      const slugAvailable = await PolicyService.isSlugAvailable(slug, id);
      if (!slugAvailable) {
        return NextResponse.json({ error: 'Slug già in uso' }, { status: 400 });
      }
    }

    const updatedPolicy = await PolicyService.updatePolicy({
      id,
      slug,
      title,
      content,
      metaDescription,
      status: status as PolicyStatus,
      updatedById: userOrError.id,
      changeReason,
    });

    return NextResponse.json({
      success: true,
      policy: updatedPolicy,
    });
  } catch (error: unknown) {
    logError("Errore nell'aggiornamento della policy", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const { id } = await params;

    await PolicyService.deletePolicy(id);

    return NextResponse.json({
      success: true,
      message: 'Policy eliminata con successo',
    });
  } catch (error: unknown) {
    logError("Errore nell'eliminazione della policy", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
