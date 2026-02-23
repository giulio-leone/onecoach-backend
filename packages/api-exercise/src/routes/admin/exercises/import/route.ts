import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import {
  ExerciseAdminService,
  exerciseImportSchema,
} from '@giulio-leone/lib-exercise/exercise-admin.service';
import { z } from 'zod';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

const importRequestSchema = z.object({
  items: z.preprocess(
    (value) => (Array.isArray(value) ? value : value ? [value] : []),
    z.array(exerciseImportSchema as z.ZodType)
  ),
  autoApprove: z.boolean().optional(),
  mergeExisting: z.boolean().optional(),
});

export async function POST(_req: NextRequest): Promise<Response> {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const body = await _req.json();
    const parsed = importRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Payload import non valido',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await ExerciseAdminService.import(parsed.data.items, {
      userId: adminOrError.id,
      autoApprove: parsed.data.autoApprove,
      mergeExisting: parsed.data.mergeExisting,
    });

    return NextResponse.json({
      success: true,
      summary: result,
    });
  } catch (error: unknown) {
    logError("Errore nell'importazione degli esercizi", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
