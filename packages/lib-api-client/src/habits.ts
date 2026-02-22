import { apiClient } from './client';
import type { Habit } from '@giulio-leone/types/domain';

export interface HabitsResponse {
  habits: Habit[];
}

export interface CreateHabitInput {
  title: string;
  description?: string;
  frequency: 'DAILY' | 'WEEKLY';
  color?: string;
}

export const habitsApi = {
  getAll: async () => {
    const data = await apiClient.get<HabitsResponse>('/api/habits');
    return data;
  },
  getById: async (id: string) => {
    const data = await apiClient.get<{ habit: Habit }>(`/api/habits/${id}`);
    return data;
  },
  create: async (input: CreateHabitInput) => {
    const data = await apiClient.post<{ habit: Habit }>('/api/habits', input);
    return data;
  },
  update: async (id: string, input: Partial<CreateHabitInput>) => {
    const data = await apiClient.patch<{ habit: Habit }>(`/api/habits/${id}`, input);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/api/habits/${id}`);
  },
  toggle: async (id: string) => {
    const data = await apiClient.post<{ habit: Habit }>(`/api/habits/${id}/toggle`, {});
    return data;
  },
};
