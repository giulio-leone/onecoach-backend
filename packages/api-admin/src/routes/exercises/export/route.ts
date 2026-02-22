import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { ExerciseAdminService } from '@giulio-leone/lib-exercise';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const url = new URL(_req.url);
    const includeUnapproved = url.searchParams.get('includeUnapproved')?.toLowerCase() === 'true';

    const exercises = await ExerciseAdminService.exportAll({ includeUnapproved });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: exercises.length,
      exercises,
    });
  } catch (_error: unknown) {
    return NextResponse.json({ error: "Errore nell'esportazione degli esercizi" }, { status: 500 });
  }
}
