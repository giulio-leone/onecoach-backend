/**
 * Maxes Store
 *
 * Gestione centralizzata dei massimali (1RM) con Zustand.
 * I tipi sono importati da @giulio-leone/types per SSOT.
 *
 * FUNZIONALITÀ:
 * - CRUD completo massimali
 * - Storico versioni per ogni massimale
 * - Integrazione Realtime Supabase
 * - Selettori ottimizzati
 */

'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Visibility } from '@prisma/client';

import { logger } from '@giulio-leone/lib-core/logger.service';

// ============================================================================
// Types (no legacy imports)
// ============================================================================

export interface Max {
  id: string;
  exerciseId: string;
  exerciseName: string;
  oneRepMax: number;
  notes: string | null;
  version: number;
  lastUpdated: string;
  createdAt: string;
  visibility?: Visibility;
  assignedToUserId?: string;
  assignedByCoachId?: string;
}

export interface MaxVersion {
  id: string;
  maxId: string;
  oneRepMax: number;
  notes: string | null;
  version: number;
  createdAt: string;
}

export interface CreateMaxInput {
  exerciseId: string;
  oneRepMax: number;
  notes?: string | null;
  visibility?: Visibility;
  assignedToUserId?: string;
}

export interface UpdateMaxInput {
  oneRepMax?: number;
  notes?: string | null;
  visibility?: Visibility;
  assignedToUserId?: string;
}

// ============================================================================
// State & Actions
// ============================================================================

export interface MaxesState {
  /** Mappa dei massimali per exerciseId */
  maxes: Map<string, Max>;
  /** Storico versioni per exerciseId */
  history: Map<string, MaxVersion[]>;
  /** ExerciseId selezionato per il modal storia */
  selectedExerciseId: string | null;
  /** Modal storia aperto */
  isHistoryModalOpen: boolean;
  /** Modal aggiungi/modifica aperto */
  isEditModalOpen: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Loading history */
  isLoadingHistory: boolean;
  /** Errore */
  error: string | null;
}

export interface MaxesActions {
  // Data management
  setMaxes: (maxes: Max[]) => void;
  addMax: (max: Max) => void;
  updateMax: (exerciseId: string, data: Partial<Max>) => void;
  removeMax: (exerciseId: string) => void;

  // History
  setHistory: (exerciseId: string, versions: MaxVersion[]) => void;
  clearHistory: (exerciseId: string) => void;

  // UI state
  openHistoryModal: (exerciseId: string) => void;
  closeHistoryModal: () => void;
  openEditModal: (exerciseId?: string) => void;
  closeEditModal: () => void;

  // Loading & error
  setLoading: (isLoading: boolean) => void;
  setLoadingHistory: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Realtime handlers
  handleRealtimeInsert: (record: Max) => void;
  handleRealtimeUpdate: (record: Max) => void;
  handleRealtimeDelete: (record: { exerciseId: string }) => void;

  // Reset
  reset: () => void;
}

export type MaxesStore = MaxesState & MaxesActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: MaxesState = {
  maxes: new Map(),
  history: new Map(),
  selectedExerciseId: null,
  isHistoryModalOpen: false,
  isEditModalOpen: false,
  isLoading: false,
  isLoadingHistory: false,
  error: null,
};

// ============================================================================
// Store
// ============================================================================

