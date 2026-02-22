/**
 * API Route: User One Rep Max Versions
 *
 * Endpoints per gestire le versioni storiche dei massimali
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { OneRepMaxService } from '@giulio-leone/lib-exercise/one-rep-max.service';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/maxes/[catalogExerciseId]/versions
 * Ottiene la cronologia delle versioni di un massimale
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ catalogExerciseId: string }> }
): Promise<Response> {
  const userOrError: any = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  // Verifica che userOrError abbia un id valido
  if (!('id' in userOrError) || typeof userOrError.id !== 'string') {
    logger.error(
      '[API] GET /api/profile/maxes/[catalogExerciseId]/versions: User ID non valido',
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

    const result = await OneRepMaxService.getVersions(userId, params.catalogExerciseId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    // Recupera anche la versione corrente per includere il numero di versione attuale
    const currentMax = await OneRepMaxService.getByExercise(userId, params.catalogExerciseId);

    return NextResponse.json({
      versions: result.data ?? [],
      currentVersion: currentMax.data?.version ?? 1,
      total: result.data?.length ?? 0,
    });
  } catch (error: unknown) {
    logError('Errore nel recupero delle versioni', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
