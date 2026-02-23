/**
 * Health React Query Hooks
 *
 * Custom hooks for health data with TanStack Query and Zustand integration
 */
import { type HealthSyncRequest } from '../queries/health.queries';
/**
 * Hook to get health summary
 *
 * Automatically syncs with Zustand store
 */
export declare function useHealthSummaryQuery(): import('@tanstack/react-query').UseQueryResult<
  import('@giulio-leone/lib-stores/health.store').HealthSummary,
  Error
>;
/**
 * Hook to sync health data
 *
 * Automatically updates Zustand store and invalidates summary cache
 */
export declare function useSyncHealthData(): import('@tanstack/react-query').UseMutationResult<
  import('..').HealthSyncResponse,
  Error,
  HealthSyncRequest,
  void
>;
/**
 * Hook to check if health sync is in progress
 */
export declare function useHealthSyncStatus(): import('@giulio-leone/lib-stores/health.store').SyncStatus;
//# sourceMappingURL=use-health.d.ts.map
