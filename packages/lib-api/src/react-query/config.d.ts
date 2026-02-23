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
export declare const defaultQueryOptions: QueryClientConfig['defaultOptions'];
/**
 * Create QueryClient configuration
 *
 * @param options - Optional additional configuration
 * @returns QueryClientConfig
 */
export declare function createQueryClientConfig(
  options?: Partial<QueryClientConfig>
): QueryClientConfig;
//# sourceMappingURL=config.d.ts.map
