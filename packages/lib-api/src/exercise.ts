/**
 * Exercise API
 *
 * API functions per exercises
 */

import { apiClient } from './client';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  category?: string;
  muscleGroups?: string[];
  equipment?: string[];
  [key: string]: unknown;
}

export interface ExerciseResponse {
  exercise: Exercise;
}

export interface ExercisesResponse {
  data: Exercise[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface ExerciseListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  exerciseTypeId?: string;
  equipmentIds?: string[];
  bodyPartIds?: string[];
  muscleIds?: string[];
  approvalStatus?: string;
  includeTranslations?: boolean;
  includeUnapproved?: boolean;
}

export const exerciseApi = {
  /**
   * Get all exercises with optional filters
   */
  async list(params?: ExerciseListParams): Promise<ExercisesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.exerciseTypeId) searchParams.set('exerciseTypeId', params.exerciseTypeId);
    if (params?.equipmentIds?.length)
      searchParams.set('equipmentIds', params.equipmentIds.join(','));
    if (params?.bodyPartIds?.length) searchParams.set('bodyPartIds', params.bodyPartIds.join(','));
    if (params?.muscleIds?.length) searchParams.set('muscleIds', params.muscleIds.join(','));
    if (params?.approvalStatus) searchParams.set('approvalStatus', params.approvalStatus);
    if (params?.includeTranslations) searchParams.set('includeTranslations', 'true');
    if (params?.includeUnapproved) searchParams.set('includeUnapproved', 'true');

    const query = searchParams.toString();
    return apiClient.get<ExercisesResponse>(`/api/exercises${query ? `?${query}` : ''}`);
  },

  /**
   * Get exercise by ID
   */
  async getById(id: string): Promise<ExerciseResponse> {
    return apiClient.get<ExerciseResponse>(`/api/exercises/${id}`);
  },

  /**
   * Create exercise
   */
  async create(data: unknown): Promise<ExerciseResponse> {
    return apiClient.post<ExerciseResponse>('/api/exercises', data);
  },

  /**
   * Update exercise
   */
  async update(id: string, data: unknown): Promise<ExerciseResponse> {
    return apiClient.put<ExerciseResponse>(`/api/exercises/${id}`, data);
  },

  /**
   * Delete exercise
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/exercises/${id}`);
  },

  /**
   * Batch operations (approve, reject, delete)
   */
  async batch(
    action: 'approve' | 'reject' | 'delete',
    ids: string[]
  ): Promise<{
    success: boolean;
    results: Array<{ id: string; success: boolean; error?: string }>;
    updated?: number;
    deleted?: number;
    status?: string;
  }> {
    return apiClient.post('/api/admin/exercises/batch', { action, ids });
  },
};
