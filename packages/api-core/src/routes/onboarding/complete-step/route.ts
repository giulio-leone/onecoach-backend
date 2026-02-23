/**
 * Onboarding Complete Step API Route
 *
 * POST: Completa uno step dell'onboarding
 */

import { NextResponse } from 'next/server';
import {
  ONBOARDING_STEPS,
  TOTAL_STEPS,
  onboardingService,
  requireAuth,
  saveOnboardingProfile,
} from '@giulio-leone/lib-core';
import { z } from 'zod';
import { getErrorMessage, logError, logger } from '@giulio-leone/lib-shared';
export const dynamic = 'force-dynamic';

const completeStepSchema = z.object({
  stepNumber: z.number().int().min(1).max(TOTAL_STEPS),
  skipped: z.boolean().optional().default(false),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const userOrError = await requireAuth();

    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    if (!userOrError.id || typeof userOrError.id !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[ONBOARDING COMPLETE-STEP] User ID non valido:', userOrError);
      }
      return NextResponse.json(
        { error: 'Errore di autenticazione: ID utente non valido' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = completeStepSchema.parse(body);

    // Salva i dati del profilo se è lo step PROFILE_SETUP
    if (parsed.stepNumber === ONBOARDING_STEPS.PROFILE_SETUP && parsed.metadata?.profileData) {
      await saveOnboardingProfile(
        userOrError.id,
        parsed.metadata.profileData as {
          name?: string;
          age?: number;
          sex?: 'MALE' | 'FEMALE' | 'OTHER';
          heightCm?: number;
          weightKg?: number;
        }
      );
    }

    const progress = await onboardingService.completeStep(userOrError.id, {
      stepNumber: parsed.stepNumber,
      skipped: parsed.skipped,
      metadata: parsed.metadata,
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      if (error instanceof Error) {
        logger.error('[ONBOARDING COMPLETE-STEP] Error message:', error.message);
        logger.error('[ONBOARDING COMPLETE-STEP] Error stack:', error.stack);
      }
      logError('Errore completamento step onboarding', error);
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

    return NextResponse.json(
      {
        error: 'Impossibile completare lo step',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
