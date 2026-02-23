/**
 * Coach React Query Hooks
 *
 * Custom hooks for coach-related queries and mutations
 */
import {
  type CoachDashboardPlansFilters,
  type CoachClientsFilters,
  type MarketplacePlanCardProps,
} from '../queries/coach.queries';
export type { CoachDashboardPlansFilters, CoachClientsFilters, MarketplacePlanCardProps };
/**
 * Hook to get public coach profile
 *
 * @param userId - Coach user ID
 * @returns Query result with public coach profile data
 */
export declare function usePublicCoachProfile(
  userId: string | null
): import('@tanstack/react-query').UseQueryResult<import('..').PublicCoachProfileResponse, Error>;
/**
 * Hook to get coach dashboard stats
 *
 * @returns Query result with dashboard stats
 */
export declare function useCoachDashboardStats(): import('@tanstack/react-query').UseQueryResult<
  unknown,
  Error
>;
/**
 * Hook to get coach dashboard plans with filters
 *
 * @param filters - Filters for plans (planType, isPublished, page, limit)
 * @returns Query result with dashboard plans data
 */
export declare function useCoachDashboardPlans(
  filters?: CoachDashboardPlansFilters
): import('@tanstack/react-query').UseQueryResult<
  import('../queries/coach.queries').CoachDashboardPlansResponse,
  Error
>;
/**
 * Hook to get coach's clients
 *
 * @param filters - Filters for clients (search, sortBy, sortOrder)
 * @returns Query result with clients data
 */
export declare function useCoachClients(
  filters?: CoachClientsFilters
): import('@tanstack/react-query').UseQueryResult<
  import('../queries/coach.queries').CoachClientsResponse,
  Error
>;
//# sourceMappingURL=use-coach.d.ts.map
