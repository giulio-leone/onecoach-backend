/**
 * Food React Query Hooks
 *
 * Custom hooks for food-related queries and mutations
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foodApi } from '../food';
import { foodKeys, foodQueries } from '../queries/food.queries';
import type { FoodListParams } from '../food';

/**
 * Hook to get all foods with optional filters
 * Optimized for admin panel with longer cache
 */
export function useFoods(params?: FoodListParams) {
  return useQuery({
    queryKey: foodKeys.list(params),
    queryFn: () => foodQueries.list(params),
    staleTime: 10 * 60 * 1000, // 10 minutes for admin
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if data exists in cache
  });
}

/**
 * Hook to get a food by ID
 */
export function useFood(id: string | null | undefined) {
  return useQuery({
    queryKey: foodKeys.detail(id!),
    queryFn: () => foodQueries.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create a food
 */
export function useCreateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => foodApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.lists() });
    },
  });
}

/**
 * Hook to update a food
 */
export function useUpdateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => foodApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: foodKeys.lists() });
      queryClient.invalidateQueries({ queryKey: foodKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook to delete a food
 */
export function useDeleteFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => foodApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.lists() });
    },
  });
}

/**
 * Hook to update a food using AI
 */
export function useUpdateFoodWithAI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { description: string; customPrompt?: string };
    }) => foodApi.updateWithAI(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: foodKeys.lists() });
      queryClient.invalidateQueries({ queryKey: foodKeys.detail(variables.id) });
    },
  });
}
