import { logger } from '@giulio-leone/lib-shared';
import { OpenFoodFactsAdapter } from './adapters/openfoodfacts.adapter';
import { FoodSearchFacade } from './food-search-facade.service';
import type { ExternalFoodItem } from './ports/external-food-source.port';
import { FoodService } from './food.service';
import { normalizeFoodName } from './utils';

// ── Types ───────────────────────────────────────────────────────────

export interface SeedCategoryConfig {
  /** OpenFoodFacts search query */
  query: string;
  /** Human-readable category label */
  label: string;
  /** Max items to import per category */
  limit: number;
}

export interface SeedOptions {
  /** Country locale for OFF API (default: 'it') */
  locale?: string;
  /** Categories to seed. Uses ITALIAN_FOOD_CATEGORIES if not provided */
  categories?: SeedCategoryConfig[];
  /** Max items per category (default: 100) */
  perCategory?: number;
  /** Delay between API requests in ms (default: 500) */
  delayMs?: number;
  /** Progress callback */
  onProgress?: (progress: SeedProgress) => void;
}

export interface SeedProgress {
  phase: 'category' | 'importing' | 'done';
  category: string;
  categoryIndex: number;
  totalCategories: number;
  itemsImported: number;
  itemsSkipped: number;
  itemsFailed: number;
  totalProcessed: number;
}

export interface SeedResult {
  totalImported: number;
  totalSkipped: number;
  totalFailed: number;
  totalProcessed: number;
  categories: CategorySeedResult[];
  durationMs: number;
}

export interface CategorySeedResult {
  category: string;
  query: string;
  fetched: number;
  imported: number;
  skipped: number;
  failed: number;
}

// ── Italian Food Categories ─────────────────────────────────────────

export const ITALIAN_FOOD_CATEGORIES: SeedCategoryConfig[] = [
  // Proteins
  { query: 'petto di pollo', label: 'Pollo', limit: 50 },
  { query: 'carne bovina', label: 'Manzo', limit: 50 },
  { query: 'tonno', label: 'Tonno', limit: 40 },
  { query: 'salmone', label: 'Salmone', limit: 30 },
  { query: 'uova', label: 'Uova', limit: 30 },
  { query: 'prosciutto', label: 'Prosciutto', limit: 40 },
  { query: 'bresaola', label: 'Bresaola', limit: 20 },
  { query: 'mozzarella', label: 'Mozzarella', limit: 30 },
  { query: 'parmigiano reggiano', label: 'Parmigiano', limit: 20 },
  { query: 'yogurt greco', label: 'Yogurt Greco', limit: 30 },
  { query: 'ricotta', label: 'Ricotta', limit: 20 },
  // Carbs
  { query: 'pasta', label: 'Pasta', limit: 80 },
  { query: 'riso', label: 'Riso', limit: 40 },
  { query: 'pane', label: 'Pane', limit: 50 },
  { query: 'fette biscottate', label: 'Fette Biscottate', limit: 20 },
  { query: 'cereali', label: 'Cereali', limit: 40 },
  { query: 'avena', label: 'Avena', limit: 30 },
  { query: 'patate', label: 'Patate', limit: 30 },
  // Fruits & Vegetables
  { query: 'mela', label: 'Mele', limit: 30 },
  { query: 'banana', label: 'Banane', limit: 20 },
  { query: 'arancia', label: 'Arance', limit: 20 },
  { query: 'pomodoro', label: 'Pomodori', limit: 30 },
  { query: 'insalata', label: 'Insalata', limit: 30 },
  { query: 'zucchine', label: 'Zucchine', limit: 20 },
  { query: 'broccoli', label: 'Broccoli', limit: 20 },
  { query: 'spinaci', label: 'Spinaci', limit: 20 },
  { query: 'carote', label: 'Carote', limit: 20 },
  // Fats & Oils
  { query: 'olio extravergine oliva', label: 'Olio EVO', limit: 30 },
  { query: 'burro', label: 'Burro', limit: 20 },
  { query: 'frutta secca', label: 'Frutta Secca', limit: 40 },
  { query: 'mandorle', label: 'Mandorle', limit: 20 },
  { query: 'noci', label: 'Noci', limit: 20 },
  { query: 'avocado', label: 'Avocado', limit: 20 },
  // Dairy
  { query: 'latte', label: 'Latte', limit: 40 },
  { query: 'formaggio', label: 'Formaggio', limit: 50 },
  { query: 'yogurt', label: 'Yogurt', limit: 40 },
  // Beverages
  { query: 'succo di frutta', label: 'Succhi', limit: 30 },
  // Snacks & Sweets (for tracking)
  { query: 'cioccolato', label: 'Cioccolato', limit: 30 },
  { query: 'biscotti', label: 'Biscotti', limit: 40 },
  { query: 'barrette proteiche', label: 'Barrette Proteiche', limit: 30 },
  // Prepared foods
  { query: 'pizza', label: 'Pizza', limit: 30 },
  { query: 'gelato', label: 'Gelato', limit: 30 },
  // Popular brands
  { query: 'barilla', label: 'Barilla', limit: 40 },
  { query: 'mulino bianco', label: 'Mulino Bianco', limit: 30 },
];

