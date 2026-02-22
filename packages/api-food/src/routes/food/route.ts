/**
 * Food API Route
 *
 * POST /api/food - Crea nuovo alimento (solo admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireAuth } from '@giulio-leone/lib-core';
import { FoodService } from '@giulio-leone/lib-food';
import { prisma } from '@giulio-leone/lib-core';
import { Prisma } from '@giulio-leone/types/database';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest): Promise<Response> {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _req.json();
    const {
      name,
      description,
      macrosPer100g,
      servingSize,
      unit,
      barcode,
      metadata,
      imageUrl,
      brandId,
      brandName,
      categoryIds,
    } = body;

    // Validazione base
    if (!name || !macrosPer100g) {
      return NextResponse.json({ error: 'Nome e macrosPer100g sono obbligatori' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'La descrizione è obbligatoria e deve essere una stringa non vuota' },
        { status: 400 }
      );
    }

    if (typeof macrosPer100g !== 'object') {
      return NextResponse.json({ error: 'macrosPer100g deve essere un oggetto' }, { status: 400 });
    }

    const newFood = await FoodService.createFood({
      name,
      description: description.trim(), // REQUIRED
      macrosPer100g,
      servingSize,
      unit,
      barcode, // Optional
      metadata,
      imageUrl,
      brandId,
      brandName,
      categoryIds,
    });

    return NextResponse.json({ foodItem: newFood }, { status: 201 });
  } catch (error: unknown) {
    logError("Errore nella creazione dell'alimento", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * GET /api/food - Listing paginato con filtri e sort
 * Parametri supportati:
 * - search: string (match su name/nameNormalized)
 * - brand, category, barcode: string
 * - kcalMin, kcalMax: number (filtra su macrosPer100g.calories)
 * - page: number (default 1)
 * - pageSize: number (default 20, max 100)
 * - sortBy: 'createdAt' | 'updatedAt' | 'name' | 'calories'
 * - sortOrder: 'asc' | 'desc'
 */
