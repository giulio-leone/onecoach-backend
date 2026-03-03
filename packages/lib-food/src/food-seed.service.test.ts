import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FoodSeedService, ITALIAN_FOOD_CATEGORIES } from './food-seed.service';
import type { SeedCategoryConfig, SeedProgress } from './food-seed.service';
import type { ExternalFoodItem } from './ports/external-food-source.port';

// ── Mocks ───────────────────────────────────────────────────────────

vi.mock('@giulio-leone/lib-shared', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockExternalItem = (name: string, barcode?: string): ExternalFoodItem => ({
  externalId: `off-${name.replace(/\s+/g, '-')}`,
  name,
  barcode: barcode ?? null,
  macrosPer100g: { calories: 100, protein: 10, carbs: 20, fats: 5 },
  servingSize: 100,
  unit: 'g',
  imageUrl: null,
  brand: 'TestBrand',
  source: 'openfoodfacts',
  locale: 'it',
});

const mockSearchFn = vi.fn();
const mockImportFn = vi.fn();
const mockListFn = vi.fn();

vi.mock('./adapters/openfoodfacts.adapter', () => {
  return {
    OpenFoodFactsAdapter: class {
      search = mockSearchFn;
    },
  };
});

vi.mock('./food-search-facade.service', () => ({
  FoodSearchFacade: {
    importExternalFood: (...args: unknown[]) => mockImportFn(...args),
  },
}));

vi.mock('./food.service', () => ({
  FoodService: {
    list: (...args: unknown[]) => mockListFn(...args),
  },
}));

vi.mock('./utils', () => ({
  normalizeFoodName: (name: string) => name.toLowerCase().trim(),
}));

// ── Tests ───────────────────────────────────────────────────────────

describe('FoodSeedService', () => {
  let service: FoodSeedService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FoodSeedService();

    // Default: empty local DB
    mockListFn.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 50000 });
    // Default: import succeeds and returns a food item
    mockImportFn.mockResolvedValue({ id: 'test-id', name: 'Test' });
  });

  it('exports ITALIAN_FOOD_CATEGORIES with reasonable count', () => {
    expect(ITALIAN_FOOD_CATEGORIES.length).toBeGreaterThan(20);
    for (const cat of ITALIAN_FOOD_CATEGORIES) {
      expect(cat.query).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.limit).toBeGreaterThan(0);
    }
  });

  it('seeds from a single category successfully', async () => {
    const items = [
      mockExternalItem('Pasta Barilla', '8076809513432'),
      mockExternalItem('Pasta De Cecco', '8001250120014'),
    ];

    mockSearchFn.mockResolvedValue({ items, total: 2, source: 'openfoodfacts' });

    const categories: SeedCategoryConfig[] = [
      { query: 'pasta', label: 'Pasta', limit: 10 },
    ];

    const result = await service.seed({ categories, delayMs: 0 });

    expect(result.totalImported).toBe(2);
    expect(result.totalSkipped).toBe(0);
    expect(result.totalFailed).toBe(0);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]!.category).toBe('Pasta');
    expect(result.categories[0]!.imported).toBe(2);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(mockImportFn).toHaveBeenCalledTimes(2);
  });

  it('deduplicates by barcode across categories', async () => {
    const shared = mockExternalItem('Duplicated Item', '1234567890');
    const unique = mockExternalItem('Unique Item', '9876543210');

    mockSearchFn
      .mockResolvedValueOnce({ items: [shared], total: 1, source: 'openfoodfacts' })
      .mockResolvedValueOnce({ items: [shared, unique], total: 2, source: 'openfoodfacts' });

    const categories: SeedCategoryConfig[] = [
      { query: 'cat1', label: 'Cat 1', limit: 10 },
      { query: 'cat2', label: 'Cat 2', limit: 10 },
    ];

    const result = await service.seed({ categories, delayMs: 0 });

    // First category: 1 imported (shared)
    // Second category: 1 skipped (shared duplicate), 1 imported (unique)
    expect(result.totalImported).toBe(2);
    expect(result.totalSkipped).toBe(1);
  });

  it('deduplicates by normalized name', async () => {
    const item1 = mockExternalItem('Pasta Integrale');
    const item2 = mockExternalItem('pasta integrale'); // Same name, different case

    mockSearchFn.mockResolvedValue({
      items: [item1, item2],
      total: 2,
      source: 'openfoodfacts',
    });

    const result = await service.seed({
      categories: [{ query: 'pasta', label: 'Pasta', limit: 10 }],
      delayMs: 0,
    });

    expect(result.totalImported).toBe(1);
    expect(result.totalSkipped).toBe(1);
  });

  it('skips items already in local DB', async () => {
    // Pre-populate with one existing food
    mockListFn.mockResolvedValue({
      data: [
        { barcode: '1111111111', nameNormalized: 'existing food' },
      ],
      total: 1,
      page: 1,
      pageSize: 50000,
    });

    const items = [
      mockExternalItem('Existing Food', '1111111111'), // matches barcode
      mockExternalItem('New Food', '2222222222'),
    ];

    mockSearchFn.mockResolvedValue({ items, total: 2, source: 'openfoodfacts' });

    const result = await service.seed({
      categories: [{ query: 'test', label: 'Test', limit: 10 }],
      delayMs: 0,
    });

    expect(result.totalImported).toBe(1);
    expect(result.totalSkipped).toBe(1);
  });

  it('handles API fetch failure gracefully', async () => {
    mockSearchFn.mockRejectedValue(new Error('Network error'));

    const result = await service.seed({
      categories: [{ query: 'test', label: 'Test', limit: 10 }],
      delayMs: 0,
    });

    expect(result.totalFailed).toBe(1);
    expect(result.totalImported).toBe(0);
    expect(result.categories[0]!.failed).toBe(1);
  });

  it('handles individual import failure gracefully', async () => {
    const items = [
      mockExternalItem('Good Item', '111'),
      mockExternalItem('Bad Item', '222'),
    ];

    mockSearchFn.mockResolvedValue({ items, total: 2, source: 'openfoodfacts' });
    mockImportFn
      .mockResolvedValueOnce({ id: '1', name: 'Good Item' })
      .mockRejectedValueOnce(new Error('DB constraint violation'));

    const result = await service.seed({
      categories: [{ query: 'test', label: 'Test', limit: 10 }],
      delayMs: 0,
    });

    expect(result.totalImported).toBe(1);
    expect(result.totalFailed).toBe(1);
  });

  it('reports progress via onProgress callback', async () => {
    const items = [mockExternalItem('Item 1', '111')];
    mockSearchFn.mockResolvedValue({ items, total: 1, source: 'openfoodfacts' });

    const progressUpdates: SeedProgress[] = [];

    await service.seed({
      categories: [{ query: 'test', label: 'Test', limit: 10 }],
      delayMs: 0,
      onProgress: (p) => progressUpdates.push({ ...p }),
    });

    expect(progressUpdates.length).toBeGreaterThanOrEqual(2);
    // First progress: phase 'category'
    expect(progressUpdates[0]!.phase).toBe('category');
    // Last progress: phase 'done'
    expect(progressUpdates[progressUpdates.length - 1]!.phase).toBe('done');
  });

  it('passes locale to OFF adapter', async () => {
    mockSearchFn.mockResolvedValue({ items: [], total: 0, source: 'openfoodfacts' });

    await service.seed({
      categories: [{ query: 'test', label: 'Test', limit: 10 }],
      locale: 'fr',
      delayMs: 0,
    });

    expect(mockSearchFn).toHaveBeenCalledWith('test', { locale: 'fr', limit: 10 });
  });

  it('respects perCategory limit', async () => {
    mockSearchFn.mockResolvedValue({ items: [], total: 0, source: 'openfoodfacts' });

    await service.seed({
      categories: [{ query: 'test', label: 'Test', limit: 200 }],
      perCategory: 50,
      delayMs: 0,
    });

    expect(mockSearchFn).toHaveBeenCalledWith('test', { locale: 'it', limit: 50 });
  });

  it('returns correct result structure for multiple categories', async () => {
    mockSearchFn
      .mockResolvedValueOnce({
        items: [mockExternalItem('A', '1')],
        total: 1,
        source: 'openfoodfacts',
      })
      .mockResolvedValueOnce({
        items: [mockExternalItem('B', '2'), mockExternalItem('C', '3')],
        total: 2,
        source: 'openfoodfacts',
      });

    const result = await service.seed({
      categories: [
        { query: 'cat1', label: 'Cat 1', limit: 10 },
        { query: 'cat2', label: 'Cat 2', limit: 10 },
      ],
      delayMs: 0,
    });

    expect(result.categories).toHaveLength(2);
    expect(result.categories[0]!.imported).toBe(1);
    expect(result.categories[1]!.imported).toBe(2);
    expect(result.totalImported).toBe(3);
    expect(result.totalProcessed).toBe(3);
  });
});
