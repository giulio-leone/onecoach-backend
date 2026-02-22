/**
 * Health React Query Hooks
 *
 * Custom hooks for health data with TanStack Query and Zustand integration
 */

'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthKeys, healthQueries, type HealthSyncRequest } from '../queries/health.queries';
import { useHealthStore } from '@giulio-leone/lib-stores/health.store';
import { getErrorMessage } from '@giulio-leone/lib-shared';

/**
 * Hook to get health summary
 *
 * Automatically syncs with Zustand store
 */
export function useHealthSummaryQuery() {
  const setHealthSummary = useHealthStore((state) => state.setHealthSummary);

  const query = useQuery({
    queryKey: healthKeys.summary(),
    queryFn: healthQueries.getSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  useEffect(() => {
    if (query.data) {
      setHealthSummary(query.data);
    } else if (query.error) {
      setHealthSummary(null);
    }
  }, [query.data, query.error, setHealthSummary]);

  return query;
}

/**
 * Hook to sync health data
 *
 * Automatically updates Zustand store and invalidates summary cache
 */
export function useSyncHealthData() {
  const queryClient = useQueryClient();
  const setSyncStatus = useHealthStore((state) => state.setSyncStatus);

  return useMutation({
    mutationFn: (request: HealthSyncRequest) => healthQueries.syncData(request),
    onMutate: () => {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: true,
        syncError: null,
      }));
    },
    onSuccess: async (_response) => {
      const now = new Date();
      setSyncStatus({
        isSyncing: false,
        lastSyncTime: now,
        syncError: null,
      });

      // Invalidate and refetch summary
      await queryClient.invalidateQueries({ queryKey: healthKeys.summary() });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage,
      }));
    },
  });
}

/**
 * Hook to check if health sync is in progress
 */
export function useHealthSyncStatus() {
  const syncStatus = useHealthStore((state) => state.syncStatus);
  return syncStatus;
}
