/**
 * OneAgenda React Query Hooks
 *
 * Custom hooks for tasks and goals queries and mutations
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  oneagendaKeys,
  tasksQueries,
  goalsQueries,
  type TasksFilters,
  type GoalsFilters,
} from '../queries/oneagenda.queries';
import type { Task, TaskStatus, Goal } from '../types/oneagenda.types';

/**
 * Hook to get tasks list
 *
 * @param filters - Optional filters for the list
 * @param enabled - Whether to enable the query
 * @returns Query result with tasks array
 */
export function useTasks(filters?: TasksFilters, enabled = true) {
  return useQuery({
    queryKey: oneagendaKeys.tasks.list(filters),
    queryFn: () => tasksQueries.list(filters),
    enabled,
    retry: (failureCount, error) => {
      if (error.message === 'UNAUTHENTICATED') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create task
 *
 * @returns Mutation result with create function
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksQueries.create,
    onSuccess: () => {
      // Invalidate and refetch tasks list
      queryClient.invalidateQueries({ queryKey: oneagendaKeys.tasks.lists() });
    },
  });
}

/**
 * Hook to update task status
 *
 * @returns Mutation result with update function
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksQueries.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: oneagendaKeys.tasks.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(oneagendaKeys.tasks.list());

      // Optimistically update
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          oneagendaKeys.tasks.list(),
          previousTasks.map((task: any) => (task.id === id ? { ...task, status } : task))
        );
      }

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(oneagendaKeys.tasks.list(), context.previousTasks);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: oneagendaKeys.tasks.lists() });
    },
  });
}

/**
 * Hook to delete task
 *
 * @returns Mutation result with delete function
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksQueries.delete,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: oneagendaKeys.tasks.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(oneagendaKeys.tasks.list());

      // Optimistically remove
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          oneagendaKeys.tasks.list(),
          previousTasks.filter((task: any) => task.id !== id)
        );
      }

      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(oneagendaKeys.tasks.list(), context.previousTasks);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: oneagendaKeys.tasks.lists() });
    },
  });
}

/**
 * Hook to get goals list
 *
 * @param filters - Optional filters for the list
 * @param enabled - Whether to enable the query
 * @returns Query result with goals array
 */
export function useGoals(filters?: GoalsFilters, enabled = true) {
  return useQuery({
    queryKey: oneagendaKeys.goals.list(filters),
    queryFn: () => goalsQueries.list(filters),
    enabled,
    retry: (failureCount, error) => {
      if (error.message === 'UNAUTHENTICATED') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create goal
 *
 * @returns Mutation result with create function
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: goalsQueries.create,
    onSuccess: () => {
      // Invalidate and refetch goals list
      queryClient.invalidateQueries({ queryKey: oneagendaKeys.goals.lists() });
    },
  });
}

/**
 * Hook to delete goal
 *
 * @returns Mutation result with delete function
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: goalsQueries.delete,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: oneagendaKeys.goals.lists() });

      // Snapshot previous value
      const previousGoals = queryClient.getQueryData<Goal[]>(oneagendaKeys.goals.list());

      // Optimistically remove
      if (previousGoals) {
        queryClient.setQueryData<Goal[]>(
          oneagendaKeys.goals.list(),
          previousGoals.filter((goal: any) => goal.id !== id)
        );
      }

      return { previousGoals };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousGoals) {
        queryClient.setQueryData(oneagendaKeys.goals.list(), context.previousGoals);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: oneagendaKeys.goals.lists() });
    },
  });
}

/**
 * Hook to get habits list
 */
export function useHabits(enabled = true) {
  return useQuery({
    queryKey: oneagendaKeys.habits.list(),
    queryFn: () => import('../queries/oneagenda.queries').then((m) => m.habitsQueries.list()),
    enabled,
    retry: (failureCount, error) => {
      if (error.message === 'UNAUTHENTICATED') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to toggle habit
 */
export function useToggleHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      import('../queries/oneagenda.queries').then((m) => m.habitsQueries.toggle(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oneagendaKeys.habits.lists() });
    },
  });
}