export const useMaxesStore = create<MaxesStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Data management
      setMaxes: (maxes) => {
        const maxesMap = new Map<string, Max>();
        maxes.forEach((max: any) => {
          maxesMap.set(max.exerciseId, max);
        });
        set({ maxes: maxesMap, error: null });
      },

      addMax: (max) => {
        const { maxes } = get();
        const newMaxes = new Map(maxes);
        newMaxes.set(max.exerciseId, max);
        set({ maxes: newMaxes });
      },

      updateMax: (exerciseId, data) => {
        const { maxes } = get();
        const existing = maxes.get(exerciseId);
        if (!existing) return;

        const newMaxes = new Map(maxes);
        newMaxes.set(exerciseId, { ...existing, ...data });
        set({ maxes: newMaxes });
      },

      removeMax: (exerciseId) => {
        const { maxes, history } = get();
        const newMaxes = new Map(maxes);
        const newHistory = new Map(history);
        newMaxes.delete(exerciseId);
        newHistory.delete(exerciseId);
        set({ maxes: newMaxes, history: newHistory });
      },

      // History
      setHistory: (exerciseId, versions) => {
        const { history } = get();
        const newHistory = new Map(history);
        newHistory.set(exerciseId, versions);
        set({ history: newHistory, isLoadingHistory: false });
      },

      clearHistory: (exerciseId) => {
        const { history } = get();
        const newHistory = new Map(history);
        newHistory.delete(exerciseId);
        set({ history: newHistory });
      },

      // UI state
      openHistoryModal: (exerciseId) => {
        set({ selectedExerciseId: exerciseId, isHistoryModalOpen: true });
      },

      closeHistoryModal: () => {
        set({ selectedExerciseId: null, isHistoryModalOpen: false });
      },

      openEditModal: (exerciseId) => {
        set({ selectedExerciseId: exerciseId ?? null, isEditModalOpen: true });
      },

      closeEditModal: () => {
        set({ selectedExerciseId: null, isEditModalOpen: false });
      },

      // Loading & error
      setLoading: (isLoading) => set({ isLoading }),
      setLoadingHistory: (isLoadingHistory) => set({ isLoadingHistory }),
      setError: (error) => set({ error, isLoading: false }),

      // Realtime handlers
      handleRealtimeInsert: (record) => {
        const { addMax } = get();
        addMax(record);

        if (process.env.NODE_ENV === 'development') {
          logger.warn('[MaxesStore] Realtime INSERT', { exerciseName: record.exerciseName });
        }
      },

      handleRealtimeUpdate: (record) => {
        const { updateMax } = get();
        updateMax(record.exerciseId, record);

        if (process.env.NODE_ENV === 'development') {
          logger.warn('[MaxesStore] Realtime UPDATE', { exerciseName: record.exerciseName });
        }
      },

      handleRealtimeDelete: (record) => {
        const { removeMax } = get();
        removeMax(record.exerciseId);

        if (process.env.NODE_ENV === 'development') {
          logger.warn('[MaxesStore] Realtime DELETE', { exerciseId: record.exerciseId });
        }
      },

      // Reset
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'MaxesStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

/** Ottieni tutti i massimali come array */
export const selectMaxesList = (state: MaxesStore): Max[] => Array.from(state.maxes.values());

/** Ottieni massimale per exerciseId */
export const selectMaxByExerciseId = (state: MaxesStore, exerciseId: string): Max | undefined =>
  state.maxes.get(exerciseId);

/** Ottieni storico per exerciseId */
export const selectHistoryByExerciseId = (state: MaxesStore, exerciseId: string): MaxVersion[] =>
  state.history.get(exerciseId) ?? [];

/** Ottieni il massimale selezionato */
export const selectSelectedMax = (state: MaxesStore): Max | undefined =>
  state.selectedExerciseId ? state.maxes.get(state.selectedExerciseId) : undefined;

/** Controlla se ci sono massimali */
export const selectHasMaxes = (state: MaxesStore): boolean => state.maxes.size > 0;

/** Numero totale massimali */
export const selectMaxesCount = (state: MaxesStore): number => state.maxes.size;

/** Massimali ordinati per nome esercizio */
export const selectMaxesSortedByName = (state: MaxesStore): Max[] =>
  Array.from(state.maxes.values()).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

/** Massimali ordinati per peso (decrescente) */
export const selectMaxesSortedByWeight = (state: MaxesStore): Max[] =>
  Array.from(state.maxes.values()).sort((a, b) => b.oneRepMax - a.oneRepMax);

/** Massimali ordinati per data aggiornamento (più recenti prima) */
export const selectMaxesSortedByDate = (state: MaxesStore): Max[] =>
  Array.from(state.maxes.values()).sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );

// ============================================================================
// Hooks helper
// ============================================================================

/** Hook per ottenere un massimale specifico */
export const useMax = (exerciseId: string) => useMaxesStore((state) => state.maxes.get(exerciseId));

/** Hook per ottenere lo storico di un massimale */
export const useMaxHistory = (exerciseId: string) =>
  useMaxesStore((state) => state.history.get(exerciseId) ?? []);

/** Hook per lo stato di loading */
export const useMaxesLoading = () => useMaxesStore((state) => state.isLoading);

/** Hook per l'errore */
export const useMaxesError = () => useMaxesStore((state) => state.error);

// ============================================================================
// Debug helper
// ============================================================================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { __MaxesStore: typeof useMaxesStore }).__MaxesStore = useMaxesStore;
}
