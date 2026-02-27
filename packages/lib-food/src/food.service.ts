import { prisma } from '@giulio-leone/lib-core';
import { Prisma } from '@prisma/client';
import { createId } from '@giulio-leone/lib-shared/id-generator';
import { toPrismaJsonValue } from '@giulio-leone/lib-shared';
import { SUPPORTED_FOOD_LOCALES } from '@giulio-leone/constants';
import { createFoodSchema } from '@giulio-leone/schemas';

import { normalizeFoodName } from './utils';
import type {
  FoodItem,
  FoodListOptions,
  FoodSearchOptions,
  FoodsResponse,
  FullTextSearchOptions,
  FullTextSearchRow,
  MacrosPer100g,
  MainMacro,
  CreateFoodInput,
  UpdateFoodInput,
} from './types';

export const DEFAULT_LOCALE = 'it';

// ── BM25 avg doc length cache ───────────────────────────────────────
let cachedAvgDocLength: number | null = null;
let avgDocLengthCacheTime = 0;
const AVG_DOC_LENGTH_CACHE_TTL_MS = 3_600_000; // 1 hour

// ── Validation schema with superRefine ──────────────────────────────
const foodImportSchemaBase = createFoodSchema;
export const foodImportSchema = foodImportSchemaBase.superRefine((data, ctx) => {
  if (!data.name || data.name.trim() === '') {
    ctx.addIssue({
      code: 'custom',
      message: 'name è obbligatorio e non può essere vuoto',
      path: ['name'],
    });
  }
  if (!data.description || data.description.trim() === '') {
    ctx.addIssue({
      code: 'custom',
      message: 'description è obbligatorio e non può essere vuoto (min 10 caratteri)',
      path: ['description'],
    });
  } else if (data.description.trim().length < 10) {
    ctx.addIssue({
      code: 'custom',
      message: 'description deve essere di almeno 10 caratteri',
      path: ['description'],
    });
  }
  if (!data.macrosPer100g) {
    ctx.addIssue({
      code: 'custom',
      message: 'macrosPer100g è obbligatorio',
      path: ['macrosPer100g'],
    });
  } else {
    const { calories, protein, carbs, fats } = data.macrosPer100g;
    if (
      typeof calories !== 'number' ||
      typeof protein !== 'number' ||
      typeof carbs !== 'number' ||
      typeof fats !== 'number'
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'macrosPer100g deve contenere calories, protein, carbs, fats come numeri',
        path: ['macrosPer100g'],
      });
    }
  }
  if (!data.servingSize || data.servingSize < 1 || data.servingSize > 10_000) {
    ctx.addIssue({
      code: 'custom',
      message: 'servingSize è obbligatorio e deve essere tra 1 e 10000',
      path: ['servingSize'],
    });
  }
});

// ── Prisma food item with relations (inline type) ───────────────────
interface PrismaFoodWithRelations {
  id: string;
  name: string;
  nameNormalized: string;
  barcode: string | null;
  macrosPer100g: unknown;
  servingSize: unknown;
  unit: string;
  imageUrl: string | null;
  brandId: string | null;
  mainMacro: unknown;
  proteinPct: unknown;
  carbPct: unknown;
  fatPct: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  food_item_translations?: Array<{
    name: string;
    description: string | null;
  }>;
  brand?: { name: string } | null;
  categories?: Array<{
    food_categories: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
}

export class FoodService {
  /**
   * Recupera alimento per ID
   */
  static async getFoodById(id: string): Promise<FoodItem | null> {
    const food = await prisma.food_items.findUnique({
      where: { id },
      include: {
        food_item_translations: {
          where: { locale: DEFAULT_LOCALE },
          take: 1,
        },
        brand: true,
        categories: { include: { food_categories: true } },
      },
    });
    if (!food) return null;
    return this.mapToFoodItem(food as unknown as PrismaFoodWithRelations);
  }

  /**
   * Recupera multipli alimenti per IDs (batch lookup)
   */
  static async getFoodsByIds(ids: string[]): Promise<FoodItem[]> {
    if (ids.length === 0) return [];
    const foods = await prisma.food_items.findMany({
      where: { id: { in: ids } },
      include: {
        food_item_translations: {
          where: { locale: DEFAULT_LOCALE },
        },
        brand: true,
        categories: { include: { food_categories: true } },
      },
    });
    return foods.map((f) => this.mapToFoodItem(f as unknown as PrismaFoodWithRelations));
  }

