/**
 * API Client Factory
 *
 * Web/SSR API client. For React Native, use '@giulio-leone/lib-api-client/native'.
 */

import { WebApiClient } from './core/web-client';
import { LoggingInterceptor } from './interceptors';

// Create web client
const apiClient = new WebApiClient();

// Add logging interceptor in development
if (process.env.NODE_ENV === 'development') {
  apiClient.use(new LoggingInterceptor());
}

export { apiClient };
export { WebApiClient } from './core';
// NativeApiClient is intentionally NOT exported here - import from '@giulio-leone/lib-api-client/native' for React Native
export * from './core/types';
export * from './interceptors';
