/**
 * @giulio-leone/lib-core
 *
 * Servizi core (auth, credit, subscription, prisma, profile, payment, onboarding)
 * Implementa contratti da @giulio-leone/contracts
 */

// Re-export ID generation utility
export { createId } from '@paralleldrive/cuid2';

export * from './prisma';
export * from './db';
export * from './user-memory.service';
export * from './user-memory/types';
export * from './user-memory/listeners';
export * from './user-memory/timeline.service';
export * from './stripe';
export * from './stripe/index';
export * from './credit.service';
export { creditService } from './credit.service';
export * from './subscription.service';
export { subscriptionService } from './subscription.service';
export { initSubscriptionService } from './subscription-init';
export * from './auth';
export * from './user-profile.service';
export { userProfileService } from './user-profile.service';
export * from './payment.service';
export { paymentService } from './payment.service';
export * from './onboarding.service';
export { onboardingService } from './onboarding.service';
export * from './user/onboarding-profile.service';
export * from './calendar.service';
export * from './invitation.service';
export * from './consent.service';
export * from './policy.service';
export * from './setup-intent.service';
export * from './edge-config.service';
export * from './feature-flags.service';
export * from './feature-flags.evaluator';
export * from './iap-verification.server';
export * from './direct-messaging.service';
export * from './logger.service';
export * from './types/safe-types';
export * from './ai/provider-factory';
export * from './ai-generation.service';
export * from './config/env';
export * from './versioning';
export * from './rate-limit';
export * from './create-import-route';
export * from './supabase-client';

// Merged from lib-coach
export * from './coach';
// Merged from lib-metadata
export * from './metadata';
// Merged from lib-vercel-admin
export * from './vercel-admin';
// Merged from lib-analytics
export * from './analytics';

// Marketplace services (merged from lib-marketplace)
export * from './marketplace';

// Platform Abstraction Layer (Hexagonal Architecture)
export { PlatformFactory } from './platform';
export type { DeployPlatform } from './platform';
export type {
  ConfigProvider,
  ConfigProviderWriteResult,
  FeatureFlagsProvider,
  FlagDefinition,
  CronProvider,
  CronJob,
} from './platform/ports';
