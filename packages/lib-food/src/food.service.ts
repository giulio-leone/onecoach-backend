/**
 * Food Service
 *
 * Servizio per gestione catalogo alimenti con search BM25
 * Segue pattern ExerciseService per consistenza
 *
 * NOTE: This file does not use 'server-only' because it's exported from lib-food
 * which is imported by one-agent package used in client components. The service
 * methods themselves are only executed server-side when called from API routes
 * or server components. Pure utility functions like normalizeFoodName can be
 * safely used in client components.
 */

import { prisma } from '@giulio-leone/lib-core';
import { Prisma } from '@prisma/client';
import { createId } from '@giulio-leone/lib-shared/id-generator';
import { toPrismaJsonValue } from '@giulio-leone/lib-shared';
import type { FoodItem } from '@giulio-leone/types';
import type { Macros } from '@giulio-leone/types';
import { SUPPORTED_FOOD_LOCALES } from '@giulio-leone/constants';
import type { FoodsResponse } from '@giulio-leone/lib-api';

const DEFAULT_LOCALE = 'it';

interface SearchFoodOptions {
  locale?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
}

interface FoodListOptions {
  limit?: number;
  page?: number;
  pageSize?: number;
  locale?: string;
}

// Allineato con FoodsResponse da lib-api per consistenza strutturale
// Rimuoviamo FoodListResult e usiamo direttamente FoodsResponse

interface SearchResultRow {
  id: string;
  has_locale: boolean;
  rank: number;
}

// Tipo per il risultato Prisma con include flessibile
// Accetta qualsiasi risultato Prisma che abbia almeno food_item_translations
type FoodItemWithRelations = Prisma.food_itemsGetPayload<{
  include: {
    food_item_translations: true;
  };
}> & {
  // Campi opzionali che potrebbero essere presenti in alcuni query
  brand?: Prisma.food_brandsGetPayload<{}> | null;
  categories?: Array<{
    food_categories: Prisma.food_categoriesGetPayload<{}>;
  }>;
  mainMacro?: Prisma.JsonValue;
};

// Cache per average document length (BM25)
let cachedAvgDocLength: number | null = null;
let avgDocLengthCacheTime: number = 0;
const AVG_DOC_LENGTH_CACHE_TTL_MS = 3600000; // 1 hour

/**
 * Normalizza nome alimento per matching
 */
export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuovi accenti
    .replace(/[^\w\s]/g, '') // Rimuovi caratteri speciali
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcola macros per quantità data da macrosPer100g
 */