// ── Service ─────────────────────────────────────────────────────────

export class FoodSeedService {
  private adapter: OpenFoodFactsAdapter;

  constructor() {
    this.adapter = new OpenFoodFactsAdapter();
  }

  /**
   * Seed the local food database from OpenFoodFacts.
   * Fetches foods by category, deduplicates by barcode/name, imports via FoodSearchFacade.
   */
  async seed(options: SeedOptions = {}): Promise<SeedResult> {
    const startTime = Date.now();
    const locale = options.locale ?? 'it';
    const categories = options.categories ?? ITALIAN_FOOD_CATEGORIES;
    const perCategory = options.perCategory ?? 100;
    const delayMs = options.delayMs ?? 500;

    const results: CategorySeedResult[] = [];
    let totalImported = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let totalProcessed = 0;

    // Track globally seen barcodes/names to avoid cross-category duplicates
    const globalSeenBarcodes = new Set<string>();
    const globalSeenNames = new Set<string>();

    // Pre-load existing barcodes from local DB for fast dedup
    await this.loadExistingIdentifiers(globalSeenBarcodes, globalSeenNames);

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i]!;
      const limit = Math.min(cat.limit, perCategory);

      options.onProgress?.({
        phase: 'category',
        category: cat.label,
        categoryIndex: i,
        totalCategories: categories.length,
        itemsImported: totalImported,
        itemsSkipped: totalSkipped,
        itemsFailed: totalFailed,
        totalProcessed,
      });

      logger.info(`[FoodSeed] Fetching category "${cat.label}" (${cat.query}), limit=${limit}`);

      let items: ExternalFoodItem[] = [];
      try {
        const result = await this.adapter.search(cat.query, { locale, limit });
        items = result.items;
      } catch (err) {
        logger.error(`[FoodSeed] Failed to fetch category "${cat.label}"`, err);
        results.push({
          category: cat.label,
          query: cat.query,
          fetched: 0,
          imported: 0,
          skipped: 0,
          failed: 1,
        });
        totalFailed++;
        continue;
      }

      let catImported = 0;
      let catSkipped = 0;
      let catFailed = 0;

      for (const item of items) {
        // Dedup: skip if barcode or normalized name already seen
        const normName = normalizeFoodName(item.name);
        if (item.barcode && globalSeenBarcodes.has(item.barcode)) {
          catSkipped++;
          totalSkipped++;
          totalProcessed++;
          continue;
        }
        if (globalSeenNames.has(normName)) {
          catSkipped++;
          totalSkipped++;
          totalProcessed++;
          continue;
        }

        try {
          await FoodSearchFacade.importExternalFood(item);
          if (item.barcode) globalSeenBarcodes.add(item.barcode);
          globalSeenNames.add(normName);
          catImported++;
          totalImported++;
        } catch (err) {
          logger.warn(`[FoodSeed] Failed to import "${item.name}"`, err);
          catFailed++;
          totalFailed++;
        }
        totalProcessed++;
      }

      results.push({
        category: cat.label,
        query: cat.query,
        fetched: items.length,
        imported: catImported,
        skipped: catSkipped,
        failed: catFailed,
      });

      options.onProgress?.({
        phase: 'importing',
        category: cat.label,
        categoryIndex: i,
        totalCategories: categories.length,
        itemsImported: totalImported,
        itemsSkipped: totalSkipped,
        itemsFailed: totalFailed,
        totalProcessed,
      });

      // Rate-limit API requests
      if (i < categories.length - 1 && delayMs > 0) {
        await delay(delayMs);
      }
    }

    const durationMs = Date.now() - startTime;

    options.onProgress?.({
      phase: 'done',
      category: '',
      categoryIndex: categories.length,
      totalCategories: categories.length,
      itemsImported: totalImported,
      itemsSkipped: totalSkipped,
      itemsFailed: totalFailed,
      totalProcessed,
    });

    logger.info(
      `[FoodSeed] Complete: ${totalImported} imported, ${totalSkipped} skipped, ${totalFailed} failed (${durationMs}ms)`,
    );

    return {
      totalImported,
      totalSkipped,
      totalFailed,
      totalProcessed,
      categories: results,
      durationMs,
    };
  }

  /**
   * Pre-load existing barcodes and normalized names from local DB
   * to skip items that already exist without per-item DB queries.
   */
  private async loadExistingIdentifiers(
    barcodes: Set<string>,
    names: Set<string>,
  ): Promise<void> {
    try {
      const foods = await FoodService.list({ limit: 50000, pageSize: 50000 });
      for (const food of foods.data) {
        if (food.barcode) barcodes.add(food.barcode);
        names.add(food.nameNormalized);
      }
      logger.info(`[FoodSeed] Pre-loaded ${barcodes.size} barcodes, ${names.size} names from local DB`);
    } catch (err) {
      logger.warn('[FoodSeed] Could not pre-load existing identifiers', err);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
