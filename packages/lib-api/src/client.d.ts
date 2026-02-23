/**
 * API Client Factory
 *
 * Crea l'istanza corretta di API client basata sulla piattaforma
 */
import { WebApiClient } from './core/web-client';
import { NativeApiClient } from './core/native-client';
declare const apiClient: NativeApiClient | WebApiClient;
export { apiClient };
export { WebApiClient, NativeApiClient } from './core';
export * from './core/types';
export * from './interceptors';
//# sourceMappingURL=client.d.ts.map
