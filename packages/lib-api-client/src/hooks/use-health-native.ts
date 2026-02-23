/**
 * Health Native Hooks
 *
 * Hooks for React Native/Expo that handle native Health Kit/Connect integration
 * Combines Zustand store + native APIs + TanStack Query
 */

'use client';

import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleHealthKit from 'react-native-health';
import {
  initialize,
  requestPermission,
  SdkAvailabilityStatus,
  getSdkStatus,
} from 'react-native-health-connect';
import {
  useHealthStore,
  useHealthSync,
  useHealthSummary,
  type HealthSummary,
  type HealthPermissions,
  type SyncStatus,
} from '@giulio-leone/lib-stores/health.store';
import { useSyncHealthData, useHealthSummaryQuery } from './use-health';
import { useAuthStore } from '@giulio-leone/lib-stores/auth.store';
import type { HealthDataType } from '../queries/health.queries';
import {
  APPLE_HEALTH_PERMISSIONS,
  ANDROID_HEALTH_PERMISSIONS,
  HEALTH_DATA_TYPES,
  DEFAULT_SYNC_DAYS,
  HEALTH_STORAGE_KEYS,
} from '@giulio-leone/constants';
import { logger } from '@giulio-leone/lib-shared';
import { getErrorMessage } from '@giulio-leone/lib-shared';

/**
 * Hook to initialize and manage Health Kit/Connect
 * Replaces HealthProvider context
 */
export function useHealth() {
  const store = useHealthStore();
  const { syncStatus, setSyncStatus } = useHealthSync();
  const { healthSummary } = useHealthSummary();
  const { mutate: syncHealthDataMutation } = useSyncHealthData();
  const { data: summaryData } = useHealthSummaryQuery();
  const user = useAuthStore((state) => state.user);

  // Initialize health kit/connect on mount
  useEffect(() => {
    initializeHealthKit();
    loadSettings();
  }, []);

  // Update store when summary query data changes
  useEffect(() => {
    if (summaryData) {
      store.setHealthSummary(summaryData as HealthSummary);
    } else {
      store.setHealthSummary({
        steps: {
          today: 0,
          week: 0,
          lastSync: null,
        },
        heartRate: {
          latest: null,
          average: null,
          lastSync: null,
        },
        activeCalories: {
          today: 0,
          week: 0,
          lastSync: null,
        },
        weight: {
          latest: null,
          trend: null,
          lastSync: null,
        },
        workouts: {
          count: 0,
          totalMinutes: 0,
          lastSync: null,
        },
      });
    }
  }, [summaryData, store]);

  const initializeHealthKit = async () => {
    try {
      if (Platform.OS === 'ios') {
        AppleHealthKit.initHealthKit(APPLE_HEALTH_PERMISSIONS as never, (error) => {
          if (error) {
            logger.error('HealthKit initialization error', error);
            store.setIsAvailable(false);
          } else {
            logger.info('HealthKit initialized successfully');
            store.setIsAvailable(true);
            store.setPlatform('ios');
            checkPermissions();
          }
        });
      } else if (Platform.OS === 'android') {
        const status = await getSdkStatus();
        if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
          await initialize();
          logger.info('Health Connect initialized successfully');
          store.setIsAvailable(true);
          store.setPlatform('android');
          checkPermissions();
        } else {
          logger.warn('Health Connect not available');
          store.setIsAvailable(false);
        }
      }
    } catch (error: unknown) {
      logger.error('Health initialization error', error);
      store.setIsAvailable(false);
    }
  };

  const loadSettings = async () => {
    try {
      const autoSyncStr = await AsyncStorage.getItem(HEALTH_STORAGE_KEYS.AUTO_SYNC_ENABLED);
      const lastSyncStr = await AsyncStorage.getItem(HEALTH_STORAGE_KEYS.LAST_SYNC_TIME);

      if (autoSyncStr) {
        store.setIsAutoSyncEnabled(JSON.parse(autoSyncStr));
      }

      if (lastSyncStr) {
        setSyncStatus((prev: SyncStatus) => ({
          ...prev,
          lastSyncTime: new Date(lastSyncStr),
        }));
      }
    } catch (error: unknown) {
      logger.error('Error loading health settings', error);
    }
  };

  const checkPermissions = async () => {
    try {
      const perms = {
        steps: false,
        heartRate: false,
        activeCalories: false,
        weight: false,
        workout: false,
      };

      if (Platform.OS === 'ios') {
        // For iOS, we assume permissions are granted after successful init
        perms.steps = true;
        perms.heartRate = true;
        perms.activeCalories = true;
        perms.weight = true;
        perms.workout = true;
      } else if (Platform.OS === 'android') {
        const granted = await requestPermission(ANDROID_HEALTH_PERMISSIONS as never);
        const hasPermission = Array.isArray(granted) && granted.length > 0;
        perms.steps = hasPermission;
        perms.heartRate = hasPermission;
        perms.activeCalories = hasPermission;
        perms.weight = hasPermission;
        perms.workout = hasPermission;
      }

      store.setPermissions(perms as HealthPermissions);
      await AsyncStorage.setItem(HEALTH_STORAGE_KEYS.PERMISSIONS_GRANTED, JSON.stringify(perms));
    } catch (error: unknown) {
      logger.error('Error checking permissions', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await requestPermission(ANDROID_HEALTH_PERMISSIONS as never);
        if (Array.isArray(granted) && granted.length > 0) {
          await checkPermissions();
          return true;
        }
        return false;
      }

      // iOS permissions are requested during init
      await checkPermissions();
      return true;
    } catch (error: unknown) {
      logger.error('Error requesting permissions', error);
      return false;
    }
  };

  const hasAllPermissions = (): boolean => {
    if (!store.permissions) return false;
    return Object.values(store.permissions).every((granted) => granted);
  };

  const getHealthData = async (
    _dataType: HealthDataType,
    _startDate: Date,
    _endDate: Date
  ): Promise<unknown[]> => {
    // This would need to be implemented with native Health Kit/Connect APIs
    // For now, return empty array
    return [];
  };

  const syncHealthData = async (dataTypes: HealthDataType[] = HEALTH_DATA_TYPES): Promise<void> => {
    if (!user || !hasAllPermissions()) {
      logger.warn('Cannot sync: not authenticated or permissions not granted');
      return;
    }

    setSyncStatus((prev: SyncStatus) => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - DEFAULT_SYNC_DAYS);

      const dataRequests = await Promise.all(
        dataTypes.map(async (dataType) => {
          const data = await getHealthData(dataType, startDate, endDate);
          return {
            dataType,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            data,
          };
        })
      );

      const syncRequest = {
        userId: user.id,
        platform: store.platform!,
        dataRequests,
        syncTimestamp: new Date().toISOString(),
      };

      syncHealthDataMutation(syncRequest);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      logger.error('Health sync error', error, { errorMessage });
      setSyncStatus((prev: SyncStatus) => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage,
      }));
    }
  };

  return {
    permissions: store.permissions,
    requestPermissions,
    hasAllPermissions,
    syncStatus,
    syncHealthData,
    healthSummary: healthSummary || store.healthSummary,
    isAvailable: store.isAvailable,
    platform: store.platform,
    isAutoSyncEnabled: store.isAutoSyncEnabled,
    getHealthData,
  };
}
