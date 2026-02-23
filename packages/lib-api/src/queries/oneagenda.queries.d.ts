/**
 * OneAgenda Query Keys and Functions
 *
 * Standardized query keys and query functions for tasks and goals queries
 */
import type { Task, TaskStatus, TaskPriority, Goal, GoalStatus } from '../types/oneagenda.types';
/**
 * Query keys for oneagenda queries
 */
export declare const oneagendaKeys: {
  readonly all: readonly ['oneagenda'];
  readonly tasks: {
    readonly all: readonly ['oneagenda', 'tasks'];
    readonly lists: () => readonly ['oneagenda', 'tasks', 'list'];
    readonly list: (
      filters?: TasksFilters
    ) => readonly ['oneagenda', 'tasks', 'list', TasksFilters | undefined];
    readonly details: () => readonly ['oneagenda', 'tasks', 'detail'];
    readonly detail: (id: string) => readonly ['oneagenda', 'tasks', 'detail', string];
  };
  readonly goals: {
    readonly all: readonly ['oneagenda', 'goals'];
    readonly lists: () => readonly ['oneagenda', 'goals', 'list'];
    readonly list: (
      filters?: GoalsFilters
    ) => readonly ['oneagenda', 'goals', 'list', GoalsFilters | undefined];
    readonly details: () => readonly ['oneagenda', 'goals', 'detail'];
    readonly detail: (id: string) => readonly ['oneagenda', 'goals', 'detail', string];
  };
  readonly habits: {
    readonly all: readonly ['oneagenda', 'habits'];
    readonly lists: () => readonly ['oneagenda', 'habits', 'list'];
    readonly list: () => readonly ['oneagenda', 'habits', 'list'];
    readonly details: () => readonly ['oneagenda', 'habits', 'detail'];
    readonly detail: (id: string) => readonly ['oneagenda', 'habits', 'detail', string];
  };
};
/**
 * Filters for tasks list
 */
export interface TasksFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  goalId?: string;
}
/**
 * Filters for goals list
 */
export interface GoalsFilters {
  status?: GoalStatus;
}
/**
 * Query functions for tasks
 */
export declare const tasksQueries: {
  /**
   * Get tasks list
   */
  list: (filters?: TasksFilters) => Promise<Task[]>;
  /**
   * Create task
   */
  create: (input: Partial<Task>) => Promise<Task>;
  /**
   * Update task status
   */
  updateStatus: (id: string, status: TaskStatus) => Promise<Task>;
  /**
   * Delete task
   */
  delete: (id: string) => Promise<void>;
};
/**
 * Query functions for goals
 */
export declare const goalsQueries: {
  /**
   * Get goals list
   */
  list: (filters?: GoalsFilters) => Promise<Goal[]>;
  /**
   * Create goal
   */
  create: (input: Partial<Goal>) => Promise<Goal>;
  /**
   * Delete goal
   */
  delete: (id: string) => Promise<void>;
};
/**
 * Query functions for habits
 */
export declare const habitsQueries: {
  /**
   * Get habits list
   */
  list: () => Promise<unknown[]>;
  /**
   * Toggle habit completion
   */
  toggle: (id: string) => Promise<unknown>;
};
//# sourceMappingURL=oneagenda.queries.d.ts.map
