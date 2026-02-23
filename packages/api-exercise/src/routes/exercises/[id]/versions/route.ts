import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const url = new URL(_req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100) : 20;

    const versions = await prisma.exercise_versions.findMany({
      where: { exerciseId: id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    type VersionType = (typeof versions)[number];

    return NextResponse.json({
      versions: versions.map((version: VersionType) => ({
        id: version.id,
        version: version.version,
        baseVersion: version.baseVersion,
        diff: version.diff,
        metadata: version.metadata,
        createdAt: version.createdAt,
        createdBy: version.users
          ? {
              id: version.users.id,
              name: version.users.name,
              email: version.users.email,
            }
          : null,
      })),
    });
  } catch (error: unknown) {
    logError('Errore nel recupero delle versioni', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
