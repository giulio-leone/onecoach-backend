/**
 * useFetch Hook
 *
 * Generic hook for data fetching when React Query hooks don't exist
 * Follows KISS, SOLID, DRY principles
 *
 * Use this only when:
 * - No React Query hook exists for the endpoint
 * - You need a one-off fetch that doesn't need caching
 * - You're migrating from manual fetch and will create a proper hook later
 */
export interface UseFetchOptions<T> {
  url: string | null;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  transform?: (data: unknown) => T;
}
export interface UseFetchReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
/**
 * Generic fetch hook
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useFetch<User>({
 *   url: '/api/user/123',
 *   enabled: !!userId,
 * });
 * ```
 */
export declare function useFetch<T = unknown>(options: UseFetchOptions<T>): UseFetchReturn<T>;
//# sourceMappingURL=use-fetch.d.ts.map
