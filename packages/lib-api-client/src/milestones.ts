import { apiClient } from './client';
import type { Milestone } from '@giulio-leone/types/domain';

export interface MilestoneResponse {
  milestone: Milestone;
}

export interface MilestonesResponse {
  milestones: Milestone[];
}

export const milestonesApi = {
  create: async (input: {
    projectId: string;
    name: string;
    description?: string;
    dueDate?: string;
    order?: number;
    dependencies?: string[];
  }): Promise<Milestone> => {
    const response = await apiClient.post<Milestone>('/api/milestones', input);
    return response;
  },

  update: async (
    id: string,
    input: Partial<{
      name: string;
      description: string;
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
      dueDate: string;
      order: number;
      dependencies: string[];
    }>
  ): Promise<Milestone> => {
    const response = await apiClient.patch<Milestone>('/api/milestones', { id, ...input });
    return response;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/milestones?id=${id}`);
  },
};
