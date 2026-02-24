/**
 * Nutrition API
 *
 * API functions per nutrition plans
 */

import { apiClient } from './client';
import type { NutritionPlan } from '@giulio-leone/types/nutrition';

export interface NutritionPlanResponse {
  plan: NutritionPlan;
}

export interface NutritionPlansResponse {
  plans: NutritionPlan[];
}

export const nutritionApi = {
  /**
   * Get all nutrition plans
   */
  async getAll(): Promise<NutritionPlansResponse> {
    return apiClient.get<NutritionPlansResponse>('/api/nutrition');
  },

  /**
   * Get nutrition plan by ID
   */
  async getById(id: string): Promise<NutritionPlanResponse> {
    return apiClient.get<NutritionPlanResponse>(`/api/nutrition/${id}`);
  },

  /**
   * Create nutrition plan
   */
  async create(data: unknown): Promise<NutritionPlanResponse> {
    return apiClient.post<NutritionPlanResponse>('/api/nutrition', data);
  },

  /**
   * Update nutrition plan
   */
  async update(id: string, data: unknown): Promise<NutritionPlanResponse> {
    return apiClient.put<NutritionPlanResponse>(`/api/nutrition/${id}`, data);
  },

  /**
   * Delete nutrition plan
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/nutrition/${id}`);
  },

  /**
   * Duplicate nutrition plan
   */
  async duplicate(id: string): Promise<NutritionPlanResponse> {
    return apiClient.post<NutritionPlanResponse>(`/api/nutrition/${id}/duplicate`, {});
  },

  /**
   * Get nutrition plan versions
   */
  async getVersions(id: string): Promise<{ versions: unknown[] }> {
    return apiClient.get<{ versions: unknown[] }>(`/api/nutrition/${id}/versions`);
  },

  /**
   * Create nutrition day log
   */
  async createDayLog(
    planId: string,
    data: { weekNumber: number; dayNumber: number; date?: string | Date }
  ): Promise<{ log: unknown }> {
    return apiClient.post<{ log: unknown }>(`/api/nutrition/${planId}/logs`, data);
  },

  /**
   * Get nutrition day log by ID
   */
  async getDayLog(logId: string): Promise<{ log: unknown }> {
    return apiClient.get<{ log: unknown }>(`/api/nutrition/logs/${logId}`);
  },

  /**
   * Update nutrition day log
   */
  async updateDayLog(logId: string, data: unknown): Promise<{ log: unknown }> {
    return apiClient.put<{ log: unknown }>(`/api/nutrition/logs/${logId}`, data);
  },
};
