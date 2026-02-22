/**
 * @giulio-leone/api-core
 *
 * API routes per il dominio core (auth, profile, onboarding, payments, subscriptions, credits, invitations, policies, health, iap)
 * Esporta route handlers che possono essere usati in apps/next/app/api/*
 */

// Auth routes
export { POST as authRegisterPOST } from './routes/auth/register/route';
export { POST as authPasswordRequestPOST } from './routes/auth/password/request/route';
export { POST as authPasswordConfirmPOST } from './routes/auth/password/confirm/route';

// Profile routes
export { GET as profileGET, PUT as profilePUT } from './routes/profile/route';
export { GET as profileMaxesGET, POST as profileMaxesPOST } from './routes/profile/maxes/route';
export {
  GET as profileMaxesByExerciseGET,
  DELETE as profileMaxesByExerciseDELETE,
} from './routes/profile/maxes/[catalogExerciseId]/route';
export { GET as profileMaxesVersionsGET } from './routes/profile/maxes/[catalogExerciseId]/versions/route';
export {
  GET as profileTaxInfoGET,
  PUT as profileTaxInfoPUT,
} from './routes/profile/tax-info/route';

// Onboarding routes
export { GET as onboardingGET } from './routes/onboarding/route';
export { POST as onboardingCompleteStepPOST } from './routes/onboarding/complete-step/route';
export { POST as onboardingCompleteAllPOST } from './routes/onboarding/complete-all/route';
export { POST as onboardingGoToStepPOST } from './routes/onboarding/go-to-step/route';
export { POST as onboardingResetPOST } from './routes/onboarding/reset/route';

// Payments routes
export { POST as paymentsIntentPOST } from './routes/payments/intent/route';
export { POST as paymentsConfirmPOST } from './routes/payments/confirm/route';

// Subscriptions routes
export { POST as subscriptionsCreatePOST } from './routes/subscriptions/create/route';
export {
  GET as subscriptionsManageGET,
  PUT as subscriptionsManagePUT,
  DELETE as subscriptionsManageDELETE,
} from './routes/subscriptions/manage/route';
export { POST as subscriptionsSetupIntentPOST } from './routes/subscriptions/setup-intent/route';

// Credits routes
export { GET as creditsBalanceGET } from './routes/credits/balance/route';
export { GET as creditsHistoryGET } from './routes/credits/history/route';

// Invitations routes
export { POST as invitationsValidatePOST } from './routes/invitations/validate/route';

// Policies routes
export { GET as policiesBySlugGET } from './routes/policies/[slug]/route';

// Health routes
export { GET as healthSummaryGET } from './routes/health/summary/route';
export { POST as healthSyncPOST } from './routes/health/sync/route';

// IAP routes
export { GET as iapSubscriptionStatusGET } from './routes/iap/subscription-status/route';
export { POST as iapVerifyReceiptPOST } from './routes/iap/verify-receipt/route';
export { POST as iapRestorePurchasesPOST } from './routes/iap/restore-purchases/route';
