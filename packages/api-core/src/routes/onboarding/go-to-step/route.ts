/**
 * Onboarding Go To Step API Route
 *
 * POST: Naviga a uno step specifico dell'onboarding
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { TOTAL_STEPS, onboardingService, requireAuth } from '@giulio-leone/lib-core';
import { logger, logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
export const dynamic = 'force-dynamic';

const goToStepSchema = z.object({
  stepNumber: z.number().int().min(1).max(TOTAL_STEPS),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const userOrError = await requireAuth();

    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    if (!userOrError.id || typeof userOrError.id !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[ONBOARDING GO-TO-STEP] User ID non valido:', userOrError);
      }
      return NextResponse.json(
        { error: 'Errore di autenticazione: ID utente non valido' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = goToStepSchema.parse(body);

    const progress = await onboardingService.goToStep(userOrError.id, parsed.stepNumber);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      logError('Dati non validi', error);
      if (error instanceof Error) {
        logger.error('[ONBOARDING GO-TO-STEP] Error message:', error.message);
        logger.error('[ONBOARDING GO-TO-STEP] Error stack:', error.stack);
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dati non validi',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
