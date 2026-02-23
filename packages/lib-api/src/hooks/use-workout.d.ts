/**
 * Workout React Query Hooks
 *
 * Custom hooks for workout-related queries and mutations
 */
/**
 * Hook to get all workout programs
 */
export declare function useWorkouts(): import('@tanstack/react-query').UseQueryResult<
  import('..').WorkoutProgramsResponse,
  Error
>;
/**
 * Hook to get a workout program by ID
 */
export declare function useWorkout(
  id: string | null | undefined
): import('@tanstack/react-query').UseQueryResult<import('..').WorkoutProgramResponse, Error>;
/**
 * Hook to get a workout session by ID
 */
export declare function useWorkoutSession(
  sessionId: string | null | undefined
): import('@tanstack/react-query').UseQueryResult<
  {
    session: unknown;
  },
  Error
>;
/**
 * Hook to create a workout program
 */
export declare function useCreateWorkout(): import('@tanstack/react-query').UseMutationResult<
  import('..').WorkoutProgramResponse,
  Error,
  unknown,
  unknown
>;
/**
 * Hook to update a workout program
 */
export declare function useUpdateWorkout(): import('@tanstack/react-query').UseMutationResult<
  import('..').WorkoutProgramResponse,
  Error,
  {
    id: string;
    data: unknown;
  },
  unknown
>;
/**
 * Hook to delete a workout program
 */
export declare function useDeleteWorkout(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  string,
  unknown
>;
/**
 * Hook to create a workout session
 */
export declare function useCreateWorkoutSession(): import('@tanstack/react-query').UseMutationResult<
  {
    session: unknown;
  },
  Error,
  {
    programId: string;
    data: {
      weekNumber: number;
      dayNumber: number;
    };
  },
  unknown
>;
/**
 * Hook to update a workout session
 */
export declare function useUpdateWorkoutSession(): import('@tanstack/react-query').UseMutationResult<
  {
    session: unknown;
  },
  Error,
  {
    sessionId: string;
    data: unknown;
  },
  unknown
>;
//# sourceMappingURL=use-workout.d.ts.map
