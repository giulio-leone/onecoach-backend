'use client';

/**
 * Body Measurements Store
 *
 * Zustand store for managing body measurement state with Realtime sync.
 * Each measurement entry is a version, providing built-in history.
 *
 * SSOT: Types imported from @giulio-leone/types
 */

import { create } from 'zustand';
import type { BodyMeasurement } from '@giulio-leone/types/analytics';

interface BodyMeasurementsState {
  /** All measurements (sorted by date, newest first) */
  measurements: BodyMeasurement[];
  /** Latest measurement (convenience accessor) */
  latest: BodyMeasurement | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

interface BodyMeasurementsActions {
  /** Set all measurements (from initial fetch) */
  setMeasurements: (measurements: BodyMeasurement[]) => void;
  /** Handle Realtime INSERT */
  handleRealtimeInsert: (measurement: BodyMeasurement) => void;
  /** Handle Realtime UPDATE */
  handleRealtimeUpdate: (measurement: BodyMeasurement) => void;
  /** Handle Realtime DELETE */
  handleRealtimeDelete: (measurementId: string) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Reset store */
  reset: () => void;
}

type BodyMeasurementsStore = BodyMeasurementsState & BodyMeasurementsActions;

const initialState: BodyMeasurementsState = {
  measurements: [],
  latest: null,
  isLoading: false,
  error: null,
};

/**
 * Helper to sort measurements by date (newest first) and extract latest
 */
function processAndSort(measurements: BodyMeasurement[]): {
  sorted: BodyMeasurement[];
  latest: BodyMeasurement | null;
} {
  const sorted = [...measurements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return {
    sorted,
    latest: sorted[0] ?? null,
  };
}

export const useBodyMeasurementsStore = create<BodyMeasurementsStore>((set) => ({
  ...initialState,

  setMeasurements: (measurements) => {
    const { sorted, latest } = processAndSort(measurements);
    set({ measurements: sorted, latest, isLoading: false, error: null });
  },

  handleRealtimeInsert: (measurement) => {
    set((state) => {
      const newMeasurements = [measurement, ...state.measurements];
      const { sorted, latest } = processAndSort(newMeasurements);
      return { measurements: sorted, latest };
    });
  },

  handleRealtimeUpdate: (measurement) => {
    set((state) => {
      const newMeasurements = state.measurements.map((m: any) =>
        m.id === measurement.id ? measurement : m
      );
      const { sorted, latest } = processAndSort(newMeasurements);
      return { measurements: sorted, latest };
    });
  },

  handleRealtimeDelete: (measurementId) => {
    set((state) => {
      const newMeasurements = state.measurements.filter((m: any) => m.id !== measurementId);
      const { sorted, latest } = processAndSort(newMeasurements);
      return { measurements: sorted, latest };
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

// Selectors
export const selectLatestMeasurement = (state: BodyMeasurementsStore) => state.latest;
export const selectAllMeasurements = (state: BodyMeasurementsStore) => state.measurements;
export const selectMeasurementsLoading = (state: BodyMeasurementsStore) => state.isLoading;
