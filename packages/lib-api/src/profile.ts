/**
 * Profile API
 *
 * API functions per user profile data
 */

import { apiClient } from './client';

export interface OneRepMaxResponse {
  maxes: unknown[];
}

export interface UpsertOneRepMaxRequest {
  catalogExerciseId: string;
  oneRepMax: number;
  notes?: string | null;
}

export const profileApi = {
  /**
   * Get user one rep maxes
   */
  async getOneRepMaxes(): Promise<OneRepMaxResponse> {
    return apiClient.get<OneRepMaxResponse>('/api/profile/maxes');
  },

  /**
   * Upsert one rep max
   */
  async upsertOneRepMax(data: UpsertOneRepMaxRequest): Promise<{ max: unknown }> {
    return apiClient.post<{ max: unknown }>('/api/profile/maxes', data);
  },

  /**
   * Delete one rep max
   * @param catalogExerciseId - ID dell'esercizio nel catalogo
   */
  async deleteOneRepMax(catalogExerciseId: string): Promise<void> {
    return apiClient.delete(`/api/profile/maxes/${catalogExerciseId}`);
  },
};
