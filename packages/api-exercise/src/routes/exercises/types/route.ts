import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const userOrError = await requireAuth();
  if (userOrError instanceof NextResponse) return userOrError;

  const url = new URL(_req.url);
  const q = url.searchParams.get('q')?.trim() || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {};
  const rows = await prisma.exercise_types.findMany({
    where,
    orderBy: { name: 'asc' },
    take: limit,
  });

  type ExerciseTypeType = (typeof rows)[number];
  return NextResponse.json({
    data: rows.map((r: ExerciseTypeType) => ({ id: r.id, name: r.name })),
  });
}
