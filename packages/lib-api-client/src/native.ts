/**
 * Native API Client Entry Point
 *
 * This is the entry point for React Native apps.
 * Import from '@giulio-leone/lib-api-client/native' in React Native.
 */

import { NativeApiClient } from './core/native-client';
import { LoggingInterceptor } from './interceptors';

// Create native client
const nativeApiClient = new NativeApiClient();

// Add logging interceptor in development
if (process.env.NODE_ENV === 'development') {
  nativeApiClient.use(new LoggingInterceptor());
}

export { nativeApiClient as apiClient };
export { NativeApiClient } from './core/native-client';
export { BaseApiClient } from './core/base-client';
export * from './core/types';
export * from './interceptors';
