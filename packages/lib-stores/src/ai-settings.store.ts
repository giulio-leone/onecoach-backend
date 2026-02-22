/**
 * AI Settings Store
 *
 * Centralized state for AI Settings admin page.
 * Caches tab data to prevent reloads when switching tabs.
 * 
 * Types imported from @giulio-leone/types/ai (SSOT).
 */

'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  AISettingsModel,
  AISettingsFeatureConfig,
  AISettingsModelAccess,
  AISettingsFrameworkConfig,
  AISettingsSectionId,
} from '@giulio-leone/types/ai';

// Re-export types for consumers
export type {
  AISettingsModel,
  AISettingsFeatureConfig,
  AISettingsModelAccess,
  AISettingsFrameworkConfig,
  AISettingsSectionId,
};

// Alias for backward compatibility
export type SectionId = AISettingsSectionId;

// ============================================================================
// State Interface
// ============================================================================

interface AISettingsState {
  // Core data (cached across tab switches)
  models: AISettingsModel[];
  featureConfigs: AISettingsFeatureConfig[];
  modelAccess: AISettingsModelAccess[];
  frameworkConfigs: AISettingsFrameworkConfig[];

  // UI state
  activeSection: AISettingsSectionId;
  visitedTabs: Set<AISettingsSectionId>;
  isInitialized: boolean;

  // Actions
  setModels: (models: AISettingsModel[]) => void;
  updateModel: (id: string, data: Partial<AISettingsModel>) => void;
  setFeatureConfigs: (configs: AISettingsFeatureConfig[]) => void;
  updateFeature: (id: string, data: Partial<AISettingsFeatureConfig>) => void;
  setModelAccess: (access: AISettingsModelAccess[]) => void;
  updateModelAccess: (modelId: string, role: string, canSelect: boolean, models: AISettingsModel[]) => void;
  setFrameworkConfigs: (configs: AISettingsFrameworkConfig[]) => void;
  setActiveSection: (section: AISettingsSectionId) => void;
  markTabVisited: (section: AISettingsSectionId) => void;
  initialize: (props: {
    models: AISettingsModel[];
    featureConfigs: AISettingsFeatureConfig[];
    modelAccess: AISettingsModelAccess[];
    frameworkConfigs: AISettingsFrameworkConfig[];
    initialSection?: AISettingsSectionId;
  }) => void;
  reset: () => void;
}

// ============================================================================
// Default State
// ============================================================================

const defaultState = {
  models: [] as AISettingsModel[],
  featureConfigs: [] as AISettingsFeatureConfig[],
  modelAccess: [] as AISettingsModelAccess[],
  frameworkConfigs: [] as AISettingsFrameworkConfig[],
  activeSection: 'overview' as AISettingsSectionId,
  visitedTabs: new Set<AISettingsSectionId>(['overview']),
  isInitialized: false,
};

// ============================================================================
// Store
// ============================================================================

export const useAISettingsStore = create<AISettingsState>()(
  devtools(
    (set, get) => ({
      ...defaultState,

      setModels: (models) => set({ models }),

      updateModel: (id, data) =>
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id === id) return { ...m, ...data };
            // If setting as default, unset others
            if (data.isDefault) return { ...m, isDefault: false };
            return m;
          }),
        })),

      setFeatureConfigs: (featureConfigs) => set({ featureConfigs }),

      updateFeature: (id, data) =>
        set((state) => ({
          featureConfigs: state.featureConfigs.map((f) =>
            f.id === id ? { ...f, ...data } : f
          ),
        })),

      setModelAccess: (modelAccess) => set({ modelAccess }),

      updateModelAccess: (modelId, role, canSelect, models) =>
        set((state) => {
          const existing = state.modelAccess.find(
            (a) => a.modelId === modelId && a.role === role
          );
          if (existing) {
            return {
              modelAccess: state.modelAccess.map((a) =>
                a.id === existing.id ? { ...a, canSelect } : a
              ),
            };
          }
          const modelName = models.find((m) => m.id === modelId)?.displayName || '';
          return {
            modelAccess: [
              ...state.modelAccess,
              {
                id: `temp-${Date.now()}`,
                modelId,
                role: role as AISettingsModelAccess['role'],
                canSelect,
                modelName,
              },
            ],
          };
        }),

      setFrameworkConfigs: (frameworkConfigs) => set({ frameworkConfigs }),

      setActiveSection: (section) =>
        set((state) => ({
          activeSection: section,
          visitedTabs: new Set([...state.visitedTabs, section]),
        })),

      markTabVisited: (section) =>
        set((state) => ({
          visitedTabs: new Set([...state.visitedTabs, section]),
        })),

      initialize: (props) => {
        const current = get();
        // Only initialize once, or if explicitly reset
        if (current.isInitialized) return;

        set({
          models: props.models,
          featureConfigs: props.featureConfigs,
          modelAccess: props.modelAccess,
          frameworkConfigs: props.frameworkConfigs,
          activeSection: props.initialSection || 'overview',
          visitedTabs: new Set([props.initialSection || 'overview']),
          isInitialized: true,
        });
      },

      reset: () => set(defaultState),
    }),
    { name: 'AISettingsStore' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectActiveSection = (state: AISettingsState) => state.activeSection;
export const selectVisitedTabs = (state: AISettingsState) => state.visitedTabs;
export const selectIsInitialized = (state: AISettingsState) => state.isInitialized;
export const selectModels = (state: AISettingsState) => state.models;
export const selectFeatureConfigs = (state: AISettingsState) => state.featureConfigs;
export const selectModelAccess = (state: AISettingsState) => state.modelAccess;
export const selectFrameworkConfigs = (state: AISettingsState) => state.frameworkConfigs;
