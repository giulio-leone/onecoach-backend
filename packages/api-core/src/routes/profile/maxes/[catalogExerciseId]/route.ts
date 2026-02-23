/**
 * API Route: User One Rep Max by Exercise
 *
 * Endpoints per gestire un singolo massimale per esercizio
 *
 * NOMENCLATURA:
 * - catalogExerciseId: ID dell'esercizio nel catalogo database
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { OneRepMaxService } from '@giulio-leone/lib-exercise/one-rep-max.service';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/maxes/[catalogExerciseId]
 * Ottiene il massimale per un esercizio specifico
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ catalogExerciseId: string }> }
): Promise<Response> {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  if (!('id' in userOrError) || typeof userOrError.id !== 'string') {
    logger.error(
      '[API] GET /api/profile/maxes/[catalogExerciseId]: User ID non valido',
      userOrError
    );
    return NextResponse.json(
      { error: 'Errore di autenticazione: ID utente non valido' },
      { status: 401 }
    );
  }

  const userId = userOrError.id;

  try {
    const params = await context.params;
    const result = await OneRepMaxService.getByExercise(userId, params.catalogExerciseId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!result.data) {
      return NextResponse.json({ error: 'Massimale non trovato' }, { status: 404 });
    }

    return NextResponse.json({ max: result.data });
  } catch (error: unknown) {
    logError('Errore nel recupero del massimale', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * DELETE /api/profile/maxes/[catalogExerciseId]
 * Elimina un massimale
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ catalogExerciseId: string }> }
): Promise<Response> {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  if (!('id' in userOrError) || typeof userOrError.id !== 'string') {
    logger.error(
      '[API] DELETE /api/profile/maxes/[catalogExerciseId]: User ID non valido',
      userOrError
    );
    return NextResponse.json(
      { error: 'Errore di autenticazione: ID utente non valido' },
      { status: 401 }
    );
  }

  const userId = userOrError.id;

  try {
    const params = await context.params;
    const result = await OneRepMaxService.delete(userId, params.catalogExerciseId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logError("Errore nell'eliminazione del massimale", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
