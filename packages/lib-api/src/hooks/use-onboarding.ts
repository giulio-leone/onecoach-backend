/**
 * Onboarding React Query Hooks
 *
 * Custom hooks for onboarding queries and mutations
 * Integrates with Zustand store for UI state
 */

'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingKeys, onboardingQueries } from '../queries/onboarding.queries';
import { useOnboardingStore } from '@giulio-leone/lib-stores/onboarding.store';
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
export function useOnboardingProgress(options?: { enabled?: boolean }) {
  const setProgress = useOnboardingStore((state) => state.setProgress);
  const setLoading = useOnboardingStore((state) => state.setLoading);
  const setError = useOnboardingStore((state) => state.setError);

  const query = useQuery({
    queryKey: onboardingKeys.progress(),
    queryFn: onboardingQueries.getProgress,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false, // Evita refetch non necessari
    refetchOnMount: false, // Usa cache se disponibile
  });

  // Sincronizza con Zustand store in un singolo effect
  useEffect(() => {
    if (query.data) {
      setProgress(query.data);
      setLoading(false);
      setError(null);
    } else if (query.error) {
      setError(query.error instanceof Error ? query.error.message : 'Unknown error');
      setLoading(false);
    } else if (query.isLoading) {
      setLoading(true);
    }
  }, [query.data, query.error, query.isLoading, setProgress, setLoading, setError]);

  return query;
}

/**
 * Hook to complete a step
 */
export function useCompleteStep() {
  const queryClient = useQueryClient();
  const setProgress = useOnboardingStore((state) => state.setProgress);
  const setLoading = useOnboardingStore((state) => state.setLoading);
  const setError = useOnboardingStore((state) => state.setError);

  return useMutation({
    mutationFn: (payload: CompleteStepPayload) => onboardingQueries.completeStep(payload),
    onMutate: () => {
      // Imposta loading state durante la mutazione
      setLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.progress(), data);
      setProgress(data);
      setLoading(false);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    },
  });
}

/**
 * Hook to skip a step
 */
export function useSkipStep() {
  const { mutate, ...rest } = useCompleteStep();

  return {
    mutate: (stepNumber: number) => mutate({ stepNumber, skipped: true }),
    ...rest,
  };
}

/**
 * Hook to go to a specific step
 */
export function useGoToStep() {
  const queryClient = useQueryClient();
  const setProgress = useOnboardingStore((state) => state.setProgress);
  const setLoading = useOnboardingStore((state) => state.setLoading);
  const setError = useOnboardingStore((state) => state.setError);

  return useMutation({
    mutationFn: (payload: GoToStepPayload) => onboardingQueries.goToStep(payload),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.progress(), data);
      setProgress(data);
      setLoading(false);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    },
  });
}

/**
 * Hook to reset onboarding
 */
export function useResetOnboarding() {
  const queryClient = useQueryClient();
  const setProgress = useOnboardingStore((state) => state.setProgress);
  const setWizardOpen = useOnboardingStore((state) => state.setWizardOpen);
  const setLoading = useOnboardingStore((state) => state.setLoading);
  const setError = useOnboardingStore((state) => state.setError);

  return useMutation({
    mutationFn: onboardingQueries.reset,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.progress(), data);
      setProgress(data);
      setWizardOpen(true); // Reopen wizard after reset
      setLoading(false);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    },
  });
}

/**
 * Hook to complete all steps
 */
export function useCompleteAllSteps() {
  const queryClient = useQueryClient();
  const setProgress = useOnboardingStore((state) => state.setProgress);
  const setWizardOpen = useOnboardingStore((state) => state.setWizardOpen);
  const setLoading = useOnboardingStore((state) => state.setLoading);
  const setError = useOnboardingStore((state) => state.setError);

  return useMutation({
    mutationFn: onboardingQueries.completeAll,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.progress(), data);
      setProgress(data);
      setWizardOpen(false); // Close wizard after completing all
      setLoading(false);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    },
  });
}

/**
 * Hook to check if onboarding is completed
 * Usa lo Zustand store invece di fare fetch
 */
export function useIsOnboardingCompleted(): boolean {
  const progress = useOnboardingStore((state) => state.progress);
  return progress?.isCompleted ?? false;
}

/**
 * Hook to get current onboarding step
 * Usa lo Zustand store invece di fare fetch
 */
export function useCurrentOnboardingStep(): number {
  const progress = useOnboardingStore((state) => state.progress);
  return progress?.currentStep ?? 1;
}
