/**
 * Food React Query Hooks
 *
 * Custom hooks for food-related queries and mutations
 */
import { type FoodsResponse } from '../food';
import type { FoodListParams } from '../food';
/**
 * Hook to get all foods with optional filters
 * Optimized for admin panel with longer cache
 * IMPORTANT: Quando cambiano i params (es. page), React Query rifa automaticamente il fetch
 * perché la queryKey cambia. Non usare refetchOnMount: false per evitare problemi di paginazione.
 */
export declare function useFoods(
  params?: FoodListParams,
  initialData?: FoodsResponse
): import('@tanstack/react-query').UseQueryResult<FoodsResponse, Error>;
/**
 * Hook to get a food by ID
 */
export declare function useFood(
  id: string | null | undefined
): import('@tanstack/react-query').UseQueryResult<import('..').FoodResponse, Error>;
/**
 * Hook to create a food
 */
export declare function useCreateFood(): import('@tanstack/react-query').UseMutationResult<
  import('..').FoodResponse,
  Error,
  unknown,
  unknown
>;
/**
 * Hook to update a food
 */
export declare function useUpdateFood(): import('@tanstack/react-query').UseMutationResult<
  import('..').FoodResponse,
  Error,
  {
    id: string;
    data: unknown;
  },
  unknown
>;
/**
 * Hook to delete a food
 */
export declare function useDeleteFood(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  string,
  unknown
>;
/**
 * Hook to update a food using AI
 */
export declare function useUpdateFoodWithAI(): import('@tanstack/react-query').UseMutationResult<
  import('..').FoodResponse,
  Error,
  {
    id: string;
    data: {
      description: string;
      customPrompt?: string;
    };
  },
  unknown
>;
/**
 * Hook for batch operations (delete, update)
 *
 * NOTA: Non usa optimistic updates perché il realtime (Zustand) aggiorna
 * automaticamente il cache React Query quando le modifiche arrivano dal database.
 * Il realtime è gestito globalmente tramite useRealtimeSubscription che usa
 * useRealtimeStore (Zustand) per una singola subscription condivisa.
 */
export declare function useBatchFoodOperations(): import('@tanstack/react-query').UseMutationResult<
  {
    success: boolean;
    results: Array<{
      id: string;
      success: boolean;
      error?: string;
    }>;
    deleted?: number;
    updated?: number;
  },
  Error,
  {
    action: 'delete' | 'update';
    ids: string[];
    data?: Record<string, unknown>;
  },
  unknown
>;
//# sourceMappingURL=use-food.d.ts.map
