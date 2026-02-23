/**
 * React Query Provider
 *
 * Provider cross-platform per React Query
 * Supporta sia Next.js che React Native/Expo
 * Supporta persistenza opzionale con AsyncStorage per React Native
 */
import { QueryClient } from '@tanstack/react-query';
import { type ReactNode } from 'react';
interface QueryProviderProps {
  children: ReactNode;
  /**
   * Optional QueryClient instance
   * If not provided, a new one will be created with default config
   */
  client?: QueryClient;
  /**
   * Enable persistence with AsyncStorage (React Native only)
   * Default: false
   */
  persist?: boolean;
}
/**
 * Cross-platform React Query Provider
 *
 * Usage:
 * ```tsx
 * import { QueryProvider } from '@giulio-leone/lib-api-client/react-query';
 *
 * function App() {
 *   return (
 *     <QueryProvider persist={true}>
 *       <YourApp />
 *     </QueryProvider>
 *   );
 * }
 * ```
 */
export declare function QueryProvider({
  children,
  client,
  persist,
}: QueryProviderProps): import('react/jsx-runtime').JSX.Element;
export {};
//# sourceMappingURL=provider.d.ts.map
