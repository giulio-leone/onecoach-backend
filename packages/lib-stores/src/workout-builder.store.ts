/**
 * Workout Builder Store
 *
 * Gestisce lo stato del builder workout con UI state locale e
 * integrazione Supabase Realtime.
 */

import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { WorkoutProgram } from '@giulio-leone/types/workout';
import type { SupabaseClient } from '@supabase/supabase-js';

import { logger } from '@giulio-leone/lib-core';
// Dependencies interface
interface WorkoutBuilderDependencies {
  workoutApi: {
    getById: (id: string) => Promise<{ program: WorkoutProgram }>;
    update: (id: string, data: unknown) => Promise<{ program: WorkoutProgram }>;
  };
  supabase?: SupabaseClient;
}

// SSOT Types
interface WorkoutBuilderState {
  // Dependencies (injected)
  dependencies: WorkoutBuilderDependencies | null;

  // State
  activeProgram: WorkoutProgram | null;
  isLoading: boolean;
  isSaving: boolean;
  isRealtimeConnected: boolean;

  // UI State (Local)
  selectedWeekIndex: number;
  selectedDayIndex: number;
  viewMode: 'editor' | 'statistics' | 'progression';

  // Actions
  configure: (dependencies: WorkoutBuilderDependencies) => void;
  init: (programId: string) => Promise<void>;
  setProgram: (program: WorkoutProgram) => void;
  updateProgram: (updates: Partial<WorkoutProgram>) => void;
  cleanup: () => void;

  // UI Actions
  setSelectedWeek: (index: number) => void;
  setSelectedDay: (index: number) => void;
  setViewMode: (mode: 'editor' | 'statistics' | 'progression') => void;
}

export const useWorkoutBuilderStore = create<WorkoutBuilderState>()(
  persist(
    immer((set, get) => ({
      // Initial State
      dependencies: null,
        activeProgram: null,
        isLoading: false,
        isSaving: false,
        isRealtimeConnected: false,
        selectedWeekIndex: 0,
        selectedDayIndex: 0,
        viewMode: 'editor',

        // Configure dependencies
        configure: (dependencies: WorkoutBuilderDependencies) => {
          set({ dependencies });
        },

        // Actions
        init: async (programId: string) => {
          const { dependencies } = get();
          if (!dependencies) {
            logger.error('WorkoutBuilderStore: Dependencies not configured. Call configure() first.');
            return;
          }

          set({ isLoading: true });
          try {
            const response = await dependencies.workoutApi.getById(programId);
            set({ activeProgram: response.program });

            // Initialize Supabase Realtime subscription if available
            if (dependencies.supabase) {
              dependencies.supabase
                .channel(`workout-program:${programId}`)
                .on(
                  'postgres_changes',
                  {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'workout_programs',
                    filter: `id=eq.${programId}`,
                  },
                  (payload) => {
                    // Update program when changed externally
                    const currentProgram = get().activeProgram;
                    if (currentProgram && currentProgram.id === programId) {
                      set({ activeProgram: { ...currentProgram, ...payload.new } });
                    }
                  }
                )
                .subscribe();

              set({ isRealtimeConnected: true });
            }
          } catch (error) {
            logger.error('WorkoutBuilderStore.init error:', error);
          } finally {
            set({ isLoading: false });
          }
        },

        cleanup: () => {
          const { dependencies } = get();
          if (dependencies?.supabase) {
            // Unsubscribe from all channels
            dependencies.supabase.removeAllChannels();
          }
          set({ activeProgram: null, isRealtimeConnected: false });
        },

        setProgram: (program: WorkoutProgram) => {
          set({ activeProgram: program });
        },

        updateProgram: async (updates: Partial<WorkoutProgram>) => {
          const currentProgram = get().activeProgram;
          if (!currentProgram) return;

          const { dependencies } = get();
          if (!dependencies) {
            logger.error('WorkoutBuilderStore: Dependencies not configured. Call configure() first.');
            return;
          }

          // Optimistic Update
          set((state) => {
            if (state.activeProgram) {
              Object.assign(state.activeProgram, updates);
            }
            state.isSaving = true;
          });

          // Autosave with debouncing would be handled by the caller
          try {
            const response = await dependencies.workoutApi.update(currentProgram.id, updates);
            set({ activeProgram: response.program, isSaving: false });
          } catch (error) {
            logger.error('WorkoutBuilderStore.updateProgram error:', error);
            // Revert optimistic update on error
            set({ activeProgram: currentProgram, isSaving: false });
          }
        },

        // UI Actions
        setSelectedWeek: (index: number) => set({ selectedWeekIndex: index }),
        setSelectedDay: (index: number) => set({ selectedDayIndex: index }),
        setViewMode: (mode: 'editor' | 'statistics' | 'progression') => set({ viewMode: mode }),
      })),
      {
        name: 'workout-builder-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          selectedWeekIndex: state.selectedWeekIndex,
          selectedDayIndex: state.selectedDayIndex,
          viewMode: state.viewMode,
        }),
      }
    )
  ) as UseBoundStore<StoreApi<WorkoutBuilderState>> | any; // forced cast to avoid complex middleware typing issues
