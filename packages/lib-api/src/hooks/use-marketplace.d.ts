/**
 * Marketplace React Query Hooks
 *
 * Custom hooks for marketplace-related queries and mutations
 */
import { type MarketplaceFilters } from '../queries/marketplace.queries';
/**
 * Hook to get marketplace plans with filters
 */
export declare function useMarketplacePlans(
  filters?: MarketplaceFilters
): import('@tanstack/react-query').UseQueryResult<
  import('../queries/marketplace.queries').MarketplacePlansResponse,
  Error
>;
/**
 * Hook to get marketplace plans with infinite scroll
 */
export declare function useMarketplacePlansInfinite(
  filters?: MarketplaceFilters
): import('@tanstack/react-query').UseInfiniteQueryResult<
  import('@tanstack/react-query').InfiniteData<
    import('../queries/marketplace.queries').MarketplacePlansResponse,
    unknown
  >,
  Error
>;
/**
 * Hook to get a marketplace plan by ID
 */
export declare function useMarketplacePlan(
  id: string | null | undefined
): import('@tanstack/react-query').UseQueryResult<
  import('../queries/marketplace.queries').MarketplacePlanResponse,
  Error
>;
//# sourceMappingURL=use-marketplace.d.ts.map
