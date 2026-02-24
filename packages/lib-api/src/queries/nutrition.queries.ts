/**
 * Nutrition Query Keys and Functions
 *
 * Standardized query keys and query functions for nutrition-related queries
 */

import { nutritionApi } from '../nutrition';
import type { NutritionPlanResponse, NutritionPlansResponse } from '../nutrition';

/**
 * Query keys for nutrition queries
 */
export const nutritionKeys = {
  all: ['nutrition'] as const,
  lists: () => [...nutritionKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...nutritionKeys.lists(), filters] as const,
  details: () => [...nutritionKeys.all, 'detail'] as const,
  detail: (id: string) => [...nutritionKeys.details(), id] as const,
  versions: (id: string) => [...nutritionKeys.detail(id), 'versions'] as const,
  logs: () => [...nutritionKeys.all, 'logs'] as const,
  log: (logId: string) => [...nutritionKeys.logs(), logId] as const,
  dayLogs: (planId: string) => [...nutritionKeys.detail(planId), 'day-logs'] as const,
} as const;

/**
 * Query functions for nutrition
 */
export const nutritionQueries = {
  /**
   * Get all nutrition plans
   */
  getAll: (): Promise<NutritionPlansResponse> => {
    return nutritionApi.getAll();
  },

  /**
   * Get nutrition plan by ID
   */
  getById: (id: string): Promise<NutritionPlanResponse> => {
    return nutritionApi.getById(id);
  },

  /**
   * Get nutrition plan versions
   */
  getVersions: (id: string): Promise<{ versions: unknown[] }> => {
    return nutritionApi.getVersions(id);
  },

  /**
   * Get nutrition day log by ID
   */
  getDayLog: (logId: string): Promise<{ log: unknown }> => {
    return nutritionApi.getDayLog(logId);
  },
};
