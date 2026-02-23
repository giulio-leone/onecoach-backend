import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

interface NavigationState {
  // Storage generico per stati di form/pagine
  // Key: identificativo univoco della rotta/feature (es: 'nutrition-builder-draft')
  // Value: qualsiasi oggetto serializzabile
  states: Record<string, unknown>;

  // Actions
  saveState: <T>(key: string, state: T) => void;
  getState: <T>(key: string) => T | undefined;
  clearState: (key: string) => void;
  clearAll: () => void;
}

export const useNavigationStateStore = create<NavigationState>()(
  devtools(
    persist(
      (set, get) => ({
        states: {},

        saveState: (key, state) => {
          set((prev) => ({
            states: {
              ...prev.states,
              [key]: state,
            },
          }));
        },

        getState: (key) => {
          return get().states[key];
        },

        clearState: (key) => {
          set((prev) => {
            // Creiamo una copia shallow
            const newStates = { ...prev.states };
            // Eliminiamo la chiave
            delete newStates[key];
            return { states: newStates };
          });
        },

        clearAll: () => {
          set({ states: {} });
        },
      }),
      {
        name: 'navigation-storage', // nome univoco per il localStorage/sessionStorage
        storage: createJSONStorage(() => sessionStorage), // Usa sessionStorage (reset alla chiusura tab)
        partialize: (state) => ({ states: state.states }), // Persisti solo l'oggetto states
      }
    ),
    { name: 'NavigationStateStore' }
  )
);
