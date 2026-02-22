import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { ExerciseService } from '@giulio-leone/lib-exercise/exercise.service';
import { ExerciseApprovalStatus } from '@giulio-leone/types';
import { z } from 'zod';
import { logError, getErrorMessage, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

const batchSchema = z.object({
  action: z.enum(['approve', 'reject', 'setStatus', 'delete']),
  ids: z.array(z.string().trim().min(1)).min(1),
  status: z.nativeEnum(ExerciseApprovalStatus).optional(),
});

export async function POST(_req: Request): Promise<Response> {
  const adminOrError: any = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  // Type guard: adminOrError è un user con id valido
  if (!adminOrError.id || typeof adminOrError.id !== 'string') {
    return NextResponse.json(
      { error: 'Errore di autenticazione: sessione non valida' },
      { status: 401 }
    );
  }

  const adminId = adminOrError.id;

  try {
    const body = await _req.json();
    const parsed = batchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Payload batch non valido',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { action, ids } = parsed.data;
    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    if (action === 'delete') {
      for (const id of ids) {
        try {
          await ExerciseService.delete(id);
          results.push({ id, success: true });
        } catch (error: unknown) {
          results.push({
            id,
            success: false,
            error: getErrorMessage(error),
          });
        }
      }

      return NextResponse.json({
        success: true,
        results,
        deleted: results.filter((result) => result.success).length,
      });
    }

    const targetStatus =
      action === 'approve'
        ? ExerciseApprovalStatus.APPROVED
        : action === 'reject'
          ? ExerciseApprovalStatus.REJECTED
          : parsed.data.status;

    if (!targetStatus) {
      return NextResponse.json(
        { error: 'Specificare uno stato valido per questa operazione' },
        { status: 400 }
      );
    }

    for (const id of ids) {
      try {
        await ExerciseService.setApprovalStatus(id, targetStatus, {
          userId: adminId,
        });
        results.push({ id, success: true });
      } catch (error: unknown) {
        results.push({
          id,
          success: false,
          error: getErrorMessage(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      updated: results.filter((result) => result.success).length,
      status: targetStatus,
    });
  } catch (error: unknown) {
    logError('Errore nelle operazioni batch sugli esercizi', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
