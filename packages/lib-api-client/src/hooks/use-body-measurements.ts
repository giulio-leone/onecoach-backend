/**
 * Body Measurements React Query Hooks
 *
 * Custom hooks for body measurements queries and mutations
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bodyMeasurementsKeys,
  bodyMeasurementsQueries,
  type BodyMeasurementsFilters,
  type CreateBodyMeasurementInput,
  type UpdateBodyMeasurementInput,
} from '../queries/body-measurements.queries';
import type { BodyMeasurement } from '@giulio-leone/types/analytics';

/**
 * Hook to get body measurements list
 *
 * @param filters - Optional filters for the list
 * @returns Query result with measurements array
 */
export function useBodyMeasurements(filters?: BodyMeasurementsFilters) {
  return useQuery({
    queryKey: bodyMeasurementsKeys.list(filters),
    queryFn: () => bodyMeasurementsQueries.list(filters),
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message === 'UNAUTHENTICATED') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get single body measurement by ID
 *
 * @param id - Measurement ID
 * @param enabled - Whether to enable the query
 * @returns Query result with measurement data
 */
export function useBodyMeasurement(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: bodyMeasurementsKeys.detail(id!),
    queryFn: () => bodyMeasurementsQueries.detail(id!),
    enabled: enabled && !!id,
    retry: (failureCount, error) => {
      if (error.message === 'UNAUTHENTICATED') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create body measurement
 *
 * @returns Mutation result with create function
 */
export function useCreateBodyMeasurement() {
  const queryClient = useQueryClient();

  return useMutation<
    BodyMeasurement,
    Error,
    CreateBodyMeasurementInput,
    { previousMeasurements?: BodyMeasurement[]; tempId?: string }
  >({
    mutationFn: bodyMeasurementsQueries.create,
    onMutate: async (newMeasurement) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: bodyMeasurementsKeys.lists() });

      // Snapshot the previous value
      const previousMeasurements = queryClient.getQueryData<BodyMeasurement[]>(
        bodyMeasurementsKeys.list()
      );

      // Optimistically add the new measurement
      const tempId = `temp-${Date.now()}`;
      const optimisticMeasurement: BodyMeasurement = {
        ...newMeasurement,
        id: tempId,
        userId: '', // Will be set by API
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (previousMeasurements) {
        queryClient.setQueryData<BodyMeasurement[]>(bodyMeasurementsKeys.list(), [
          ...previousMeasurements,
          optimisticMeasurement,
        ]);
      }

      // Return context for rollback
      return { previousMeasurements, tempId };
    },
    onError: (_err, _newMeasurement, context) => {
      // Rollback on error
      if (context?.previousMeasurements) {
        queryClient.setQueryData(bodyMeasurementsKeys.list(), context.previousMeasurements);
      }
    },
    onSuccess: (data, _variables, context) => {
      // Replace temp measurement with real one
      if (context?.previousMeasurements) {
        queryClient.setQueryData<BodyMeasurement[]>(
          bodyMeasurementsKeys.list(),
          context.previousMeasurements.map((m: BodyMeasurement) =>
            m.id === context.tempId ? data : m
          )
        );
      }

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: bodyMeasurementsKeys.lists() });
    },
  });
}

/**
 * Hook to update body measurement
 *
 * @returns Mutation result with update function
 */
export function useUpdateBodyMeasurement() {
  const queryClient = useQueryClient();

  return useMutation<
    BodyMeasurement,
    Error,
    { id: string; input: UpdateBodyMeasurementInput },
    { previousMeasurement?: BodyMeasurement; previousMeasurements?: BodyMeasurement[] }
  >({
    mutationFn: ({ id, input }: { id: string; input: UpdateBodyMeasurementInput }) =>
      bodyMeasurementsQueries.update(id, input),
    onMutate: async ({ id, input }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: bodyMeasurementsKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: bodyMeasurementsKeys.lists() });

      // Snapshot previous values
      const previousMeasurement = queryClient.getQueryData<BodyMeasurement>(
        bodyMeasurementsKeys.detail(id)
      );
      const previousMeasurements = queryClient.getQueryData<BodyMeasurement[]>(
        bodyMeasurementsKeys.list()
      );

      // Optimistically update
      if (previousMeasurement) {
        const optimisticMeasurement: BodyMeasurement = {
          ...previousMeasurement,
          ...input,
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(bodyMeasurementsKeys.detail(id), optimisticMeasurement);
      }

      if (previousMeasurements) {
        queryClient.setQueryData<BodyMeasurement[]>(
          bodyMeasurementsKeys.list(),
          previousMeasurements.map((m: BodyMeasurement) =>
            m.id === id
              ? {
                  ...m,
                  ...input,
                  updatedAt: new Date().toISOString(),
                }
              : m
          )
        );
      }

      return { previousMeasurement, previousMeasurements };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousMeasurement) {
        queryClient.setQueryData(
          bodyMeasurementsKeys.detail(variables.id),
          context.previousMeasurement
        );
      }
      if (context?.previousMeasurements) {
        queryClient.setQueryData(bodyMeasurementsKeys.list(), context.previousMeasurements);
      }
    },
    onSuccess: (data, variables) => {
      // Update cache with response
      queryClient.setQueryData(bodyMeasurementsKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: bodyMeasurementsKeys.lists() });
    },
  });
}

/**
 * Hook to delete body measurement
 *
 * @returns Mutation result with delete function
 */
export function useDeleteBodyMeasurement() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    string,
    { previousMeasurements?: BodyMeasurement[]; previousMeasurement?: BodyMeasurement | null }
  >({
    mutationFn: bodyMeasurementsQueries.delete,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: bodyMeasurementsKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: bodyMeasurementsKeys.lists() });

      // Snapshot previous value
      const previousMeasurements = queryClient.getQueryData<BodyMeasurement[]>(
        bodyMeasurementsKeys.list()
      );
      const previousMeasurement = queryClient.getQueryData<BodyMeasurement>(
        bodyMeasurementsKeys.detail(id)
      );

      // Optimistically remove
      if (previousMeasurements) {
        queryClient.setQueryData<BodyMeasurement[]>(
          bodyMeasurementsKeys.list(),
          previousMeasurements.filter((m: BodyMeasurement) => m.id !== id)
        );
      }

      return { previousMeasurements, previousMeasurement };
    },
    onError: (_err, id, context) => {
      // Rollback on error
      if (context?.previousMeasurements) {
        queryClient.setQueryData(bodyMeasurementsKeys.list(), context.previousMeasurements);
      }
      if (context?.previousMeasurement) {
        queryClient.setQueryData(bodyMeasurementsKeys.detail(id), context.previousMeasurement);
      }
    },
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: bodyMeasurementsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bodyMeasurementsKeys.lists() });
    },
  });
}
