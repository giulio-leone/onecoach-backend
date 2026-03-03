import type { ExternalFoodItem } from '../ports/external-food-source.port';

// ── Port ────────────────────────────────────────────────────────────

export interface IFoodCacheRepository {
  get(source: string, queryType: string, queryKey: string): Promise<ExternalFoodItem[] | null>;
  set(source: string, queryType: string, queryKey: string, items: ExternalFoodItem[], ttlMs: number): Promise<void>;
  invalidateExpired(): Promise<number>;
}

// ── In-memory fallback ──────────────────────────────────────────────

interface CacheEntry {
  items: ExternalFoodItem[];
  expiresAt: number;
}

export class InMemoryFoodCache implements IFoodCacheRepository {
  private cache = new Map<string, CacheEntry>();

  private key(source: string, queryType: string, queryKey: string): string {
    return `${source}:${queryType}:${queryKey.toLowerCase().trim()}`;
  }

  async get(source: string, queryType: string, queryKey: string): Promise<ExternalFoodItem[] | null> {
    const entry = this.cache.get(this.key(source, queryType, queryKey));
    if (!entry || entry.expiresAt < Date.now()) {
      if (entry) this.cache.delete(this.key(source, queryType, queryKey));
      return null;
    }
    return entry.items;
  }

  async set(source: string, queryType: string, queryKey: string, items: ExternalFoodItem[], ttlMs: number): Promise<void> {
    this.cache.set(this.key(source, queryType, queryKey), {
      items,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async invalidateExpired(): Promise<number> {
    let count = 0;
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  get size(): number {
    return this.cache.size;
  }
}

// ── Caching wrapper for external food sources ───────────────────────

export class CachedFoodSource {
  constructor(
    private readonly cache: IFoodCacheRepository,
    private readonly source: string,
    private readonly ttlMs: number = 24 * 60 * 60 * 1000, // 24h default
  ) {}

  async getCachedSearch(query: string): Promise<ExternalFoodItem[] | null> {
    return this.cache.get(this.source, 'search', query);
  }

  async cacheSearch(query: string, items: ExternalFoodItem[]): Promise<void> {
    await this.cache.set(this.source, 'search', query, items, this.ttlMs);
  }

  async getCachedBarcode(barcode: string): Promise<ExternalFoodItem[] | null> {
    return this.cache.get(this.source, 'barcode', barcode);
  }

  async cacheBarcode(barcode: string, items: ExternalFoodItem[]): Promise<void> {
    await this.cache.set(this.source, 'barcode', barcode, items, this.ttlMs);
  }
}
