/**
 * Health Query Keys and Functions
 *
 * TanStack Query keys and functions for health data
 */
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
  startDate: string;
  endDate: string;
  data: unknown[];
}
/**
 * Health sync request interface
 */
export interface HealthSyncRequest {
  userId: string;
  platform: HealthPlatform;
  dataRequests: HealthDataRequest[];
  syncTimestamp: string;
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
export declare const healthKeys: {
  all: readonly ['health'];
  summary: () => readonly ['health', 'summary'];
  sync: () => readonly ['health', 'sync'];
  data: (
    dataType?: string,
    startDate?: string,
    endDate?: string
  ) => readonly ['health', 'data', string | undefined, string | undefined, string | undefined];
};
/**
 * Health query functions
 */
export declare const healthQueries: {
  /**
   * Get health summary
   */
  getSummary: () => Promise<HealthSummary>;
  /**
   * Sync health data
   */
  syncData: (request: HealthSyncRequest) => Promise<HealthSyncResponse>;
};
//# sourceMappingURL=health.queries.d.ts.map
