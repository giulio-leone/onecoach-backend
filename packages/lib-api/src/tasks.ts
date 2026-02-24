import { apiClient } from './client';
import type { Task } from '@giulio-leone/types/domain';

export interface TaskResponse {
  task: Task;
}

export interface TasksResponse {
  tasks: Task[];
}

export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const response = await apiClient.get<TasksResponse>('/api/tasks');
    return response.tasks || [];
  },

  getById: async (id: string): Promise<Task> => {
    const response = await apiClient.get<TaskResponse>(`/api/tasks/${id}`);
    return response.task;
  },

  create: async (input: {
    projectId: string;
    title: string;
    description?: string;
    milestoneId?: string;
    parentId?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    dueDate?: Date;
    dependencies?: string[];
  }): Promise<Task> => {
    const response = await apiClient.post<Task>('/api/tasks', {
      ...input,
      dueDate: input.dueDate?.toISOString(),
    });
    return response;
  },

  update: async (
    id: string,
    input: Partial<{
      title: string;
      description: string;
      status: 'TODO' | 'IN_PROGRESS' | 'DONE';
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      dueDate: string;
      milestoneId: string;
      parentId: string;
      order: number;
      dependencies: string[];
    }>
  ): Promise<Task> => {
    const response = await apiClient.patch<Task>('/api/tasks', { id, ...input });
    return response;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/tasks?id=${id}`);
  },

  reorder: async (tasks: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.post('/api/tasks/reorder', { tasks });
  },
};
