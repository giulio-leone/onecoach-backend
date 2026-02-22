/**
 * Body Measurements Query Keys and Functions
 *
 * Standardized query keys and query functions for body measurements queries
 */

import type { BodyMeasurement } from '@giulio-leone/types';

/**
 * Query keys for body measurements queries
 */
export const bodyMeasurementsKeys = {
  all: ['body-measurements'] as const,
  lists: () => [...bodyMeasurementsKeys.all, 'list'] as const,
  list: (filters?: BodyMeasurementsFilters) => [...bodyMeasurementsKeys.lists(), filters] as const,
  details: () => [...bodyMeasurementsKeys.all, 'detail'] as const,
  detail: (id: string) => [...bodyMeasurementsKeys.details(), id] as const,
} as const;

/**
 * Filters for body measurements list
 */
export interface BodyMeasurementsFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
  latest?: boolean;
}

/**
 * Body measurements list response
 */
export interface BodyMeasurementsListResponse {
  success: boolean;
  measurements: BodyMeasurement[];
  stats?: BodyMeasurementStats | null;
}

/**
 * Body measurements stats
 */
export interface BodyMeasurementStats {
  weightChange?: number;
  bodyFatChange?: number;
  muscleMassChange?: number;
  averageWeight?: number;
  averageBodyFat?: number;
  averageMuscleMass?: number;
}

/**
 * Single body measurement response
 */
export interface BodyMeasurementResponse {
  success: boolean;
  measurement: BodyMeasurement;
}

/**
 * Create body measurement input
 */
export type CreateBodyMeasurementInput = Omit<
  BodyMeasurement,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

/**
 * Update body measurement input
 */
export type UpdateBodyMeasurementInput = Partial<
  Omit<BodyMeasurement, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

/**
 * Query functions for body measurements
 */
export const bodyMeasurementsQueries = {
  /**
   * Get body measurements list
   */
  list: async (filters?: BodyMeasurementsFilters): Promise<BodyMeasurement[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.latest) params.append('latest', 'true');

    const url = `/api/analytics/body-measurements${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('UNAUTHENTICATED');
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        (payload && typeof payload === 'object' && 'error' in payload
          ? (payload as { error?: string }).error
          : null) || 'Failed to fetch body measurements';
      throw new Error(message);
    }

    const payload = await response.json();
    const data = payload as BodyMeasurementsListResponse;

    return data.measurements || [];
  },

  /**
   * Get single body measurement by ID
   */
  detail: async (id: string): Promise<BodyMeasurement> => {
    const response = await fetch(`/api/analytics/body-measurements/${id}`, {
      credentials: 'include',
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('UNAUTHENTICATED');
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        (payload && typeof payload === 'object' && 'error' in payload
          ? (payload as { error?: string }).error
          : null) || 'Failed to fetch body measurement';
      throw new Error(message);
    }

    const payload = await response.json();
    const data = payload as BodyMeasurementResponse;

    return data.measurement;
  },

  /**
   * Create body measurement
   */
  create: async (input: CreateBodyMeasurementInput): Promise<BodyMeasurement> => {
    const response = await fetch('/api/analytics/body-measurements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      credentials: 'include',
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        (payload && typeof payload === 'object' && 'error' in payload
          ? (payload as { error?: string }).error
          : null) || 'Failed to create body measurement';
      throw new Error(message);
    }

    const payload = await response.json();
    const data = payload as BodyMeasurementResponse;

    return data.measurement;
  },

  /**
   * Update body measurement
   */
  update: async (id: string, input: UpdateBodyMeasurementInput): Promise<BodyMeasurement> => {
    const response = await fetch(`/api/analytics/body-measurements/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      credentials: 'include',
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        (payload && typeof payload === 'object' && 'error' in payload
          ? (payload as { error?: string }).error
          : null) || 'Failed to update body measurement';
      throw new Error(message);
    }

    const payload = await response.json();
    const data = payload as BodyMeasurementResponse;

    return data.measurement;
  },

  /**
   * Delete body measurement
   */
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/analytics/body-measurements/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        (payload && typeof payload === 'object' && 'error' in payload
          ? (payload as { error?: string }).error
          : null) || 'Failed to delete body measurement';
      throw new Error(message);
    }
  },
};
