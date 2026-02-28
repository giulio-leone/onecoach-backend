/**
 * AI Models Store
 *
 * Zustand store per gestione centralizzata dei modelli AI.
 * SSOT (Single Source of Truth) per:
 * - Lista modelli disponibili
 * - Modello selezionato
 * - Mapping ID database -> modelId API
 *
 * PRINCIPI: KISS, SOLID, DRY
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface AIModel {
    /** Database primary key (CUID) */
    id: string;
    /** Actual model identifier for API calls (e.g., 'x-ai/grok-4.1-fast') */
    modelId: string;
    /** Provider name (e.g., 'openrouter', 'anthropic') */
    provider: string;
    /** Display name for UI */
    displayName: string;
    /** Optional description */
    description?: string | null;
    /** Supports vision/images */
    supportsVision?: boolean;
    /** Supports tool calling */
    supportsTools?: boolean;
}

// ============================================================================
// State & Actions
// ============================================================================

interface AIModelsState {
    /** Available AI models loaded from server */
    models: AIModel[];
    /** Currently selected model's database ID */
    selectedModelId: string | null;
    /** Loading state for models fetch */
    isLoading: boolean;
    /** Last error message */
    error: string | null;
}

interface AIModelsActions {
    /** Set available models (called after fetching from server) */
    setModels: (models: AIModel[]) => void;
    /** Select a model by its database ID */
    selectModel: (databaseId: string | null) => void;
    /** Set loading state */
    setLoading: (loading: boolean) => void;
    /** Set error message */
    setError: (error: string | null) => void;
    /** Reset store to initial state */
    reset: () => void;
}

type AIModelsStore = AIModelsState & AIModelsActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: AIModelsState = {
    models: [],
    selectedModelId: null,
    isLoading: false,
    error: null,
};

// ============================================================================
// Store
// ============================================================================

export const useAIModelsStore = create<AIModelsStore>()(
    devtools(
        (set) => ({
            ...initialState,

            setModels: (models) => set({ models, error: null }, false, 'setModels'),

            selectModel: (databaseId) =>
                set({ selectedModelId: databaseId }, false, 'selectModel'),

            setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

            setError: (error) => set({ error, isLoading: false }, false, 'setError'),

            reset: () => set(initialState, false, 'reset'),
        }),
        {
            name: 'AIModelsStore',
            enabled: process.env.NODE_ENV === 'development',
        }
    )
);

// ============================================================================
// Selectors (per ottimizzare re-render)
// ============================================================================

/** Get all available models */
export const selectModels = (state: AIModelsStore) => state.models;

/** Get selected model's database ID */
export const selectSelectedModelId = (state: AIModelsStore) => state.selectedModelId;

/** Get the full selected model object */
export const selectSelectedModel = (state: AIModelsStore): AIModel | null => {
    if (!state.selectedModelId) return null;
    return state.models.find((m: any) => m.id === state.selectedModelId) ?? null;
};

/**
 * Get the actual model identifier for API calls.
 * This is the key selector that converts database ID to API model name.
 */
export const selectSelectedModelName = (state: AIModelsStore): string | null => {
    const model = selectSelectedModel(state);
    return model?.modelId ?? null;
};

/** Get the provider of the selected model */
export const selectSelectedProvider = (state: AIModelsStore): string | null => {
    const model = selectSelectedModel(state);
    return model?.provider ?? null;
};

/** Check if models are loading */
export const selectIsLoading = (state: AIModelsStore) => state.isLoading;

/** Get error message if any */
export const selectError = (state: AIModelsStore) => state.error;

// ============================================================================
// Utility Hooks (convenience wrappers)
// ============================================================================

/**
 * Hook to get the selected model name for API calls.
 * Use this in components that need to send the model to the API.
 */
export const useSelectedModelName = () => useAIModelsStore(selectSelectedModelName);

/**
 * Hook to get the selected model object.
 */
export const useSelectedModel = () => useAIModelsStore(selectSelectedModel);

/**
 * Hook to get available models.
 */
export const useAvailableModels = () => useAIModelsStore(selectModels);
