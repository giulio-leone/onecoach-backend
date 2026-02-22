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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { handleApiError } from '@giulio-leone/lib-shared';

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
export function useFetch<T = unknown>(options: UseFetchOptions<T>): UseFetchReturn<T> {
  const { url, enabled = true, onSuccess, onError, transform } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !url) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        const apiError = await handleApiError(response);
        throw apiError;
      }

      const jsonData = await response.json();
      const transformedData = transform ? transform(jsonData) : (jsonData as T);

      setData(transformedData);
      onSuccess?.(transformedData);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [url, enabled, transform, onSuccess, onError]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
