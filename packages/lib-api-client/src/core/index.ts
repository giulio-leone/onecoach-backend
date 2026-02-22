/**
 * API Client Core
 */

export { BaseApiClient } from './base-client';
export { WebApiClient } from './web-client';
// NativeApiClient is NOT exported here to prevent @giulio-leone/lib-core.native from being imported in web/SSR contexts.
// For native usage, import directly from './native-client' or use the '@giulio-leone/lib-api-client/native' entry point.
export * from './types';
