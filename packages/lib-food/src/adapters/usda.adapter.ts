import { logger } from '@giulio-leone/lib-shared';
import type { MacrosPer100g } from '../types';
import type {
  IExternalFoodSource,
  ExternalFoodItem,
  ExternalFoodSearchResult,
} from '../ports/external-food-source.port';

const REQUEST_TIMEOUT_MS = 8_000;
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// USDA nutrient IDs
const NUTRIENT_ID = {
  ENERGY: 1008,
  PROTEIN: 1003,
  CARBS: 1005,
  FAT: 1004,
  FIBER: 1079,
  SUGAR: 2000,
  SODIUM: 1093,
} as const;

interface USDAFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  unitName: string;
  value: number;
}

interface USDAFood {
  fdcId: number;
  description: string;
  dataType?: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: USDAFoodNutrient[];
}

interface USDASearchResponse {
  totalHits: number;
  foods: USDAFood[];
}

function extractNutrient(
  nutrients: USDAFoodNutrient[],
  nutrientId: number,
): number {
  return nutrients.find((n) => n.nutrientId === nutrientId)?.value ?? 0;
}

function mapNutrients(nutrients: USDAFoodNutrient[]): MacrosPer100g {
  return {
    calories: extractNutrient(nutrients, NUTRIENT_ID.ENERGY),
    protein: extractNutrient(nutrients, NUTRIENT_ID.PROTEIN),
    carbs: extractNutrient(nutrients, NUTRIENT_ID.CARBS),
    fats: extractNutrient(nutrients, NUTRIENT_ID.FAT),
    fiber: extractNutrient(nutrients, NUTRIENT_ID.FIBER) || undefined,
    sugar: extractNutrient(nutrients, NUTRIENT_ID.SUGAR) || undefined,
    sodium: extractNutrient(nutrients, NUTRIENT_ID.SODIUM) || undefined,
  };
}

function mapFood(food: USDAFood): ExternalFoodItem | null {
  if (!food.description) return null;

  const macros = mapNutrients(food.foodNutrients);
  if (
    macros.calories === 0 &&
    macros.protein === 0 &&
    macros.carbs === 0 &&
    macros.fats === 0
  ) {
    return null;
  }

  const brand = food.brandOwner || food.brandName || null;

  return {
    externalId: `usda:${food.fdcId}`,
    name: food.description,
    barcode: food.gtinUpc || null,
    macrosPer100g: macros,
    servingSize: food.servingSize ?? 100,
    unit: (food.servingSizeUnit ?? 'g').toLowerCase(),
    imageUrl: null,
    brand,
    source: 'usda',
    locale: 'en',
    rawData: food as unknown as Record<string, unknown>,
  };
}

export class USDAFoodAdapter implements IExternalFoodSource {
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.USDA_API_KEY || 'DEMO_KEY';
  }

  async search(
    query: string,
    options: { locale?: string; limit?: number } = {},
  ): Promise<ExternalFoodSearchResult> {
    const limit = options.limit ?? 10;
    const url = `${BASE_URL}/foods/search?api_key=${encodeURIComponent(this.apiKey)}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          pageSize: limit,
          dataType: ['Foundation', 'SR Legacy', 'Branded'],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        logger.warn(`[USDA] search HTTP ${res.status} for "${query}"`);
        return { items: [], total: 0, source: 'usda' };
      }

      const data = (await res.json()) as USDASearchResponse;
      const items = (data.foods ?? [])
        .map(mapFood)
        .filter((item): item is ExternalFoodItem => item !== null);

      return {
        items,
        total: data.totalHits ?? items.length,
        source: 'usda',
      };
    } catch (error) {
      logger.error('[USDA] search error', error);
      return { items: [], total: 0, source: 'usda' };
    }
  }

  async getByBarcode(barcode: string): Promise<ExternalFoodItem | null> {
    const url = `${BASE_URL}/foods/search?api_key=${encodeURIComponent(this.apiKey)}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: barcode,
          pageSize: 1,
          dataType: ['Branded'],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        logger.warn(`[USDA] barcode HTTP ${res.status} for "${barcode}"`);
        return null;
      }

      const data = (await res.json()) as USDASearchResponse;
      const food = data.foods?.[0];
      if (!food || food.gtinUpc !== barcode) return null;

      return mapFood(food);
    } catch (error) {
      logger.error('[USDA] barcode lookup error', error);
      return null;
    }
  }
}
