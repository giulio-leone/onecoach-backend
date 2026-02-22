/**
 * Workout API
 *
 * API functions per workout programs
 */

import { apiClient } from './client';
import type { WorkoutProgram } from '@giulio-leone/types';

export interface WorkoutProgramResponse {
  program: WorkoutProgram;
}

export interface WorkoutProgramsResponse {
  programs: WorkoutProgram[];
}

export const workoutApi = {
  /**
   * Get all workout programs
   */
  async getAll(): Promise<WorkoutProgramsResponse> {
    return apiClient.get<WorkoutProgramsResponse>('/api/workout');
  },

  /**
   * Get workout program by ID
   */
  async getById(id: string): Promise<WorkoutProgramResponse> {
    return apiClient.get<WorkoutProgramResponse>(`/api/workout/${id}`);
  },

  /**
   * Create workout program
   */
  async create(data: unknown): Promise<WorkoutProgramResponse> {
    return apiClient.post<WorkoutProgramResponse>('/api/workout', data);
  },

  /**
   * Update workout program
   */
  async update(id: string, data: unknown): Promise<WorkoutProgramResponse> {
    return apiClient.put<WorkoutProgramResponse>(`/api/workout/${id}`, data);
  },

  /**
   * Delete workout program
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/workout/${id}`);
  },

  /**
   * Create a new workout session
   */
  async createSession(
    programId: string,
    data: { weekNumber: number; dayNumber: number }
  ): Promise<{ session: unknown }> {
    return apiClient.post<{ session: unknown }>(`/api/workouts/${programId}/sessions`, data);
  },

  /**
   * Get workout session by ID
   */
  async getSession(sessionId: string): Promise<{ session: unknown }> {
    return apiClient.get<{ session: unknown }>(`/api/workouts/sessions/${sessionId}`);
  },

  /**
   * Update workout session
   */
  async updateSession(sessionId: string, data: unknown): Promise<{ session: unknown }> {
    return apiClient.put<{ session: unknown }>(`/api/workouts/sessions/${sessionId}`, data);
  },
};
