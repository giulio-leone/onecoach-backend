/**
 * Onboarding Store
 *
 * Manages onboarding progress and wizard state
 * Replaces OnboardingContext with a simpler solution
 */
import type { OnboardingProgress } from '@giulio-leone/lib-shared';
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
 * Onboarding Store
 *
 * Note: The actual API calls should be handled by TanStack Query
 * This store only manages the UI state and progress data
 */
export declare const useOnboardingStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<OnboardingStore>, "setState" | "devtools"> & {
    setState(partial: OnboardingStore | Partial<OnboardingStore> | ((state: OnboardingStore) => OnboardingStore | Partial<OnboardingStore>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: OnboardingStore | ((state: OnboardingStore) => OnboardingStore), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}>;
//# sourceMappingURL=onboarding.store.d.ts.map