  /**
   * Recupera alimenti comuni (es. per contesto AI)
   */
  static async getCommonFoods(limit: number = 100): Promise<FoodItem[]> {
    const foods = await prisma.food_items.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        food_item_translations: {
          where: { locale: DEFAULT_LOCALE },
          take: 1,
        },
        brand: true,
        categories: { include: { food_categories: true } },
      },
    });
    return foods.map((f) => this.mapToFoodItem(f as unknown as PrismaFoodWithRelations));
  }

  /**
   * Lista alimenti con paginazione
   */
  static async list(options: FoodListOptions = {}): Promise<FoodsResponse> {
    const limit = options.limit || 100;
    const page = options.page || 1;
    const pageSize = options.pageSize || limit;
    const locale = options.locale || DEFAULT_LOCALE;

    const [foods, total] = await Promise.all([
      prisma.food_items.findMany({
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          food_item_translations: {
            where: { locale },
            take: 1,
          },
          brand: true,
          categories: { include: { food_categories: true } },
        },
      }),
      prisma.food_items.count(),
    ]);

    const items = foods.map((f) => this.mapToFoodItem(f as unknown as PrismaFoodWithRelations));
    return { data: items, total, page, pageSize };
  }

  /**
   * Cerca alimenti con BM25 search
   */
  static async searchFoods(
    query: string,
    options: FoodSearchOptions = {},
  ): Promise<FoodItem[]> {
    const locale = options.locale || DEFAULT_LOCALE;
    const limit = options.limit || 20;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const searchResults = await this.searchFullText(query, { locale, limit });
    if (searchResults.length === 0) {
      return [];
    }

    const foodIds = searchResults.map((r) => r.id);
    const foods = await prisma.food_items.findMany({
      where: { id: { in: foodIds } },
      include: {
        food_item_translations: { where: { locale } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const foodMap = new Map(foods.map((f) => [f.id, f]));
    return searchResults
      .map((r) => foodMap.get(r.id))
      .filter((f): f is NonNullable<typeof f> => f !== undefined)
      .map((f) => this.mapToFoodItem(f as unknown as PrismaFoodWithRelations));
  }

  /**
   * Crea nuovo alimento
   */
  static async createFood(data: CreateFoodInput): Promise<FoodItem> {
    const nameNormalized = normalizeFoodName(data.name);
    const locale = DEFAULT_LOCALE;

    const totalKcal = Math.max(1, data.macrosPer100g.calories || 0);
    const proteinPct = Math.min(
      100,
      Math.max(0, (data.macrosPer100g.protein || 0) * 4 * 100 / totalKcal),
    );
    const carbPct = Math.min(
      100,
      Math.max(0, (data.macrosPer100g.carbs || 0) * 4 * 100 / totalKcal),
    );
    const fatPct = Math.min(
      100,
      Math.max(0, (data.macrosPer100g.fats || 0) * 9 * 100 / totalKcal),
    );
    const mainMacro = this.calculateMainMacro(data.macrosPer100g as MacrosPer100g);

    let resolvedBrandId = data.brandId;
    if (!resolvedBrandId && data.brandName) {
      const nameNorm = normalizeFoodName(data.brandName);
      const existing = await prisma.food_brands.findFirst({
        where: { nameNormalized: nameNorm },
      });
      const brand =
        existing ||
        (await prisma.food_brands.create({
          data: { id: createId(), name: data.brandName, nameNormalized: nameNorm },
        }));
      resolvedBrandId = brand.id;
    }

    const food = await prisma.food_items.create({
      data: {
        id: createId(),
        name: data.name,
        nameNormalized,
        barcode: data.barcode,
        macrosPer100g: toPrismaJsonValue(data.macrosPer100g),
        servingSize: data.servingSize,
        unit: data.unit || 'g',
        metadata: data.metadata,
        imageUrl: data.imageUrl,
        brandId: resolvedBrandId || null,
        mainMacro: toPrismaJsonValue(mainMacro),
        proteinPct,
        carbPct,
        fatPct,
        food_item_translations: {
          create: SUPPORTED_FOOD_LOCALES.map((l: string) => ({
            id: createId(),
            locale: l,
            name: data.name,
            description: data.description,
          })),
        },
        ...(data.categoryIds && data.categoryIds.length
          ? {
              categories: {
                createMany: {
                  data: data.categoryIds.map((cid) => ({
                    categoryId: String(cid),
                  })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
      include: {
        food_item_translations: { where: { locale } },
        brand: true,
        categories: { include: { food_categories: true } },
      },
    });

    return this.mapToFoodItem(food as unknown as PrismaFoodWithRelations);
  }

  /**
   * Aggiorna alimento esistente
   */
  static async updateFood(id: string, data: UpdateFoodInput): Promise<FoodItem> {
    const updateData: Record<string, unknown> = {
      ...(data.name && {
        name: data.name,
        nameNormalized: normalizeFoodName(data.name),
      }),
      ...(data.macrosPer100g && {
        macrosPer100g: toPrismaJsonValue(data.macrosPer100g),
      }),
      ...(data.servingSize !== undefined && { servingSize: data.servingSize }),
      ...(data.unit && { unit: data.unit }),
      ...(data.barcode !== undefined && { barcode: data.barcode }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      updatedAt: new Date(),
    };

    if (data.macrosPer100g) {
      const totalKcal = Math.max(1, data.macrosPer100g.calories || 0);
      updateData.proteinPct = (data.macrosPer100g.protein || 0) * 4 * 100 / totalKcal;
      updateData.carbPct = (data.macrosPer100g.carbs || 0) * 4 * 100 / totalKcal;
      updateData.fatPct = (data.macrosPer100g.fats || 0) * 9 * 100 / totalKcal;
      const mainMacro = this.calculateMainMacro(data.macrosPer100g);
      updateData.mainMacro = toPrismaJsonValue(mainMacro);
    }

    if (data.brandId || data.brandName) {
      let resolvedBrandId = data.brandId;
      if (!resolvedBrandId && data.brandName) {
        const nameNorm = normalizeFoodName(data.brandName);
        const existing = await prisma.food_brands.findFirst({
          where: { nameNormalized: nameNorm },
        });
        const brand =
          existing ||
          (await prisma.food_brands.create({
            data: { id: createId(), name: data.brandName, nameNormalized: nameNorm },
          }));
        resolvedBrandId = brand.id;
      }
      updateData.brand = resolvedBrandId
        ? { connect: { id: resolvedBrandId } }
        : { disconnect: true };
    }

    await prisma.food_item_translations.updateMany({
      where: { foodItemId: id },
      data: { description: data.description },
    });

    const food = await prisma.food_items.update({
      where: { id },
      data: {
        ...updateData,
        ...(data.categoryIds
          ? {
              categories: {
                deleteMany: {},
                createMany: {
                  data: data.categoryIds.map((cid) => ({
                    categoryId: String(cid),
                  })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
      include: {
        food_item_translations: { where: { locale: DEFAULT_LOCALE } },
        brand: true,
        categories: { include: { food_categories: true } },
      },
    });

    return this.mapToFoodItem(food as unknown as PrismaFoodWithRelations);
  }

  /**
   * Calcola mainMacro dai macros
   */
  static calculateMainMacro(macros: MacrosPer100g): MainMacro {
    const protein = macros.protein || 0;
    const carbs = macros.carbs || 0;
    const fats = macros.fats || 0;

    const proteinCalories = protein * 4;
    const carbsCalories = carbs * 4;
    const fatsCalories = fats * 9;
    const totalCalculatedCalories = proteinCalories + carbsCalories + fatsCalories;

    if (totalCalculatedCalories === 0) {
      return { type: 'BALANCED', percentage: 0 };
    }

    const proteinPercentage = (proteinCalories / totalCalculatedCalories) * 100;
    const carbsPercentage = (carbsCalories / totalCalculatedCalories) * 100;
    const fatsPercentage = (fatsCalories / totalCalculatedCalories) * 100;

    const PREDOMINANCE_THRESHOLD = 40;

    let mainType: MainMacro['type'];
    let mainPercentage: number;

    if (proteinPercentage >= carbsPercentage && proteinPercentage >= fatsPercentage) {
      mainType = 'PROTEIN';
      mainPercentage = proteinPercentage;
    } else if (carbsPercentage >= proteinPercentage && carbsPercentage >= fatsPercentage) {
      mainType = 'CARBS';
      mainPercentage = carbsPercentage;
    } else {
      mainType = 'FATS';
      mainPercentage = fatsPercentage;
    }

    if (mainPercentage < PREDOMINANCE_THRESHOLD) {
      return { type: 'BALANCED', percentage: Math.round(mainPercentage * 10) / 10 };
    }

    return {
      type: mainType,
      percentage: Math.round(mainPercentage * 10) / 10,
    };
  }

  /**
   * Cerca alimenti per nome normalizzato (batch lookup)
   */
  static async getFoodsByNames(
    names: string[],
    locale: string = DEFAULT_LOCALE,
  ): Promise<Map<string, FoodItem>> {
    if (names.length === 0) return new Map();
    const normalizedNames = names.map(normalizeFoodName);
    const foods = await prisma.food_items.findMany({
      where: { nameNormalized: { in: normalizedNames } },
      include: {
        food_item_translations: { where: { locale } },
      },
    });

    const map = new Map<string, FoodItem>();
    for (const food of foods) {
      map.set(
        food.nameNormalized,
        this.mapToFoodItem(food as unknown as PrismaFoodWithRelations),
      );
    }
    return map;
  }

  /**
   * Cerca alimento per nome normalizzato esatto
   */
  static async getFoodByNameNormalized(normalizedName: string): Promise<FoodItem | null> {
    const food = await prisma.food_items.findFirst({
      where: { nameNormalized: normalizedName },
      include: {
        food_item_translations: { where: { locale: DEFAULT_LOCALE } },
      },
    });
    if (!food) return null;
    return this.mapToFoodItem(food as unknown as PrismaFoodWithRelations);
  }

  /**
   * Search full-text con BM25 (PostgreSQL tsquery + ts_rank_cd)
   */
  static async searchFullText(
    term: string,
    options: FullTextSearchOptions,
  ): Promise<FullTextSearchRow[]> {
    const query = term.trim();
    if (!query) return [];

    const preparedTerm = query.replace(/[:!&|']/g, ' ');

    let avgLen = 50;
    const now = Date.now();
    if (cachedAvgDocLength && now - avgDocLengthCacheTime < AVG_DOC_LENGTH_CACHE_TTL_MS) {
      avgLen = cachedAvgDocLength;
    } else {
      const avgDocLength = await prisma.$queryRaw<Array<{ avg_length: number | null }>>(
        Prisma.sql`
          SELECT AVG(LENGTH(name || ' ' || COALESCE(description, '')))::numeric AS avg_length
          FROM "food_item_translations"
        `,
      );
      avgLen = avgDocLength[0]?.avg_length ?? 50;
      cachedAvgDocLength = avgLen;
      avgDocLengthCacheTime = now;
    }

    const rows = await prisma.$queryRaw<FullTextSearchRow[]>(
      Prisma.sql`
        SELECT
          fi.id AS id,
          MAX(CASE WHEN fit."locale" = ${options.locale} THEN 1 ELSE 0 END)::boolean AS has_locale,
          MAX(
            ts_rank_cd(
              to_tsvector('italian', fit.name || ' ' || COALESCE(fit.description, '')),
              plainto_tsquery('italian', ${preparedTerm})
            ) * CASE 
              WHEN fit."locale" = ${options.locale} THEN 2.0
              WHEN fit."locale" = ${DEFAULT_LOCALE} THEN 1.0
              ELSE 0.5
            END
          ) AS rank
        FROM "food_items" fi
        INNER JOIN "food_item_translations" fit ON fit."foodItemId" = fi.id
        WHERE to_tsvector('italian', fit.name || ' ' || COALESCE(fit.description, '')) @@ plainto_tsquery('italian', ${preparedTerm})
        GROUP BY fi.id
        ORDER BY rank DESC, fi."createdAt" DESC
        LIMIT ${options.limit}
      `,
    );
    return rows;
  }

  /**
   * Mappa Prisma model a FoodItem type
   */
  static mapToFoodItem(food: PrismaFoodWithRelations): FoodItem {
    const translations = Array.isArray(food.food_item_translations)
      ? food.food_item_translations
      : food.food_item_translations
        ? [food.food_item_translations]
        : [];
    const translation = translations[0];
    const mainMacro = food.mainMacro as { type: string; percentage: number } | null;

    return {
      id: food.id,
      name: translation?.name || food.name,
      nameNormalized: food.nameNormalized,
      barcode: food.barcode || undefined,
      macrosPer100g: food.macrosPer100g as MacrosPer100g,
      servingSize: food.servingSize ? Number(food.servingSize) : 0,
      unit: food.unit,
      imageUrl: food.imageUrl || undefined,
      brandId: food.brandId || undefined,
      mainMacro: (mainMacro as FoodItem['mainMacro']) || { type: 'BALANCED', percentage: 0 },
      proteinPct: food.proteinPct ? Number(food.proteinPct) : 0,
      carbPct: food.carbPct ? Number(food.carbPct) : 0,
      fatPct: food.fatPct ? Number(food.fatPct) : 0,
      metadata: {
        ...((food.metadata as Record<string, unknown>) || {}),
        ...('brand' in food && food.brand ? { brand: food.brand.name } : {}),
        ...('categories' in food &&
        Array.isArray(food.categories) &&
        food.categories.length > 0
          ? {
              categories: food.categories
                .map((fc) => {
                  const category = fc.food_categories;
                  return category
                    ? { id: category.id, name: category.name, slug: category.slug }
                    : null;
                })
                .filter((cat): cat is NonNullable<typeof cat> => cat !== null),
            }
          : {}),
      },
      createdAt: food.createdAt.toISOString(),
      updatedAt: food.updatedAt.toISOString(),
    };
  }
}

export const foodService = FoodService;
