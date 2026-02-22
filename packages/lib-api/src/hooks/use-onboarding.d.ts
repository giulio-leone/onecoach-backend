/**
 * Onboarding React Query Hooks
 *
 * Custom hooks for onboarding queries and mutations
 * Integrates with Zustand store for UI state
 */
import type { CompleteStepPayload, GoToStepPayload } from '../queries/onboarding.queries';
/**
 * Hook to get onboarding progress
 *
 * Automatically syncs with Zustand store for UI state
 *
 * IMPORTANTE: Questo hook dovrebbe essere chiamato UNA SOLA VOLTA nel tree React,
 * preferibilmente in OnboardingLayoutWrapper. Altri componenti dovrebbero usare
 * direttamente lo Zustand store.
 */
export declare function useOnboardingProgress(options?: {
    enabled?: boolean;
}): import("@tanstack/react-query").UseQueryResult<import("@giulio-leone/constants").OnboardingProgress, Error>;
/**
 * Hook to complete a step
 */
export declare function useCompleteStep(): import("@tanstack/react-query").UseMutationResult<import("@giulio-leone/constants").OnboardingProgress, Error, CompleteStepPayload, void>;
/**
 * Hook to skip a step
 */
export declare function useSkipStep(): {
    data: undefined;
    variables: undefined;
    error: null;
    isError: false;
    isIdle: true;
    isPending: false;
    isSuccess: false;
    status: "idle";
    reset: () => void;
    context: void | undefined;
    failureCount: number;
    failureReason: Error | null;
    isPaused: boolean;
    submittedAt: number;
    mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<import("@giulio-leone/constants").OnboardingProgress, Error, CompleteStepPayload, void>;
    mutate: (stepNumber: number) => void;
} | {
    data: undefined;
    variables: CompleteStepPayload;
    error: null;
    isError: false;
    isIdle: false;
    isPending: true;
    isSuccess: false;
    status: "pending";
    reset: () => void;
    context: void | undefined;
    failureCount: number;
    failureReason: Error | null;
    isPaused: boolean;
    submittedAt: number;
    mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<import("@giulio-leone/constants").OnboardingProgress, Error, CompleteStepPayload, void>;
    mutate: (stepNumber: number) => void;
} | {
    data: undefined;
    error: Error;
    variables: CompleteStepPayload;
    isError: true;
    isIdle: false;
    isPending: false;
    isSuccess: false;
    status: "error";
    reset: () => void;
    context: void | undefined;
    failureCount: number;
    failureReason: Error | null;
    isPaused: boolean;
    submittedAt: number;
    mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<import("@giulio-leone/constants").OnboardingProgress, Error, CompleteStepPayload, void>;
    mutate: (stepNumber: number) => void;
} | {
    data: import("@giulio-leone/constants").OnboardingProgress;
    error: null;
    variables: CompleteStepPayload;
    isError: false;
    isIdle: false;
    isPending: false;
    isSuccess: true;
    status: "success";
    reset: () => void;
    context: void | undefined;
    failureCount: number;
    failureReason: Error | null;
    isPaused: boolean;
    submittedAt: number;
    mutateAsync: import("@tanstack/react-query").UseMutateAsyncFunction<import("@giulio-leone/constants").OnboardingProgress, Error, CompleteStepPayload, void>;
    mutate: (stepNumber: number) => void;
};
/**
 * Hook to go to a specific step
 */
export declare function useGoToStep(): import("@tanstack/react-query").UseMutationResult<import("@giulio-leone/constants").OnboardingProgress, Error, GoToStepPayload, void>;
/**
 * Hook to reset onboarding
 */
export declare function useResetOnboarding(): import("@tanstack/react-query").UseMutationResult<import("@giulio-leone/constants").OnboardingProgress, Error, void, void>;
/**
 * Hook to complete all steps
 */
export declare function useCompleteAllSteps(): import("@tanstack/react-query").UseMutationResult<import("@giulio-leone/constants").OnboardingProgress, Error, void, void>;
/**
 * Hook to check if onboarding is completed
 * Usa lo Zustand store invece di fare fetch
 */
export declare function useIsOnboardingCompleted(): boolean;
/**
 * Hook to get current onboarding step
 * Usa lo Zustand store invece di fare fetch
 */
export declare function useCurrentOnboardingStep(): number;
//# sourceMappingURL=use-onboarding.d.ts.map