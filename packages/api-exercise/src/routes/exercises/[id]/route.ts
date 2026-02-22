import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireAuth } from '@giulio-leone/lib-core';
import { ExerciseService } from '@giulio-leone/lib-exercise/exercise.service';
import { extractSearchParams } from '@giulio-leone/lib-shared/utils';
import { exerciseDetailQuerySchema, updateExerciseSchema } from '@giulio-leone/schemas/exercise.schema';
import { ExerciseApprovalStatus } from '@giulio-leone/types';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  const userOrError: any = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const url = new URL(_req.url);
    const queryParsed = exerciseDetailQuerySchema.safeParse(extractSearchParams(url));

    if (!queryParsed.success) {
      return NextResponse.json(
        {
          error: 'Parametri non validi',
          details: queryParsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const includeTranslations =
      queryParsed.data.includeTranslations ?? userOrError.role === 'ADMIN';
    const includeUnapproved =
      userOrError.role === 'ADMIN' ? (queryParsed.data.includeUnapproved ?? false) : false;

    const exercise = await ExerciseService.getById(id, queryParsed.data.locale, {
      includeTranslations,
      includeUnapproved,
    });

    if (!exercise) {
      return NextResponse.json({ error: 'Esercizio non trovato' }, { status: 404 });
    }

    return NextResponse.json({ exercise });
  } catch (error: unknown) {
    logError("Errore nel recupero dell'esercizio", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function PUT(_req: NextRequest, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  const adminOrError: any = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const body = await _req.json();
    const parsed = updateExerciseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Payload non valido',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const exercise = await ExerciseService.update(id, parsed.data, {
      userId: adminOrError.id,
      includeTranslations: true,
    });

    return NextResponse.json({ exercise });
  } catch (error: unknown) {
    logError("Errore nell'aggiornamento dell'esercizio", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  const adminOrError: any = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const exercise = await ExerciseService.setApprovalStatus(id, ExerciseApprovalStatus.REJECTED, {
      userId: adminOrError.id,
    });

    return NextResponse.json({ exercise });
  } catch (error: unknown) {
    logError("Errore nell'eliminazione dell'esercizio", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
