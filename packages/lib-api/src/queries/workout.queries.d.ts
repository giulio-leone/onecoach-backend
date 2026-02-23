/**
 * Workout Query Keys and Functions
 *
 * Standardized query keys and query functions for workout-related queries
 */
import type { WorkoutProgramResponse, WorkoutProgramsResponse } from '../workout';
/**
 * Query keys for workout queries
 */
export declare const workoutKeys: {
  readonly all: readonly ['workouts'];
  readonly lists: () => readonly ['workouts', 'list'];
  readonly list: (
    filters?: Record<string, unknown>
  ) => readonly ['workouts', 'list', Record<string, unknown> | undefined];
  readonly details: () => readonly ['workouts', 'detail'];
  readonly detail: (id: string) => readonly ['workouts', 'detail', string];
  readonly sessions: () => readonly ['workouts', 'sessions'];
  readonly session: (sessionId: string) => readonly ['workouts', 'sessions', string];
};
/**
 * Query functions for workouts
 */
export declare const workoutQueries: {
  /**
   * Get all workout programs
   */
  getAll: () => Promise<WorkoutProgramsResponse>;
  /**
   * Get workout program by ID
   */
  getById: (id: string) => Promise<WorkoutProgramResponse>;
  /**
   * Get workout session by ID
   */
  getSession: (sessionId: string) => Promise<{
    session: unknown;
  }>;
};
//# sourceMappingURL=workout.queries.d.ts.map