export async function GET(_req: NextRequest): Promise<Response> {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const url = new URL(_req.url);
    const search = url.searchParams.get('search')?.trim() || '';
    const brandId = url.searchParams.get('brandId')?.trim() || '';
    const categoryIdsParam = url.searchParams.get('categoryIds')?.trim() || '';
    const categoryIds = categoryIdsParam ? categoryIdsParam.split(',').filter(Boolean) : [];
    const barcode = url.searchParams.get('barcode')?.trim() || '';
    const kcalMin = parseFloat(url.searchParams.get('kcalMin') || '');
    const kcalMax = parseFloat(url.searchParams.get('kcalMax') || '');
    const macroDominant = url.searchParams.get('macroDominant') as
      | 'protein'
      | 'carbs'
      | 'fats'
      | null;
    const minProteinPct = parseFloat(url.searchParams.get('minProteinPct') || '');
    const minCarbPct = parseFloat(url.searchParams.get('minCarbPct') || '');
    const minFatPct = parseFloat(url.searchParams.get('minFatPct') || '');
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
    const pageSizeRaw = parseInt(url.searchParams.get('pageSize') || '20', 10);
    const pageSize = Math.min(Math.max(pageSizeRaw || 20, 1), 100);

    const sortByParam = (url.searchParams.get('sortBy') || 'updatedAt') as
      | 'createdAt'
      | 'updatedAt'
      | 'name'
      | 'calories';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Costruzione filtro Prisma
    const where: Prisma.food_itemsWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { nameNormalized: { contains: search.toLowerCase() } },
      ];
    }
    if (barcode) where.barcode = barcode;
    if (brandId) where.brandId = brandId;
    if (categoryIds.length > 0) {
      where.categories = {
        some: { categoryId: { in: categoryIds } },
      };
    }

    // Filtri macros (calories in JSON)
    const caloriesPath = ['calories'];
    const caloriesFilter: { gte?: number; lte?: number } = {};
    if (!isNaN(kcalMin)) caloriesFilter.gte = kcalMin;
    if (!isNaN(kcalMax)) caloriesFilter.lte = kcalMax;
    if (Object.keys(caloriesFilter).length > 0) {
      where.macrosPer100g = {
        path: caloriesPath,
        numeric: caloriesFilter,
      } as Prisma.JsonFilter<'food_items'>;
    }

    // Filtri percentuali macro
    if (!isNaN(minProteinPct)) where.proteinPct = { gte: minProteinPct };
    if (!isNaN(minCarbPct)) where.carbPct = { gte: minCarbPct };
    if (!isNaN(minFatPct)) where.fatPct = { gte: minFatPct };

    // Filtro macroDominant: trova alimenti dove una macro è dominante rispetto alle altre
    if (macroDominant) {
      try {
        let query: Prisma.Sql;
        if (macroDominant === 'protein') {
          query = Prisma.sql`
            SELECT id FROM food_items
            WHERE "proteinPct" > COALESCE("carbPct", 0)
              AND "proteinPct" > COALESCE("fatPct", 0)
              AND "proteinPct" IS NOT NULL
              AND "carbPct" IS NOT NULL
              AND "fatPct" IS NOT NULL
          `;
        } else if (macroDominant === 'carbs') {
          query = Prisma.sql`
            SELECT id FROM food_items
            WHERE "carbPct" > COALESCE("proteinPct", 0)
              AND "carbPct" > COALESCE("fatPct", 0)
              AND "proteinPct" IS NOT NULL
              AND "carbPct" IS NOT NULL
              AND "fatPct" IS NOT NULL
          `;
        } else if (macroDominant === 'fats') {
          query = Prisma.sql`
            SELECT id FROM food_items
            WHERE "fatPct" > COALESCE("proteinPct", 0)
              AND "fatPct" > COALESCE("carbPct", 0)
              AND "proteinPct" IS NOT NULL
              AND "carbPct" IS NOT NULL
              AND "fatPct" IS NOT NULL
          `;
        } else {
          query = Prisma.empty;
        }

        if (query !== Prisma.empty) {
          const dominantIds = await prisma.$queryRaw<Array<{ id: string }>>(query);
          type DominantIdType = (typeof dominantIds)[number];
          const ids = dominantIds.map((row: DominantIdType) => row.id);
          if (ids.length > 0) {
            where.id = { in: ids };
          } else {
            // Nessun alimento corrisponde, ritorna vuoto
            where.id = { in: [] };
          }
        }
      } catch (error: unknown) {
        // In caso di errore, ignora il filtro
        logError('Errore nel filtro macroDominant', error);
      }
    }

    // Ordinamento
    let orderBy: Prisma.food_itemsOrderByWithRelationInput = { updatedAt: sortOrder };
    if (sortByParam === 'createdAt') orderBy = { createdAt: sortOrder };
    if (sortByParam === 'name') orderBy = { name: sortOrder };
    if (sortByParam === 'calories')
      orderBy = {
        macrosPer100g: { path: ['calories'], sort: sortOrder },
      } as any;

    const [total, rows] = await Promise.all([
      prisma.food_items.count({ where }),
      prisma.food_items.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          food_item_translations: { where: { locale: 'it' }, take: 1 },
          brand: true,
          categories: { include: { food_categories: true } },
        },
      }),
    ]);

    type FoodItemType = (typeof rows)[number];
    type CategoryType = FoodItemType['categories'][number];

    const items = rows.map((f: FoodItemType) => ({
      id: f.id,
      name: f.name,
      nameNormalized: f.nameNormalized,
      barcode: f.barcode || undefined,
      macrosPer100g: f.macrosPer100g as unknown,
      servingSize: Number(f.servingSize), // REQUIRED - always present (NOT NULL)
      unit: f.unit,
      metadata: (f.metadata as unknown) || undefined,
      imageUrl: f.imageUrl || undefined,
      brand: f.brand ? { id: f.brand.id, name: f.brand.name } : undefined,
      categories:
        f.categories?.map((fc: CategoryType) => ({
          id: fc.food_categories.id,
          name: fc.food_categories.name,
          slug: fc.food_categories.slug,
        })) || [],
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data: items, total, page, pageSize });
  } catch (error: unknown) {
    logError('Errore nel recupero alimenti', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
