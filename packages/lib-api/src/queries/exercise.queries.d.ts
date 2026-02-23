/**
 * Exercise Query Keys and Functions
 *
 * Standardized query keys and query functions for exercise-related queries
 */
import type { ExerciseResponse, ExercisesResponse, ExerciseListParams } from '../exercise';
/**
 * Query keys for exercise queries
 */
export declare const exerciseKeys: {
  readonly all: readonly ['exercises'];
  readonly lists: () => readonly ['exercises', 'list'];
  readonly list: (
    params?: ExerciseListParams
  ) => readonly ['exercises', 'list', ExerciseListParams | undefined];
  readonly details: () => readonly ['exercises', 'detail'];
  readonly detail: (id: string) => readonly ['exercises', 'detail', string];
};
/**
 * Query functions for exercises
 */
export declare const exerciseQueries: {
  /**
   * Get all exercises with optional filters
   */
  list: (params?: ExerciseListParams) => Promise<ExercisesResponse>;
  /**
   * Get exercise by ID
   */
  getById: (id: string) => Promise<ExerciseResponse>;
};
//# sourceMappingURL=exercise.queries.d.ts.map
