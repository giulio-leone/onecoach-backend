import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

// Maximum records per export to prevent memory issues
const MAX_EXPORT_LIMIT = 5000;

export async function GET(req: Request) {
  const userOrError = await requireAdmin();
  if (userOrError instanceof NextResponse) return userOrError;

  try {
    // Optional pagination for large exports
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      MAX_EXPORT_LIMIT,
      Math.max(1, parseInt(searchParams.get('limit') || String(MAX_EXPORT_LIMIT), 10))
    );

    const [rows, total] = await Promise.all([
      prisma.food_items.findMany({
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          name: true,
          nameNormalized: true,
          barcode: true,
          macrosPer100g: true,
          servingSize: true,
          unit: true,
          metadata: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.food_items.count(),
    ]);

    type FoodItemType = (typeof rows)[number];
    const items = rows.map((f: FoodItemType) => ({
      id: f.id,
      name: f.name,
      nameNormalized: f.nameNormalized,
      barcode: f.barcode || undefined,
      macrosPer100g: f.macrosPer100g as unknown,
      servingSize: Number(f.servingSize),
      unit: f.unit,
      metadata: (f.metadata as unknown) || undefined,
      imageUrl: f.imageUrl || undefined,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      {
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError('Errore export alimenti', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
