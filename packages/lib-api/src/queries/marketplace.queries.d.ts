/**
 * Marketplace Query Keys and Functions
 *
 * Standardized query keys and query functions for marketplace queries
 */
import type { MarketplacePlan } from '../marketplace';
/**
 * Query keys for marketplace queries
 */
export declare const marketplaceKeys: {
  readonly all: readonly ['marketplace'];
  readonly plans: {
    readonly all: readonly ['marketplace', 'plans'];
    readonly lists: () => readonly ['marketplace', 'plans', 'list'];
    readonly list: (
      filters?: MarketplaceFilters
    ) => readonly ['marketplace', 'plans', 'list', MarketplaceFilters | undefined];
    readonly details: () => readonly ['marketplace', 'plans', 'detail'];
    readonly detail: (id: string) => readonly ['marketplace', 'plans', 'detail', string];
  };
};
/**
 * Filters for marketplace plans list
 */
export interface MarketplaceFilters {
  planType?: 'WORKOUT' | 'NUTRITION';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  coachId?: string;
  searchQuery?: string;
  sortBy?: 'rating' | 'price' | 'recent' | 'popular';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
/**
 * Response type for marketplace plans list
 */
export interface MarketplacePlansResponse {
  plans: MarketplacePlan[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
/**
 * Response type for marketplace plan detail
 */
export interface MarketplacePlanResponse {
  plan: MarketplacePlan;
}
/**
 * Query functions for marketplace
 */
export declare const marketplaceQueries: {
  /**
   * Get marketplace plans list
   */
  list: (filters?: MarketplaceFilters) => Promise<MarketplacePlansResponse>;
  /**
   * Get marketplace plan by ID
   */
  getById: (id: string) => Promise<MarketplacePlanResponse>;
};
//# sourceMappingURL=marketplace.queries.d.ts.map
