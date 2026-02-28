/**
 * Catalog Store
 *
 * Zustand store for caching exercises and foods catalog.
 * Invalidated only when new items are added or modified.
 *
 * PERFORMANCE: Avoids expensive DB queries on every Copilot request.
 * The AI can quickly lookup exercises/foods by name from this cache.
 *
 * @example
 * ```tsx
 * // Initialize on app startup
 * const { fetchExercises, fetchFoods } = useCatalogStore.getState();
 * await Promise.all([fetchExercises(), fetchFoods()]);
 *
 * // Invalidate when adding new item
 * useCatalogStore.getState().invalidate('exercises');
 *
 * // Read catalog (fast, from cache)
 * const exercises = useCatalogStore.getState().exercises;
 * const match = exercises.find(e => e.name.toLowerCase().includes('squat'));
 * ```
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

/**
 * Lightweight catalog exercise - only fields needed for AI lookup
 */
export interface CatalogExercise {
  id: string;
  name: string;
  nameIt?: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
}

/**
 * Lightweight catalog food - only fields needed for AI lookup
 */
export interface CatalogFood {
  id: string;
  name: string;
  nameIt?: string;
  category?: string;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
}

/**
 * Catalog store state
 */
interface CatalogState {
  // Data
  exercises: CatalogExercise[];
  foods: CatalogFood[];
  
  // Cache metadata
  exercisesLastFetched: number;
  foodsLastFetched: number;
  
  // Loading state
  isLoadingExercises: boolean;
  isLoadingFoods: boolean;
  
  // Actions
  fetchExercises: () => Promise<void>;
  fetchFoods: () => Promise<void>;
  invalidate: (type: 'exercises' | 'foods' | 'both') => void;
  
  // Lookup helpers for AI
  findExerciseByName: (name: string) => CatalogExercise | undefined;
  findFoodByName: (name: string) => CatalogFood | undefined;
  searchExercises: (query: string, limit?: number) => CatalogExercise[];
  searchFoods: (query: string, limit?: number) => CatalogFood[];
}

// ============================================================================
// Store
// ============================================================================

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes default TTL

export const useCatalogStore = create<CatalogState>((set, get) => ({
  // Initial state
  exercises: [],
  foods: [],
  exercisesLastFetched: 0,
  foodsLastFetched: 0,
  isLoadingExercises: false,
  isLoadingFoods: false,

  // Fetch exercises from API with cache
  fetchExercises: async () => {
    const state = get();
    const now = Date.now();
    
    // Skip if cache is fresh
    if (state.exercises.length > 0 && now - state.exercisesLastFetched < CACHE_TTL_MS) {
      return;
    }
    
    // Skip if already loading
    if (state.isLoadingExercises) return;
    
    set({ isLoadingExercises: true });
    
    try {
      const response = await fetch('/api/exercises/catalog');
      if (!response.ok) throw new Error('Failed to fetch exercises');
      
      const data = await response.json();
      
      set({
        exercises: data.exercises ?? [],
        exercisesLastFetched: Date.now(),
        isLoadingExercises: false,
      });
    } catch (error) {
      console.error('[CatalogStore] Failed to fetch exercises:', error);
      set({ isLoadingExercises: false });
    }
  },

  // Fetch foods from API with cache
  fetchFoods: async () => {
    const state = get();
    const now = Date.now();
    
    // Skip if cache is fresh
    if (state.foods.length > 0 && now - state.foodsLastFetched < CACHE_TTL_MS) {
      return;
    }
    
    // Skip if already loading
    if (state.isLoadingFoods) return;
    
    set({ isLoadingFoods: true });
    
    try {
      const response = await fetch('/api/foods/catalog');
      if (!response.ok) throw new Error('Failed to fetch foods');
      
      const data = await response.json();
      
      set({
        foods: data.foods ?? [],
        foodsLastFetched: Date.now(),
        isLoadingFoods: false,
      });
    } catch (error) {
      console.error('[CatalogStore] Failed to fetch foods:', error);
      set({ isLoadingFoods: false });
    }
  },

  // Invalidate cache
  invalidate: (type) => {
    if (type === 'exercises' || type === 'both') {
      set({ exercisesLastFetched: 0 });
    }
    if (type === 'foods' || type === 'both') {
      set({ foodsLastFetched: 0 });
    }
  },

  // Lookup helpers for AI
  findExerciseByName: (name: string) => {
    const normalizedName = name.toLowerCase().trim();
    return get().exercises.find((e: any) =>
        e.name.toLowerCase() === normalizedName ||
        e.nameIt?.toLowerCase() === normalizedName
    );
  },

  findFoodByName: (name: string) => {
    const normalizedName = name.toLowerCase().trim();
    return get().foods.find((f: any) =>
        f.name.toLowerCase() === normalizedName ||
        f.nameIt?.toLowerCase() === normalizedName
    );
  },

  searchExercises: (query: string, limit = 10) => {
    const normalizedQuery = query.toLowerCase().trim();
    return get()
      .exercises.filter((e: any) =>
          e.name.toLowerCase().includes(normalizedQuery) ||
          e.nameIt?.toLowerCase().includes(normalizedQuery) ||
          e.muscleGroups.some((m: any) => m.toLowerCase().includes(normalizedQuery)) ||
          e.equipment.some((eq: any) => eq.toLowerCase().includes(normalizedQuery))
      )
      .slice(0, limit);
  },

  searchFoods: (query: string, limit = 10) => {
    const normalizedQuery = query.toLowerCase().trim();
    return get()
      .foods.filter((f: any) =>
          f.name.toLowerCase().includes(normalizedQuery) ||
          f.nameIt?.toLowerCase().includes(normalizedQuery) ||
          f.category?.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, limit);
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectExercises = (state: CatalogState) => state.exercises;
export const selectFoods = (state: CatalogState) => state.foods;
export const selectIsLoadingCatalog = (state: CatalogState) =>
  state.isLoadingExercises || state.isLoadingFoods;

// ============================================================================
// Utility: Get catalog for AI context
// ============================================================================

/**
 * Get lightweight catalog data for AI context injection.
 * Returns only names and IDs to minimize token usage.
 */
export function getCatalogForAI(): {
  exercises: Array<{ id: string; name: string; muscles: string[] }>;
  foods: Array<{ id: string; name: string }>;
} {
  const state = useCatalogStore.getState();
  
  return {
    exercises: state.exercises.map((e: any) => ({
      id: e.id,
      name: e.name,
      muscles: e.muscleGroups,
    })),
    foods: state.foods.map((f: any) => ({
      id: f.id,
      name: f.name,
    })),
  };
}
