/**
 * Onboarding Progress API Route
 *
 * GET:  Ottiene lo stato corrente dell'onboarding per l'utente autenticato
 */

import { NextResponse } from 'next/server';
import { onboardingService, requireAuth } from '@giulio-leone/lib-core';
import { logger, logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userOrError = await requireAuth();

    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    if (!userOrError.id || typeof userOrError.id !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[ONBOARDING GET] User ID non valido:', userOrError);
      }
      return NextResponse.json(
        { error: 'Errore di autenticazione: ID utente non valido' },
        { status: 401 }
      );
    }

    // Ottieni o crea il progresso onboarding
    const progress = await onboardingService.getOrCreate(userOrError.id);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error: unknown) {
    logError('Impossibile recuperare lo stato onboarding', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
