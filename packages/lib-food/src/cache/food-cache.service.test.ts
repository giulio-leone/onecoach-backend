import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryFoodCache, CachedFoodSource } from './food-cache.service';
import type { ExternalFoodItem } from '../ports/external-food-source.port';

const mockItem: ExternalFoodItem = {
  externalId: 'ext-1',
  name: 'Chicken Breast',
  macrosPer100g: { protein: 31, carbs: 0, fat: 3.6, calories: 165 },
  source: 'usda',
};

describe('InMemoryFoodCache', () => {
  let cache: InMemoryFoodCache;

  beforeEach(() => {
    cache = new InMemoryFoodCache();
  });

  it('returns null for missing key', async () => {
    const result = await cache.get('usda', 'search', 'chicken');
    expect(result).toBeNull();
  });

  it('stores and retrieves items', async () => {
    await cache.set('usda', 'search', 'chicken', [mockItem], 60000);
    const result = await cache.get('usda', 'search', 'chicken');
    expect(result).toHaveLength(1);
    expect(result![0]!.name).toBe('Chicken Breast');
  });

  it('normalizes keys to lowercase', async () => {
    await cache.set('usda', 'search', 'CHICKEN', [mockItem], 60000);
    const result = await cache.get('usda', 'search', 'chicken');
    expect(result).toHaveLength(1);
  });

  it('returns null for expired entries', async () => {
    await cache.set('usda', 'search', 'chicken', [mockItem], 1); // 1ms TTL
    await new Promise((r) => setTimeout(r, 5));
    const result = await cache.get('usda', 'search', 'chicken');
    expect(result).toBeNull();
  });

  it('invalidates expired entries', async () => {
    await cache.set('usda', 'search', 'chicken', [mockItem], 1);
    await cache.set('usda', 'search', 'rice', [mockItem], 60000);
    await new Promise((r) => setTimeout(r, 5));
    const removed = await cache.invalidateExpired();
    expect(removed).toBe(1);
    expect(cache.size).toBe(1);
  });

  it('tracks cache size', async () => {
    expect(cache.size).toBe(0);
    await cache.set('usda', 'search', 'chicken', [mockItem], 60000);
    expect(cache.size).toBe(1);
    await cache.set('off', 'barcode', '123', [mockItem], 60000);
    expect(cache.size).toBe(2);
  });
});

describe('CachedFoodSource', () => {
  let cache: InMemoryFoodCache;
  let cached: CachedFoodSource;

  beforeEach(() => {
    cache = new InMemoryFoodCache();
    cached = new CachedFoodSource(cache, 'usda', 60000);
  });

  it('caches search results', async () => {
    await cached.cacheSearch('chicken', [mockItem]);
    const result = await cached.getCachedSearch('chicken');
    expect(result).toHaveLength(1);
  });

  it('returns null for uncached search', async () => {
    const result = await cached.getCachedSearch('unknown');
    expect(result).toBeNull();
  });

  it('caches barcode results', async () => {
    await cached.cacheBarcode('123456', [mockItem]);
    const result = await cached.getCachedBarcode('123456');
    expect(result).toHaveLength(1);
  });
});
