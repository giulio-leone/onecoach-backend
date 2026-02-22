import { apiClient } from './client';
import type { Project } from '@giulio-leone/types';

export interface ProjectsResponse {
  projects: Project[];
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  dueDate?: Date;
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD';
  color?: string;
}

export const projectsApi = {
  getAll: async () => {
    const data = await apiClient.get<ProjectsResponse>('/api/projects');
    return data;
  },
  getById: async (id: string) => {
    const data = await apiClient.get<{ project: Project }>(`/api/projects/${id}`);
    return data;
  },
  create: async (input: CreateProjectInput) => {
    const data = await apiClient.post<{ project: Project }>('/api/projects', input);
    return data;
  },
  update: async (id: string, input: Partial<CreateProjectInput>) => {
    const data = await apiClient.patch<{ project: Project }>('/api/projects', { id, ...input });
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/api/projects?id=${id}`);
  },
};

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  milestoneId?: string;
  parentId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate?: Date;
  dependencies?: string[];
}

export const tasksApi = {
  create: async (input: CreateTaskInput) => {
    const data = await apiClient.post<{ task: unknown }>('/api/tasks', input);
    return data;
  },
  update: async (id: string, input: Partial<CreateTaskInput>) => {
    const data = await apiClient.patch<{ task: unknown }>(`/api/tasks`, { id, ...input });
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/api/tasks?id=${id}`);
  },
  reorder: async (updates: { id: string; order: number; parentId?: string | null }[]) => {
    await apiClient.patch('/api/tasks/reorder', { updates });
  },
};

export interface CreateMilestoneInput {
  name: string;
  description?: string;
  projectId: string;
  dueDate?: Date;
  order?: number;
  dependencies?: string[];
}

export const milestonesApi = {
  create: async (input: CreateMilestoneInput) => {
    const data = await apiClient.post<{ milestone: unknown }>('/api/milestones', input);
    return data;
  },
  update: async (id: string, input: Partial<CreateMilestoneInput>) => {
    const data = await apiClient.patch<{ milestone: unknown }>(`/api/milestones`, { id, ...input });
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/api/milestones?id=${id}`);
  },
};
