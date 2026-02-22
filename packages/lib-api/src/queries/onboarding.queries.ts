/**
 * Onboarding Query Keys and Functions
 *
 * Standardized query keys and query functions for onboarding queries
 */

import type { OnboardingProgress } from '@giulio-leone/lib-stores/onboarding.store';

/**
 * Onboarding API response
 */
export interface OnboardingResponse {
  success: boolean;
  progress: OnboardingProgress;
  error?: string;
}

/**
 * Complete step payload
 */
export interface CompleteStepPayload {
  stepNumber: number;
  skipped: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Go to step payload
 */
export interface GoToStepPayload {
  stepNumber: number;
}

/**
 * Query keys for onboarding queries
 */
export const onboardingKeys = {
  all: ['onboarding'] as const,
  progress: () => [...onboardingKeys.all, 'progress'] as const,
} as const;

/**
 * Query functions for onboarding
 */
export const onboardingQueries = {
  /**
   * Get onboarding progress
   */
  getProgress: async (): Promise<OnboardingProgress> => {
    const response = await fetch('/api/onboarding');

    if (response.status === 401) {
      // User not authenticated, return default progress
      throw new Error('UNAUTHENTICATED');
    }

    if (!response.ok) {
      let errorMessage = 'Failed to fetch onboarding progress';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (_error: unknown) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as OnboardingResponse;

    if (!data.success || !data.progress) {
      throw new Error(data.error || 'Invalid response from onboarding API');
    }

    return data.progress;
  },

  /**
   * Complete a step
   */
  completeStep: async (payload: CompleteStepPayload): Promise<OnboardingProgress> => {
    const response = await fetch('/api/onboarding/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to complete step';
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.error ||
          errorData.message ||
          errorData.details?.fieldErrors?.[0] ||
          errorMessage;
      } catch (_error: unknown) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as OnboardingResponse;

    if (!data.success || !data.progress) {
      throw new Error(data.error || 'Invalid response from onboarding API');
    }

    return data.progress;
  },

  /**
   * Go to a specific step
   */
  goToStep: async (payload: GoToStepPayload): Promise<OnboardingProgress> => {
    const response = await fetch('/api/onboarding/go-to-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to navigate to step';
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.error ||
          errorData.message ||
          errorData.details?.fieldErrors?.[0] ||
          errorMessage;
      } catch (_error: unknown) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as OnboardingResponse;

    if (!data.success || !data.progress) {
      throw new Error(data.error || 'Invalid response from onboarding API');
    }

    return data.progress;
  },

  /**
   * Reset onboarding
   */
  reset: async (): Promise<OnboardingProgress> => {
    const response = await fetch('/api/onboarding/reset', {
      method: 'POST',
    });

    if (!response.ok) {
      let errorMessage = 'Failed to reset onboarding';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (error: unknown) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as OnboardingResponse;

    if (!data.success || !data.progress) {
      throw new Error(data.error || 'Invalid response from onboarding API');
    }

    return data.progress;
  },

  /**
   * Complete all steps
   */
  completeAll: async (): Promise<OnboardingProgress> => {
    const response = await fetch('/api/onboarding/complete-all', {
      method: 'POST',
    });

    if (!response.ok) {
      let errorMessage = 'Failed to complete all steps';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (error: unknown) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as OnboardingResponse;

    if (!data.success || !data.progress) {
      throw new Error(data.error || 'Invalid response from onboarding API');
    }

    return data.progress;
  },
};
