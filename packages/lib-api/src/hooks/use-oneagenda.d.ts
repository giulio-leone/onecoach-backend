/**
 * OneAgenda React Query Hooks
 *
 * Custom hooks for tasks and goals queries and mutations
 */
import { type TasksFilters, type GoalsFilters } from '../queries/oneagenda.queries';
import type { Task, TaskStatus, Goal } from '../types/oneagenda.types';
/**
 * Hook to get tasks list
 *
 * @param filters - Optional filters for the list
 * @param enabled - Whether to enable the query
 * @returns Query result with tasks array
 */
export declare function useTasks(
  filters?: TasksFilters,
  enabled?: boolean
): import('@tanstack/react-query').UseQueryResult<Task[], Error>;
/**
 * Hook to create task
 *
 * @returns Mutation result with create function
 */
export declare function useCreateTask(): import('@tanstack/react-query').UseMutationResult<
  Task,
  Error,
  Partial<Task>,
  unknown
>;
/**
 * Hook to update task status
 *
 * @returns Mutation result with update function
 */
export declare function useUpdateTaskStatus(): import('@tanstack/react-query').UseMutationResult<
  Task,
  Error,
  {
    id: string;
    status: TaskStatus;
  },
  {
    previousTasks: Task[] | undefined;
  }
>;
/**
 * Hook to delete task
 *
 * @returns Mutation result with delete function
 */
export declare function useDeleteTask(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  string,
  {
    previousTasks: Task[] | undefined;
  }
>;
/**
 * Hook to get goals list
 *
 * @param filters - Optional filters for the list
 * @param enabled - Whether to enable the query
 * @returns Query result with goals array
 */
export declare function useGoals(
  filters?: GoalsFilters,
  enabled?: boolean
): import('@tanstack/react-query').UseQueryResult<Goal[], Error>;
/**
 * Hook to create goal
 *
 * @returns Mutation result with create function
 */
export declare function useCreateGoal(): import('@tanstack/react-query').UseMutationResult<
  Goal,
  Error,
  Partial<Goal>,
  unknown
>;
/**
 * Hook to delete goal
 *
 * @returns Mutation result with delete function
 */
export declare function useDeleteGoal(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  string,
  {
    previousGoals: Goal[] | undefined;
  }
>;
/**
 * Hook to get habits list
 */
export declare function useHabits(
  enabled?: boolean
): import('@tanstack/react-query').UseQueryResult<unknown[], Error>;
/**
 * Hook to toggle habit
 */
export declare function useToggleHabit(): import('@tanstack/react-query').UseMutationResult<
  unknown,
  Error,
  string,
  unknown
>;
//# sourceMappingURL=use-oneagenda.d.ts.map
