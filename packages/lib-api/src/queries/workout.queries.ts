/**
 * Workout Query Keys and Functions
 *
 * Standardized query keys and query functions for workout-related queries
 */

import { workoutApi } from '../workout';
import type { WorkoutProgramResponse, WorkoutProgramsResponse } from '../workout';

/**
 * Query keys for workout queries
 */
export const workoutKeys = {
  all: ['workouts'] as const,
  lists: () => [...workoutKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...workoutKeys.lists(), { filters }] as const,
  details: () => [...workoutKeys.all, 'detail'] as const,
  detail: (id: string) => [...workoutKeys.details(), id] as const,
  sessions: () => [...workoutKeys.all, 'sessions'] as const,
  session: (sessionId: string) => [...workoutKeys.sessions(), sessionId] as const,
} as const;

/**
 * Query functions for workouts
 */
export const workoutQueries = {
  /**
   * Get all workout programs
   */
  getAll: (): Promise<WorkoutProgramsResponse> => {
    return workoutApi.getAll();
  },

  /**
   * Get workout program by ID
   */
  getById: (id: string): Promise<WorkoutProgramResponse> => {
    return workoutApi.getById(id);
  },

  /**
   * Get workout session by ID
   */
  getSession: (sessionId: string): Promise<{ session: unknown }> => {
    return workoutApi.getSession(sessionId);
  },
};
