/**
 * Health Query Keys and Functions
 *
 * TanStack Query keys and functions for health data
 */

import { apiClient } from '../client';
import type { HealthSummary, HealthPlatform } from '@giulio-leone/lib-stores/health.store';

/**
 * Health data type
 */
export type HealthDataType = 'steps' | 'heartRate' | 'activeCalories' | 'weight' | 'workout';

/**
 * Health data request interface
 */
export interface HealthDataRequest {
  dataType: HealthDataType;
  startDate: string; // ISO string
  endDate: string; // ISO string
  data: unknown[]; // HealthData[]
}

/**
 * Health sync request interface
 */
export interface HealthSyncRequest {
  userId: string;
  platform: HealthPlatform;
  dataRequests: HealthDataRequest[];
  syncTimestamp: string; // ISO string
}

/**
 * Health sync response interface
 */
export interface HealthSyncResponse {
  success: boolean;
  syncedDataTypes: HealthDataType[];
  errors?: string[];
}

/**
 * Health query keys factory
 */
export const healthKeys = {
  all: ['health'] as const,
  summary: () => [...healthKeys.all, 'summary'] as const,
  sync: () => [...healthKeys.all, 'sync'] as const,
  data: (dataType?: string, startDate?: string, endDate?: string) =>
    [...healthKeys.all, 'data', dataType, startDate, endDate] as const,
};

/**
 * Health query functions
 */
export const healthQueries = {
  /**
   * Get health summary
   */
  getSummary: async (): Promise<HealthSummary> => {
    const response = await apiClient.get<HealthSummary>('/api/health/summary');
    return response;
  },

  /**
   * Sync health data
   */
  syncData: async (request: HealthSyncRequest): Promise<HealthSyncResponse> => {
    const response = await apiClient.post<HealthSyncResponse>('/api/health/sync', request);
    return response;
  },
};
