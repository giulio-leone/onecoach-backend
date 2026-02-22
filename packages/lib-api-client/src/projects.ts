import { apiClient } from './client';
import type { Project } from '@giulio-leone/types/domain';

export interface ProjectsResponse {
  projects: Project[];
}

export interface ProjectResponse {
  project: Project;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  startDate?: Date;
  dueDate?: Date;
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD';
  color?: string;
}

export const projectsApi = {
  getAll: async (): Promise<ProjectsResponse> => {
    return apiClient.get<ProjectsResponse>('/api/projects');
  },

  getById: async (id: string): Promise<ProjectResponse> => {
    return apiClient.get<ProjectResponse>(`/api/projects/${id}`);
  },

  create: async (input: CreateProjectInput): Promise<Project> => {
    const response = await apiClient.post<ProjectResponse>('/api/projects', {
      ...input,
      startDate: input.startDate?.toISOString(),
      dueDate: input.dueDate?.toISOString(),
    });
    return response.project;
  },

  update: async (id: string, input: Partial<CreateProjectInput>): Promise<Project> => {
    const response = await apiClient.patch<ProjectResponse>('/api/projects', {
      id,
      ...input,
      startDate: input.startDate?.toISOString(),
      dueDate: input.dueDate?.toISOString(),
    });
    return response.project;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/projects?id=${id}`);
  },

  duplicate: async (id: string): Promise<Project> => {
    const response = await apiClient.post<ProjectResponse>(`/api/projects/${id}/duplicate`, {});
    return response.project;
  },
};

// NOTE: tasksApi and milestonesApi are now in their own files (tasks.ts, milestones.ts)
// This avoids duplication and keeps SSOT
