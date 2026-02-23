/**
 * Health Native Hooks
 *
 * Hooks for React Native/Expo that handle native Health Kit/Connect integration
 * Combines Zustand store + native APIs + TanStack Query
 */
import { type HealthSummary } from '@giulio-leone/lib-stores/health.store';
import type { HealthDataType } from '../queries/health.queries';
/**
 * Hook to initialize and manage Health Kit/Connect
 * Replaces HealthProvider context
 */
export declare function useHealth(): {
  permissions: import('@giulio-leone/lib-stores/health.store').HealthPermissions | null;
  requestPermissions: () => Promise<boolean>;
  hasAllPermissions: () => boolean;
  syncStatus: import('@giulio-leone/lib-stores/health.store').SyncStatus;
  syncHealthData: (dataTypes?: HealthDataType[]) => Promise<void>;
  healthSummary: HealthSummary | null;
  isAvailable: boolean;
  platform: import('@giulio-leone/lib-stores/health.store').HealthPlatform | null;
  isAutoSyncEnabled: boolean;
  getHealthData: (
    _dataType: HealthDataType,
    _startDate: Date,
    _endDate: Date
  ) => Promise<unknown[]>;
};
//# sourceMappingURL=use-health-native.d.ts.map
