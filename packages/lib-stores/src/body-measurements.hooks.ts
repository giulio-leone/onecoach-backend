'use client';

/**
 * Body Measurements Realtime Hook
 *
 * Hook for real-time synchronization of body measurements.
 * Updates both React Query cache and Zustand store on Postgres changes.
 *
 * Pattern follows use-maxes-realtime.ts
 */

import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from './realtime.hooks';
import { useBodyMeasurementsStore } from './body-measurements.store';
import type { BodyMeasurement } from '@giulio-leone/types/analytics';

import { logger } from '@giulio-leone/lib-core';
// Query keys for body measurements
export const bodyMeasurementsKeys = {
  all: ['body-measurements'] as const,
  list: (userId?: string) => [...bodyMeasurementsKeys.all, 'list', userId] as const,
  latest: (userId?: string) => [...bodyMeasurementsKeys.all, 'latest', userId] as const,
  detail: (measurementId: string) => [...bodyMeasurementsKeys.all, 'detail', measurementId] as const,
};

/**
 * Transform raw database record to BodyMeasurement type
 */
function transformMeasurement(record: Record<string, unknown>): BodyMeasurement {
  return {
    id: record.id as string,
    userId: record.userId as string,
    date: record.date ? new Date(record.date as string) : new Date(),
    weight: record.weight ? Number(record.weight) : undefined,
    bodyFat: record.bodyFat ? Number(record.bodyFat) : undefined,
    muscleMass: record.muscleMass ? Number(record.muscleMass) : undefined,
    chest: record.chest ? Number(record.chest) : undefined,
    waist: record.waist ? Number(record.waist) : undefined,
    hips: record.hips ? Number(record.hips) : undefined,
    thigh: record.thigh ? Number(record.thigh) : undefined,
    arm: record.arm ? Number(record.arm) : undefined,
    calf: record.calf ? Number(record.calf) : undefined,
    neck: record.neck ? Number(record.neck) : undefined,
    shoulders: record.shoulders ? Number(record.shoulders) : undefined,
    height: record.height ? Number(record.height) : undefined,
    visceralFat: record.visceralFat ? Number(record.visceralFat) : undefined,
    waterPercentage: record.waterPercentage ? Number(record.waterPercentage) : undefined,
    boneMass: record.boneMass ? Number(record.boneMass) : undefined,
    metabolicAge: record.metabolicAge ? Number(record.metabolicAge) : undefined,
    bmr: record.bmr ? Number(record.bmr) : undefined,
    notes: (record.notes as string) ?? undefined,
    photos: (record.photos as string[]) ?? [],
    createdAt: record.createdAt ? new Date(record.createdAt as string).toISOString() : new Date().toISOString(),
    updatedAt: record.updatedAt ? new Date(record.updatedAt as string).toISOString() : new Date().toISOString(),
  };
}

interface UseBodyMeasurementsRealtimeOptions {
  /** User ID to filter measurements by */
  userId?: string;
  /** Enable/disable subscription */
  enabled?: boolean;
}

/**
 * Hook for real-time sync of body measurements list.
 * Updates both React Query cache and Zustand store.
 */
export function useBodyMeasurementsRealtime({
  userId,
  enabled = true,
}: UseBodyMeasurementsRealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const {
    handleRealtimeInsert,
    handleRealtimeUpdate,
    handleRealtimeDelete,
  } = useBodyMeasurementsStore();

  useRealtimeSubscription<Record<string, unknown>>({
    table: 'body_measurements',
    filter: userId ? `userId=eq.${userId}` : undefined,
    enabled: enabled && !!userId,
    onInsert: (record) => {
      const measurement = transformMeasurement(record);

      // Update React Query cache
      queryClient.setQueryData<BodyMeasurement[]>(
        bodyMeasurementsKeys.list(userId),
        (old) => {
          if (!old) return [measurement];
          // Insert at beginning (newest first)
          return [measurement, ...old];
        }
      );

      // Update Zustand store
      handleRealtimeInsert(measurement);

      // Also invalidate latest query
      queryClient.invalidateQueries({
        queryKey: bodyMeasurementsKeys.latest(userId),
      });
    },
    onUpdate: (record) => {
      const measurement = transformMeasurement(record);

      // Update React Query cache
      queryClient.setQueryData<BodyMeasurement[]>(
        bodyMeasurementsKeys.list(userId),
        (old) => {
          if (!old) return [measurement];
          return old.map((m: any) => (m.id === measurement.id ? measurement : m));
        }
      );

      // Update Zustand store
      handleRealtimeUpdate(measurement);

      // Invalidate latest query
      queryClient.invalidateQueries({
        queryKey: bodyMeasurementsKeys.latest(userId),
      });
    },
    onDelete: (record) => {
      const measurementId = record.id as string;

      // Update React Query cache
      queryClient.setQueryData<BodyMeasurement[]>(
        bodyMeasurementsKeys.list(userId),
        (old) => {
          if (!old) return [];
          return old.filter((m: any) => m.id !== measurementId);
        }
      );

      // Update Zustand store
      handleRealtimeDelete(measurementId);

      // Invalidate latest query
      queryClient.invalidateQueries({
        queryKey: bodyMeasurementsKeys.latest(userId),
      });
    },
    onError: (error) => {
      logger.error('[BodyMeasurements Realtime] Error:', error);
    },
  });
}

/**
 * Combined hook for all body measurements realtime functionality.
 * Use this in _app or layout to enable realtime sync.
 */
export function useAllBodyMeasurementsRealtime(userId?: string) {
  useBodyMeasurementsRealtime({ userId, enabled: !!userId });
}
