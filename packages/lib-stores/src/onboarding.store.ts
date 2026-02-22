/**
 * Onboarding Store
 *
 * Manages onboarding progress and wizard state
 * Replaces OnboardingContext with a simpler solution
 */

'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { OnboardingProgress } from '@giulio-leone/constants';
export type { OnboardingProgress };

/**
 * Onboarding step completion
 * Kept for internal store logic if needed, or we can remove if unused.
 * But let's keep it compatible with the constant type.
 */
export interface OnboardingStepCompletion {
  stepNumber: number;
  completedAt: Date;
  skipped: boolean;
  metadata?: Record<string, unknown>;
}

// Remove local OnboardingProgress interface since we import it

/**
 * Onboarding state interface
 */
export interface OnboardingState {
  progress: OnboardingProgress | null;
  isLoading: boolean;
  error: string | null;
  isWizardOpen: boolean;
}

/**
 * Onboarding actions interface
 */
export interface OnboardingActions {
  setProgress: (progress: OnboardingProgress | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setWizardOpen: (open: boolean) => void;
  toggleWizard: () => void;
  completeStep: (stepNumber: number, metadata?: Record<string, unknown>) => void;
  skipStep: (stepNumber: number) => void;
  goToStep: (stepNumber: number) => void;
  reset: () => void;
}

/**
 * Combined store type
 */
export type OnboardingStore = OnboardingState & OnboardingActions;

/**
 * Initial state
 */
const initialState: OnboardingState = {
  progress: null,
  isLoading: false,
  error: null,
  isWizardOpen: false,
};

/**
 * Onboarding Store
 *
 * Note: The actual API calls should be handled by TanStack Query
 * This store only manages the UI state and progress data
 */
export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setProgress: (progress) => set({ progress }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setWizardOpen: (isWizardOpen) => set({ isWizardOpen }),

      toggleWizard: () =>
        set((state) => ({
          isWizardOpen: !state.isWizardOpen,
        })),

      completeStep: (stepNumber, _metadata) =>
        set((state) => {
          if (!state.progress) return state;

          return {
            progress: {
              ...state.progress,
              currentStep: stepNumber + 1,
              completedSteps: {
                ...state.progress.completedSteps,
                [stepNumber]: true,
              },
              // We might need to update other fields like lastInteraction
            },
          };
        }),

      skipStep: (stepNumber) =>
        set((state) => {
          if (!state.progress) return state;

          return {
            progress: {
              ...state.progress,
              currentStep: stepNumber + 1,
              skippedSteps: {
                ...state.progress.skippedSteps,
                [stepNumber]: true,
              },
            },
          };
        }),

      goToStep: (stepNumber) =>
        set((state) => {
          if (!state.progress) return state;

          return {
            progress: {
              ...state.progress,
              currentStep: stepNumber,
            },
          };
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'OnboardingStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
