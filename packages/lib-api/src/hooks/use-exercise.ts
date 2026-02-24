'use client';

/**
 * Exercise React Query Hooks
 *
 * Custom hooks for exercise-related queries and mutations
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exerciseApi } from '../exercise';
import { exerciseKeys, exerciseQueries } from '../queries/exercise.queries';
import type { ExercisesResponse, ExerciseListParams, Exercise } from '../exercise';
import { ExerciseApprovalStatus } from '@giulio-leone/types/database';

/**
 * Hook to get all exercises with optional filters
 * Optimized for admin panel with longer cache
 */
export function useExercises(params?: ExerciseListParams, initialData?: ExercisesResponse) {
  return useQuery({
    queryKey: exerciseKeys.list(params),
    queryFn: () => exerciseQueries.list(params),
    staleTime: 10 * 60 * 1000, // 10 minutes for admin
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists in cache
    initialData: initialData,
  });
}

/**
 * Hook to get an exercise by ID
 */
export function useExercise(id: string | null | undefined) {
  return useQuery({
    queryKey: exerciseKeys.detail(id!),
    queryFn: () => exerciseQueries.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create an exercise
 */
export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => exerciseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
    },
  });
}

/**
 * Hook to update an exercise
 */
export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => exerciseApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: exerciseKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook to delete an exercise
 */
export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => exerciseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
    },
  });
}

/**
 * Hook for batch operations (approve, reject, delete)
 * Implements optimistic updates for immediate UI feedback
 */
export function useBatchExerciseOperations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ action, ids }: { action: 'approve' | 'reject' | 'delete'; ids: string[] }) =>
      exerciseApi.batch(action, ids),
    onMutate: async ({ action, ids }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: exerciseKeys.lists() });

      // Snapshot previous values for all affected queries
      const previousQueries = new Map();
      const queryCache = queryClient.getQueryCache();
      const allQueries = queryCache.findAll({ queryKey: exerciseKeys.lists() });

      // Determine target status for approve/reject
      const targetStatus =
        action === 'approve'
          ? ExerciseApprovalStatus.APPROVED
          : action === 'reject'
            ? ExerciseApprovalStatus.REJECTED
            : null;

      // Optimistically update all affected queries
      for (const query of allQueries) {
        const previousData = query.state.data as ExercisesResponse | undefined;
        previousQueries.set(query.queryKey, previousData);

        if (previousData?.data) {
          if (action === 'delete') {
            // Remove deleted exercises
            const updatedData: ExercisesResponse = {
              ...previousData,
              data: previousData.data.filter(
                (exercise: { id: string }) => !ids.includes(exercise.id)
              ),
              total: Math.max(0, (previousData.total ?? previousData.data.length) - ids.length),
            };
            queryClient.setQueryData(query.queryKey, updatedData);
          } else if (targetStatus) {
            // Update approval status optimistically
            const updatedData: ExercisesResponse = {
              ...previousData,
              data: previousData.data.map(
                (exercise: { id: string; name?: string; [key: string]: unknown }) => {
                  if (ids.includes(exercise.id)) {
                    return {
                      ...exercise,
                      name: exercise.name || '',
                      approvalStatus: targetStatus,
                      approvedAt:
                        targetStatus === ExerciseApprovalStatus.APPROVED ? new Date() : null,
                    } as Exercise;
                  }
                  return exercise as Exercise;
                }
              ),
            };
            queryClient.setQueryData(query.queryKey, updatedData);
          }
        }
      }

      return { previousQueries };
    },
    onSuccess: () => {
      // Invalidate and refetch all exercise lists to sync with server
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries.entries()) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
  });
}
