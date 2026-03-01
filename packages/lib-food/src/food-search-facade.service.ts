import { logger } from '@giulio-leone/lib-shared';
import { FoodService } from './food.service';
import type { FoodItem } from './types';
import type {
  IExternalFoodSource,
  ExternalFoodItem,
} from './ports/external-food-source.port';

export interface FoodSearchResultItem extends FoodItem {
  source: 'local' | 'openfoodfacts';
}

export interface FoodSearchResult {
  items: FoodSearchResultItem[];
  total: number;
}

/** Minimum local results before querying external sources */
const LOCAL_THRESHOLD = 3;

function mapExternalToFoodItem(item: ExternalFoodItem): FoodSearchResultItem {
  const macros = item.macrosPer100g;
  const totalKcal = Math.max(1, macros.calories || 0);
  const proteinPct = Math.min(100, Math.max(0, (macros.protein || 0) * 4 * 100 / totalKcal));
  const carbPct = Math.min(100, Math.max(0, (macros.carbs || 0) * 4 * 100 / totalKcal));
  const fatPct = Math.min(100, Math.max(0, (macros.fats || 0) * 9 * 100 / totalKcal));

  let mainType: 'PROTEIN' | 'CARBS' | 'FATS' | 'BALANCED';
  let mainPct: number;
  if (proteinPct >= carbPct && proteinPct >= fatPct) {
    mainType = 'PROTEIN';
    mainPct = proteinPct;
  } else if (carbPct >= proteinPct && carbPct >= fatPct) {
    mainType = 'CARBS';
    mainPct = carbPct;
  } else {
    mainType = 'FATS';
    mainPct = fatPct;
  }
  if (mainPct < 40) {
    mainType = 'BALANCED';
  }

  return {
    id: `off:${item.externalId}`,
    name: item.name,
    nameNormalized: item.name.toLowerCase().trim(),
    barcode: item.barcode ?? undefined,
    macrosPer100g: item.macrosPer100g,
    servingSize: item.servingSize,
    unit: item.unit,
    imageUrl: item.imageUrl ?? undefined,
    mainMacro: { type: mainType, percentage: Math.round(mainPct * 10) / 10 },
    proteinPct: Math.round(proteinPct * 10) / 10,
    carbPct: Math.round(carbPct * 10) / 10,
    fatPct: Math.round(fatPct * 10) / 10,
    metadata: {
      source: item.source,
      externalId: item.externalId,
      ...(item.brand ? { brand: item.brand } : {}),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'openfoodfacts',
  };
}

export class FoodSearchFacade {
  private static externalSource: IExternalFoodSource | null = null;

  static setExternalSource(source: IExternalFoodSource) {
    this.externalSource = source;
  }

  static async search(
    query: string,
    options: { locale?: string; limit?: number } = {},
  ): Promise<FoodSearchResult> {
    const limit = options.limit ?? 10;

    // 1. Search local DB first
    const localResults = await FoodService.searchFoods(query, {
      locale: options.locale,
      limit,
    });

    // 2. If local results are sufficient or no external source, return them
    if (localResults.length >= LOCAL_THRESHOLD || !this.externalSource) {
      return {
        items: localResults.map((item) => ({ ...item, source: 'local' as const })),
        total: localResults.length,
      };
    }

    // 3. Supplement with external results
    const remaining = limit - localResults.length;
    let externalResults;
    try {
      externalResults = await this.externalSource.search(query, {
        locale: options.locale,
        limit: remaining,
      });
    } catch (error) {
      logger.error('[FoodSearchFacade] external search error', error);
      return {
        items: localResults.map((item) => ({ ...item, source: 'local' as const })),
        total: localResults.length,
      };
    }

    // 4. Deduplicate by barcode
    const localBarcodes = new Set(
      localResults
        .map((r) => r.barcode)
        .filter((barcode): barcode is string => typeof barcode === 'string' && barcode.length > 0),
    );
    const uniqueExternal = externalResults.items.filter(
      (item) => !item.barcode || !localBarcodes.has(item.barcode),
    );

    // 5. Map and merge
    const mergedExternalItems = uniqueExternal.map(mapExternalToFoodItem);

    return {
      items: [
        ...localResults.map((item) => ({ ...item, source: 'local' as const })),
        ...mergedExternalItems,
      ],
      total: localResults.length + mergedExternalItems.length,
    };
  }

  /**
   * Import an external food item into the local DB (stealth import).
   * Returns the existing item if already present by barcode.
   */
  static async importExternalFood(externalItem: ExternalFoodItem): Promise<FoodItem> {
    // Check if already exists by barcode
    if (externalItem.barcode) {
      const existing = await FoodService.findByBarcode(externalItem.barcode);
      if (existing) return existing;
    }

    return FoodService.createFood({
      name: externalItem.name,
      description: externalItem.name, // Use name as description fallback
      barcode: externalItem.barcode ?? undefined,
      macrosPer100g: externalItem.macrosPer100g,
      servingSize: externalItem.servingSize,
      unit: externalItem.unit,
      imageUrl: externalItem.imageUrl ?? undefined,
      brandName: externalItem.brand ?? undefined,
      metadata: {
        source: externalItem.source,
        externalId: externalItem.externalId,
        importedAt: new Date().toISOString(),
      },
    });
  }
}
