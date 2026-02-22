/**
 * Onboarding Complete All API Route
 *
 * POST: Completa immediatamente l'intero onboarding (skip all)
 */

import { NextResponse } from 'next/server';
import { onboardingService, requireAuth } from '@giulio-leone/lib-core';
import { logger, logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const userOrError = await requireAuth();

    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    if (!userOrError.id || typeof userOrError.id !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[ONBOARDING COMPLETE-ALL] User ID non valido:', userOrError);
      }
      return NextResponse.json(
        { error: 'Errore di autenticazione: ID utente non valido' },
        { status: 401 }
      );
    }

    const progress = await onboardingService.completeAll(userOrError.id);

    return NextResponse.json({
      success: true,
      progress,
      message: 'Onboarding completed successfully',
    });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logError("Impossibile completare l'onboarding", error);
      if (error instanceof Error) {
        logger.error('[ONBOARDING COMPLETE-ALL] Error message:', error.message);
        logger.error('[ONBOARDING COMPLETE-ALL] Error stack:', error.stack);
      }
    }

    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
