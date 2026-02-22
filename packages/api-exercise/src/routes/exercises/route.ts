import { NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { ExerciseService } from '@giulio-leone/lib-exercise/exercise.service';
import { extractSearchParams } from '@giulio-leone/lib-shared/utils';
import { createExerciseSchema, exerciseQuerySchema } from '@giulio-leone/schemas/exercise.schema';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request) {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const url = new URL(_req.url);
    const params = extractSearchParams(url);

    const parsed = exerciseQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Parametri di ricerca non validi',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const includeTranslations = parsed.data.includeTranslations ?? userOrError.role === 'ADMIN';
    const includeUnapproved =
      userOrError.role === 'ADMIN' ? (parsed.data.includeUnapproved ?? false) : false;

    const result = await ExerciseService.list({
      ...parsed.data,
      includeTranslations,
      includeUnapproved,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    logError('Errore nel recupero degli esercizi', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function POST(_req: Request) {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _req.json();
    const parsed = createExerciseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Payload non valido',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const exercise = await ExerciseService.create(parsed.data, {
      userId: userOrError.id,
      autoApprove: userOrError.role === 'ADMIN',
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (error: unknown) {
    logError("Errore nella creazione dell'esercizio", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
