/**
 * React Query Configuration
 *
 * Configurazione condivisa per QueryClient cross-platform
 * Supporta sia Next.js che React Native/Expo
 */

import type { QueryClientConfig } from '@tanstack/react-query';

/**
 * Default query options
 */
export const defaultQueryOptions: QueryClientConfig['defaultOptions'] = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 1,
  },
};

/**
 * Create QueryClient configuration
 */
export function createQueryClientConfig(options?: Partial<QueryClientConfig>): QueryClientConfig {
  return {
    defaultOptions: defaultQueryOptions,
    ...options,
  };
}
