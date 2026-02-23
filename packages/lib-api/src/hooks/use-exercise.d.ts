/**
 * Exercise React Query Hooks
 *
 * Custom hooks for exercise-related queries and mutations
 */
import { type ExercisesResponse, type ExerciseListParams, type Exercise } from '../exercise';
/**
 * Hook to get all exercises with optional filters
 * Optimized for admin panel with longer cache
 */
export declare function useExercises<T extends Exercise = Exercise>(
  params?: ExerciseListParams,
  initialData?: ExercisesResponse<T>
): import('@tanstack/react-query').UseQueryResult<ExercisesResponse<Exercise>, Error>;
/**
 * Hook to get an exercise by ID
 */
export declare function useExercise(
  id: string | null | undefined
): import('@tanstack/react-query').UseQueryResult<import('..').ExerciseResponse, Error>;
/**
 * Hook to create an exercise
 */
export declare function useCreateExercise(): import('@tanstack/react-query').UseMutationResult<
  import('..').ExerciseResponse,
  Error,
  unknown,
  unknown
>;
/**
 * Hook to update an exercise
 */
export declare function useUpdateExercise(): import('@tanstack/react-query').UseMutationResult<
  import('..').ExerciseResponse,
  Error,
  {
    id: string;
    data: unknown;
  },
  unknown
>;
/**
 * Hook to delete an exercise
 */
export declare function useDeleteExercise(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  string,
  unknown
>;
/**
 * Hook for batch operations (approve, reject, delete)
 *
 * NOTA: Non usa optimistic updates perché il realtime (Zustand) aggiorna
 * automaticamente il cache React Query quando le modifiche arrivano dal database.
 * Il realtime è gestito globalmente tramite useRealtimeSubscription che usa
 * useRealtimeStore (Zustand) per una singola subscription condivisa.
 */
export declare function useBatchExerciseOperations(): import('@tanstack/react-query').UseMutationResult<
  {
    success: boolean;
    results: Array<{
      id: string;
      success: boolean;
      error?: string;
    }>;
    updated?: number;
    deleted?: number;
    status?: string;
  },
  Error,
  {
    action: 'approve' | 'reject' | 'delete';
    ids: string[];
  },
  unknown
>;
//# sourceMappingURL=use-exercise.d.ts.map
