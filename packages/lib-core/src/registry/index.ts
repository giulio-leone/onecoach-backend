/**
 * @giulio-leone/lib-core/registry
 *
 * Service registry per dependency injection
 * Permette swap di implementazioni (test, mock, alternative)
 */

export { serviceRegistry, getService, registerService } from './service-registry';
export type { ServiceKey, ServiceMap } from './service-registry';
export { registerAllServices } from './register-services';