export function calculateMacrosFromQuantity(
  macrosPer100g: Macros,
  quantity: number,
  unit: string = 'g'
): Macros {
  // Converti quantity in grammi se necessario
  let quantityInGrams = quantity;
  if (unit === 'kg') quantityInGrams = quantity * 1000;
  else if (unit === 'ml' && macrosPer100g.calories) {
    // Assumiamo 1ml ≈ 1g per liquidi (approssimazione)
    quantityInGrams = quantity;
  }

  const multiplier = quantityInGrams / 100;

  return {
    calories: Math.round(macrosPer100g.calories * multiplier * 100) / 100, // Round to 2 decimals
    protein: Math.round(macrosPer100g.protein * multiplier * 100) / 100,
    carbs: Math.round(macrosPer100g.carbs * multiplier * 100) / 100,
    fats: Math.round(macrosPer100g.fats * multiplier * 100) / 100,
    fiber: macrosPer100g.fiber
      ? Math.round(macrosPer100g.fiber * multiplier * 100) / 100
      : undefined,
  };
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

    return this.mapToFoodItem(food);
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

    return foods.map((f) => this.mapToFoodItem(f as FoodItemWithRelations));
  }

  /**
   * Recupera alimenti comuni (es. per contesto AI)
   * Restituisce gli ultimi alimenti creati o aggiornati
   */
  static async getCommonFoods(limit: number = 100): Promise<FoodItem[]> {
    const foods = await prisma.food_items.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        food_item_translations: {
          where: { locale: DEFAULT_LOCALE },
          take: 1,
        },
        brand: true,
        categories: { include: { food_categories: true } },
      },
    });

    return foods.map((f) => this.mapToFoodItem(f as FoodItemWithRelations));
  }

  /**
   * Lista alimenti con paginazione
   * SSOT: Restituisce direttamente FoodsResponse da lib-api (nessuna duplicazione)
   */
  static async list(options: FoodListOptions = {}): Promise<
    FoodsResponse & {
      page: number;
      pageSize: number;
    }
  > {
    const limit = options.limit || 100;
    const page = options.page || 1;
    const pageSize = options.pageSize || limit;
    const locale = options.locale || DEFAULT_LOCALE;

    const [foods, total] = await Promise.all([
      prisma.food_items.findMany({
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: {
          createdAt: 'desc',
        },
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

    const items = foods.map((f: FoodItemWithRelations) => this.mapToFoodItem(f));

    // Restituisce direttamente FoodsResponse (allineato con lib-api)
    return {
      data: items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Cerca alimenti con BM25 search
   */
  static async searchFoods(query: string, options: SearchFoodOptions = {}): Promise<FoodItem[]> {
    const locale = options.locale || DEFAULT_LOCALE;
    const limit = options.limit || 20;

    // Null safety for query parameter
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const searchResults = await this.searchFullText(query, { locale, limit });

    if (searchResults.length === 0) {
      return [];
    }

    const foodIds = searchResults.map((r: SearchResultRow) => r.id);
    const foods = await prisma.food_items.findMany({
      where: { id: { in: foodIds } },
      include: {
        food_item_translations: {
          where: { locale },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mantieni ordine BM25
    const foodMap = new Map<string, FoodItemWithRelations>(foods.map((f) => [f.id, f]));
    return searchResults
      .map((r) => foodMap.get(r.id))
      .filter((f): f is FoodItemWithRelations => f !== undefined)
      .map((f) => this.mapToFoodItem(f));
  }

  /**
   * Crea nuovo alimento
   */
  static async createFood(data: {
    name: string;
    description: string; // REQUIRED
    macrosPer100g: Macros;
    servingSize: number; // REQUIRED
    unit?: string;
    barcode?: string;
    metadata?: Record<string, unknown>;
    imageUrl?: string;
    locale?: string;
    brandId?: string;
    brandName?: string;
    categoryIds?: string[];
  }): Promise<FoodItem> {
    const nameNormalized = normalizeFoodName(data.name);
    const locale = data.locale || DEFAULT_LOCALE;

    // Calcola percentuali macro
    const totalKcal = Math.max(1, data.macrosPer100g.calories || 0);
    const proteinPct = Math.min(
      100,
      Math.max(0, ((data.macrosPer100g.protein || 0) * 4 * 100) / totalKcal)
    );
    const carbPct = Math.min(
      100,
      Math.max(0, ((data.macrosPer100g.carbs || 0) * 4 * 100) / totalKcal)
    );
    const fatPct = Math.min(
      100,
      Math.max(0, ((data.macrosPer100g.fats || 0) * 9 * 100) / totalKcal)
    );

    // Calcola mainMacro se non fornito
    const mainMacro = this.calculateMainMacro(data.macrosPer100g);

    // Brand: usa brandId o crea brand da brandName
    let resolvedBrandId: string | undefined = data.brandId;
    if (!resolvedBrandId && data.brandName) {
      const nameNorm = normalizeFoodName(data.brandName);
      const existing = await prisma.food_brands.findFirst({ where: { nameNormalized: nameNorm } });
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
        macrosPer100g: toPrismaJsonValue(data.macrosPer100g as Record<string, unknown>),
        servingSize: data.servingSize,
        unit: data.unit || 'g',
        metadata: data.metadata as Prisma.InputJsonValue,
        imageUrl: data.imageUrl,
        brandId: resolvedBrandId || null, // Use brandId directly instead of relation
        mainMacro: toPrismaJsonValue(mainMacro as Record<string, unknown>), // REQUIRED - campo presente nello schema
        proteinPct,
        carbPct,
        fatPct,
        food_item_translations: {
          create: SUPPORTED_FOOD_LOCALES.map((locale: string) => ({
            id: createId(),
            locale,
            name: data.name, // Same name for all locales
            description: data.description, // Same description for all locales (can be enhanced later with AI translation)
          })),
        },
        ...(data.categoryIds && data.categoryIds.length
          ? {
              categories: {
                createMany: {
                  data: data.categoryIds.map((cid) => ({ categoryId: String(cid) })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      } as Prisma.food_itemsUncheckedCreateInput,
      include: {
        food_item_translations: {
          where: { locale },
        },
        brand: true,
        categories: { include: { food_categories: true } },
      },
    });

    // Il risultato include già food_item_translations, brand e categories
    return this.mapToFoodItem(food as FoodItemWithRelations);
  }

  /**
   * Aggiorna alimento esistente
   */
  static async updateFood(
    id: string,
    data: {
      name?: string;
      description: string; // REQUIRED - always required even in updates
      macrosPer100g?: Macros;
      servingSize?: number;
      unit?: string;
      barcode?: string; // Optional - only for packaged foods
      metadata?: Record<string, unknown>;
      imageUrl?: string;
      brandId?: string;
      brandName?: string;
      categoryIds?: string[];
    }
  ): Promise<FoodItem> {
    const updateData: Prisma.food_itemsUpdateInput = {
      ...(data.name && { name: data.name, nameNormalized: normalizeFoodName(data.name) }),
      ...(data.macrosPer100g && {
        macrosPer100g: toPrismaJsonValue(data.macrosPer100g as Record<string, unknown>),
      }),
      ...(data.servingSize !== undefined && { servingSize: data.servingSize }),
      ...(data.unit && { unit: data.unit }),
      ...(data.barcode !== undefined && { barcode: data.barcode }),
      ...(data.metadata !== undefined && {
        metadata: data.metadata as Prisma.InputJsonValue,
      }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      updatedAt: new Date(),
    };

    // Percentuali macro e mainMacro se macros aggiornate
    if (data.macrosPer100g) {
      const totalKcal = Math.max(1, data.macrosPer100g.calories || 0);
      updateData.proteinPct = ((data.macrosPer100g.protein || 0) * 4 * 100) / totalKcal;
      updateData.carbPct = ((data.macrosPer100g.carbs || 0) * 4 * 100) / totalKcal;
      updateData.fatPct = ((data.macrosPer100g.fats || 0) * 9 * 100) / totalKcal;

      // Calcola mainMacro
      const mainMacro = this.calculateMainMacro(data.macrosPer100g);
      (updateData as Record<string, unknown>).mainMacro = toPrismaJsonValue(
        mainMacro as Record<string, unknown>
      );
    }

    // Brand (id o creazione da name)
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

    // Aggiorna descrizione nelle traduzioni (sempre obbligatoria)
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
                  data: data.categoryIds.map((cid) => ({ categoryId: String(cid) })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
      include: {
        food_item_translations: {
          where: { locale: DEFAULT_LOCALE },
        },
        brand: true,
        categories: { include: { food_categories: true } },
      },
    });

    return this.mapToFoodItem(food);
  }

  /**
   * Calcola mainMacro dai macros
   */
  private static calculateMainMacro(macros: Macros): { type: string; percentage: number } {
    const protein = macros.protein || 0;
    const carbs = macros.carbs || 0;
    const fats = macros.fats || 0;

    // Calculate calories from each macro
    const proteinCalories = protein * 4;
    const carbsCalories = carbs * 4;
    const fatsCalories = fats * 9;

    const totalCalculatedCalories = proteinCalories + carbsCalories + fatsCalories;

    // If no macros, return balanced
    if (totalCalculatedCalories === 0) {
      return { type: 'BALANCED', percentage: 0 };
    }

    // Calculate percentages
    const proteinPercentage = (proteinCalories / totalCalculatedCalories) * 100;
    const carbsPercentage = (carbsCalories / totalCalculatedCalories) * 100;
    const fatsPercentage = (fatsCalories / totalCalculatedCalories) * 100;

    // Find predominant macro (must be > 40% to be considered predominant)
    const PREDOMINANCE_THRESHOLD = 40;

    let mainType: string;
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

    // If no single macro is predominant (>40%), mark as BALANCED
    if (mainPercentage < PREDOMINANCE_THRESHOLD) {
      return { type: 'BALANCED', percentage: Math.round(mainPercentage * 10) / 10 };
    }

    // Round to 1 decimal place
    return {
      type: mainType,
      percentage: Math.round(mainPercentage * 10) / 10,
    };
  }

  /**
   * Cerca alimenti per nome normalizzato (batch lookup, usato in matching)
   */
  static async getFoodsByNames(
    names: string[],
    locale: string = DEFAULT_LOCALE
  ): Promise<Map<string, FoodItem>> {
    if (names.length === 0) return new Map();

    const normalizedNames = names.map(normalizeFoodName);
    const foods = await prisma.food_items.findMany({
      where: {
        nameNormalized: { in: normalizedNames },
      },
      include: {
        food_item_translations: {
          where: { locale },
        },
      },
    });

    const map = new Map<string, FoodItem>();
    for (const food of foods) {
      map.set(food.nameNormalized, this.mapToFoodItem(food as FoodItemWithRelations));
    }

    return map;
  }

  /**
   * Cerca alimento per nome normalizzato esatto (usato in matching esatto)
   */
  static async getFoodByNameNormalized(normalizedName: string): Promise<FoodItem | null> {
    const food = await prisma.food_items.findFirst({
      where: {
        nameNormalized: normalizedName,
      },
      include: {
        food_item_translations: {
          where: { locale: DEFAULT_LOCALE },
        },
      },
    });

    if (!food) return null;

    return this.mapToFoodItem(food as FoodItemWithRelations);
  }

  /**
   * Search full-text con BM25
   */
  private static async searchFullText(
    term: string,
    options: {
      locale: string;
      limit: number;
    }
  ): Promise<SearchResultRow[]> {
    const query = term.trim();
    if (!query) {
      return [];
    }

    const preparedTerm = query.replace(/[:!&|']/g, ' ');

    // Get average document length for BM25 (cached for 1 hour)
    let avgLen = 50.0;
    const now = Date.now();

    if (cachedAvgDocLength && now - avgDocLengthCacheTime < AVG_DOC_LENGTH_CACHE_TTL_MS) {
      avgLen = cachedAvgDocLength;
    } else {
      const avgDocLength = await prisma.$queryRaw<[{ avg_length: number }]>(Prisma.sql`
        SELECT AVG(LENGTH(name || ' ' || COALESCE(description, '')))::numeric AS avg_length
        FROM "food_item_translations"
      `);
      avgLen = avgDocLength[0]?.avg_length ?? 50.0;
      cachedAvgDocLength = avgLen;
      avgDocLengthCacheTime = now;
    }

    const rows = await prisma.$queryRaw<SearchResultRow[]>(Prisma.sql`
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
    `);

    return rows;
  }

  /**
   * Mappa Prisma model a FoodItem type
   */
  private static mapToFoodItem(food: FoodItemWithRelations): FoodItem {
    // Gestisce sia array che singolo elemento per food_item_translations
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
      macrosPer100g: food.macrosPer100g as Macros,
      servingSize: food.servingSize ? Number(food.servingSize) : 0,
      unit: food.unit,
      imageUrl: food.imageUrl || undefined,
      brandId: food.brandId || undefined,
      mainMacro: (mainMacro || { type: 'BALANCED', percentage: 0 }) as {
        type: 'PROTEIN' | 'CARBS' | 'FATS' | 'BALANCED';
        percentage: number;
      },
      proteinPct: food.proteinPct ? Number(food.proteinPct) : 0,
      carbPct: food.carbPct ? Number(food.carbPct) : 0,
      fatPct: food.fatPct ? Number(food.fatPct) : 0,
      metadata: {
        ...((food.metadata as Record<string, unknown>) || {}),
        ...('brand' in food && food.brand ? { brand: food.brand.name } : {}),
        ...('categories' in food && Array.isArray(food.categories) && food.categories.length > 0
          ? {
              categories: food.categories
                .map((fc) => {
                  const category = (
                    fc as { food_categories: { id: string; name: string; slug: string } }
                  ).food_categories;
                  return category
                    ? { id: category.id, name: category.name, slug: category.slug }
                    : null;
                })
                .filter(
                  (
                    cat: { id: string; name: string; slug: string } | null
                  ): cat is { id: string; name: string; slug: string } => cat !== null
                ),
            }
          : {}),
      },
      createdAt: food.createdAt.toISOString(),
      updatedAt: food.updatedAt.toISOString(),
    };
  }
}

// Export singleton instance
export const foodService = FoodService;
