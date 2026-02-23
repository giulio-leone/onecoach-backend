import type { Habit } from '@giulio-leone/types';
export interface HabitsResponse {
  habits: Habit[];
}
export interface CreateHabitInput {
  title: string;
  description?: string;
  frequency: 'DAILY' | 'WEEKLY';
  color?: string;
}
export declare const habitsApi: {
  getAll: () => Promise<HabitsResponse>;
  getById: (id: string) => Promise<{
    habit: Habit;
  }>;
  create: (input: CreateHabitInput) => Promise<{
    habit: Habit;
  }>;
  update: (
    id: string,
    input: Partial<CreateHabitInput>
  ) => Promise<{
    habit: Habit;
  }>;
  delete: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<{
    habit: Habit;
  }>;
};
//# sourceMappingURL=habits.d.ts.map
