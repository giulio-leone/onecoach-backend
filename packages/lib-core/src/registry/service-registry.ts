/**
 * Service Registry Core
 *
 * Central registry per dependency injection.
 * Extracted to its own file to avoid circular imports between
 * index.ts (re-exports registerAllServices) and register-services.ts (uses registerService).
 */

import type {
  INutritionService,
  IWorkoutService,
  IExerciseService,
  IFoodService,
  IAnalyticsService,
  ICreditService,
  ISubscriptionService,
  IUserProfileService,
  IPaymentService,
  IOnboardingService,
  IChatService,
  IMarketplaceService,
  ICoachService,
} from '@giulio-leone/lib-shared';

export type ServiceKey =
  | 'nutrition'
  | 'workout'
  | 'exercise'
  | 'food'
  | 'analytics'
  | 'credit'
  | 'subscription'
  | 'userProfile'
  | 'payment'
  | 'onboarding'
  | 'chat'
  | 'marketplace'
  | 'coach';

export type ServiceMap = {
  nutrition: INutritionService;
  workout: IWorkoutService;
  exercise: IExerciseService;
  food: IFoodService;
  analytics: IAnalyticsService;
  credit: ICreditService;
  subscription: ISubscriptionService;
  userProfile: IUserProfileService;
  payment: IPaymentService;
  onboarding: IOnboardingService;
  chat: IChatService;
  marketplace: IMarketplaceService;
  coach: ICoachService;
};

class ServiceRegistry {
  private services = new Map<ServiceKey, unknown>();

  register<K extends ServiceKey>(key: K, service: ServiceMap[K]): void {
    this.services.set(key, service);
  }

  get<K extends ServiceKey>(key: K): ServiceMap[K] {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service '${key}' not registered`);
    }
    return service as ServiceMap[K];
  }

  has(key: ServiceKey): boolean {
    return this.services.has(key);
  }

  unregister(key: ServiceKey): void {
    this.services.delete(key);
  }

  reset(): void {
    this.services.clear();
  }
}

export const serviceRegistry = new ServiceRegistry();

export function getService<K extends ServiceKey>(key: K): ServiceMap[K] {
  return serviceRegistry.get(key);
}

export function registerService<K extends ServiceKey>(key: K, service: ServiceMap[K]): void {
  serviceRegistry.register(key, service);
}
