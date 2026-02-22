/**
 * @giulio-leone/lib-registry
 *
 * Service registry per dependency injection
 * Permette swap di implementazioni (test, mock, alternative)
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
} from '@giulio-leone/contracts';

/**
 * Service registry type
 */
type ServiceKey =
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

type ServiceMap = {
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

/**
 * Service Registry
 *
 * Central registry per iniettare servizi
 * Pattern: getService<INutritionService>('nutrition')
 */
class ServiceRegistry {
  private services = new Map<ServiceKey, unknown>();

  /**
   * Registra un servizio
   */
  register<K extends ServiceKey>(key: K, service: ServiceMap[K]): void {
    this.services.set(key, service);
  }

  /**
   * Ottiene un servizio
   */
  get<K extends ServiceKey>(key: K): ServiceMap[K] {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service '${key}' not registered`);
    }
    return service as ServiceMap[K];
  }

  /**
   * Verifica se un servizio è registrato
   */
  has(key: ServiceKey): boolean {
    return this.services.has(key);
  }

  /**
   * Rimuove un servizio
   */
  unregister(key: ServiceKey): void {
    this.services.delete(key);
  }

  /**
   * Resetta il registry (utile per test)
   */
  reset(): void {
    this.services.clear();
  }
}

/**
 * Singleton instance
 */
export const serviceRegistry = new ServiceRegistry();

/**
 * Helper function per ottenere un servizio
 */
export function getService<K extends ServiceKey>(key: K): ServiceMap[K] {
  return serviceRegistry.get(key);
}

/**
 * Helper function per registrare un servizio
 */
export function registerService<K extends ServiceKey>(key: K, service: ServiceMap[K]): void {
  serviceRegistry.register(key, service);
}

/**
 * Re-export registration function
 */
export { registerAllServices } from './register-services';
