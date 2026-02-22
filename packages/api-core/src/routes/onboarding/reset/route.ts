/**
 * Onboarding Reset API Route
 *
 * POST: Resetta l'onboarding dell'utente (utile per testing o re-onboarding)
 */

import { NextResponse } from 'next/server';
import { onboardingService, requireAuth } from '@giulio-leone/lib-core';
import { logger, logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
export const dynamic = 'force-dynamic';

export async function POST(): Promise<Response> {
  try {
    const userOrError: any = await requireAuth();

    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    if (!userOrError.id || typeof userOrError.id !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[ONBOARDING RESET] User ID non valido:', userOrError);
      }
      return NextResponse.json(
        { error: 'Errore di autenticazione: ID utente non valido' },
        { status: 401 }
      );
    }

    const progress = await onboardingService.reset(userOrError.id);

    return NextResponse.json({
      success: true,
      progress,
      message: 'Onboarding resetted successfully',
    });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logError("Impossibile resettare l'onboarding", error);
      if (error instanceof Error) {
        logger.error('[ONBOARDING RESET] Error message:', error.message);
        logger.error('[ONBOARDING RESET] Error stack:', error.stack);
      }
    }

    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
