/**
 * API Route: User One Rep Max
 *
 * Endpoints per gestire i massimali 1RM degli utenti
 *
 * NOMENCLATURA:
 * - catalogExerciseId: ID dell'esercizio nel catalogo database (unico standard)
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { OneRepMaxService } from '@giulio-leone/lib-exercise/one-rep-max.service';
import { updateProgramWeightsForExerciseId } from '@giulio-leone/one-workout';
import { z } from 'zod';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

const upsertSchema = z.object({
  catalogExerciseId: z.string().min(1, 'ID esercizio catalogo richiesto'),
  oneRepMax: z.number().positive().max(1000, 'Massimale troppo alto'),
  notes: z.string().nullable().optional(),
});

/**
 * GET /api/profile/maxes
 * Lista tutti i massimali dell'utente autenticato
 */
export async function GET(): Promise<Response> {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  // Verifica che userOrError abbia un id valido
  if (!('id' in userOrError) || typeof userOrError.id !== 'string') {
    logger.error('[API] GET /api/profile/maxes: User ID non valido', userOrError);
    return NextResponse.json(
      { error: 'Errore di autenticazione: ID utente non valido' },
      { status: 401 }
    );
  }

  const userId = userOrError.id;

  try {
    const result = await OneRepMaxService.getByUserId(userId);

    if (!result.success) {
      logger.error('[API] GET /api/profile/maxes service error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Errore nel recupero dei massimali' },
        { status: 400 }
      );
    }

    return NextResponse.json({ maxes: result.data ?? [] });
  } catch (error: unknown) {
    logError('Errore interno del server', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * POST /api/profile/maxes
 * Crea o aggiorna un massimale (upsert)
 */
export async function POST(_req: Request): Promise<Response> {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  // Verifica che userOrError abbia un id valido
  if (!('id' in userOrError) || typeof userOrError.id !== 'string') {
    logger.error('[API] POST /api/profile/maxes: User ID non valido', userOrError);
    return NextResponse.json(
      { error: 'Errore di autenticazione: ID utente non valido' },
      { status: 401 }
    );
  }

  const userId = userOrError.id;

  try {
    const body = await _req.json();
    const parsed = upsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Dati non validi',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await OneRepMaxService.upsert(userId, parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Recalculate weights in active programs
    await updateProgramWeightsForExerciseId(userId, parsed.data.catalogExerciseId);

    return NextResponse.json({ max: result.data });
  } catch (error: unknown) {
    logError('Errore nel salvataggio del massimale', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
