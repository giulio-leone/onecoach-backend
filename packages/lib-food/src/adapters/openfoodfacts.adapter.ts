import { logger } from '@giulio-leone/lib-shared';
import type { MacrosPer100g } from '../types';
import type {
  IExternalFoodSource,
  ExternalFoodItem,
  ExternalFoodSearchResult,
} from '../ports/external-food-source.port';

const USER_AGENT = 'OneCoach/1.0 (https://onecoach.app)';
const REQUEST_TIMEOUT_MS = 8_000;

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  sodium_100g?: number;
}

interface OFFProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  image_front_url?: string;
  image_url?: string;
  nutriments?: OFFNutriments;
}

interface OFFSearchResponse {
  count?: number;
  products?: OFFProduct[];
}

interface OFFProductResponse {
  status?: number;
  product?: OFFProduct;
}

function parseServingSize(raw?: string): number {
  if (!raw) return 100;
  const match = raw.match(/([\d.,]+)\s*g/i);
  if (match?.[1]) {
    const parsed = parseFloat(match[1].replace(',', '.'));
    return parsed > 0 ? parsed : 100;
  }
  return 100;
}

function mapNutriments(n?: OFFNutriments): MacrosPer100g {
  return {
    calories: n?.['energy-kcal_100g'] ?? 0,
    protein: n?.proteins_100g ?? 0,
    carbs: n?.carbohydrates_100g ?? 0,
    fats: n?.fat_100g ?? 0,
    fiber: n?.fiber_100g,
    sugar: n?.sugars_100g,
    sodium: n?.sodium_100g,
  };
}

function mapProduct(product: OFFProduct, locale: string): ExternalFoodItem | null {
  if (!product.product_name) return null;
  const fallbackExternalId = `name:${product.product_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

  const macros = mapNutriments(product.nutriments);
  // Skip products with zero macros across the board
  if (macros.calories === 0 && macros.protein === 0 && macros.carbs === 0 && macros.fats === 0) {
    return null;
  }

  return {
    externalId: product.code ?? fallbackExternalId,
    name: product.product_name,
    barcode: product.code || null,
    macrosPer100g: macros,
    servingSize: parseServingSize(product.serving_size),
    unit: 'g',
    imageUrl: product.image_front_url || product.image_url || null,
    brand: product.brands || null,
    source: 'openfoodfacts',
    locale,
    rawData: product as unknown as Record<string, unknown>,
  };
}

export class OpenFoodFactsAdapter implements IExternalFoodSource {
  async search(
    query: string,
    options: { locale?: string; limit?: number } = {},
  ): Promise<ExternalFoodSearchResult> {
    const locale = (options.locale ?? 'it').split('-')[0]?.toLowerCase() || 'it';
    const limit = options.limit ?? 10;
    const baseUrl = `https://${locale}.openfoodfacts.org`;
    const url = `${baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        logger.warn(`[OpenFoodFacts] search HTTP ${res.status} for "${query}"`);
        return { items: [], total: 0, source: 'openfoodfacts' };
      }

      const data = (await res.json()) as OFFSearchResponse;
      const items = (data.products ?? [])
        .map((p) => mapProduct(p, locale))
        .filter((item): item is ExternalFoodItem => item !== null);

      return {
        items,
        total: data.count ?? items.length,
        source: 'openfoodfacts',
      };
    } catch (error) {
      logger.error('[OpenFoodFacts] search error', error);
      return { items: [], total: 0, source: 'openfoodfacts' };
    }
  }

  async getByBarcode(barcode: string): Promise<ExternalFoodItem | null> {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        logger.warn(`[OpenFoodFacts] barcode HTTP ${res.status} for "${barcode}"`);
        return null;
      }

      const data = (await res.json()) as OFFProductResponse;
      if (data.status !== 1 || !data.product) return null;

      return mapProduct(data.product, 'world');
    } catch (error) {
      logger.error('[OpenFoodFacts] barcode lookup error', error);
      return null;
    }
  }
}
