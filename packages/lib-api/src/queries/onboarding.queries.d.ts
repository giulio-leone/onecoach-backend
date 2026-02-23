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
export declare const onboardingKeys: {
  readonly all: readonly ['onboarding'];
  readonly progress: () => readonly ['onboarding', 'progress'];
};
/**
 * Query functions for onboarding
 */
export declare const onboardingQueries: {
  /**
   * Get onboarding progress
   */
  getProgress: () => Promise<OnboardingProgress>;
  /**
   * Complete a step
   */
  completeStep: (payload: CompleteStepPayload) => Promise<OnboardingProgress>;
  /**
   * Go to a specific step
   */
  goToStep: (payload: GoToStepPayload) => Promise<OnboardingProgress>;
  /**
   * Reset onboarding
   */
  reset: () => Promise<OnboardingProgress>;
  /**
   * Complete all steps
   */
  completeAll: () => Promise<OnboardingProgress>;
};
//# sourceMappingURL=onboarding.queries.d.ts.map
