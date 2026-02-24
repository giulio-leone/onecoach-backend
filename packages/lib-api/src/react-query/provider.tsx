'use client';

/**
 * React Query Provider
 *
 * Provider cross-platform per React Query
 * Supporta sia Next.js che React Native/Expo
 * Supporta persistenza opzionale con AsyncStorage per React Native
 */

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode, useEffect, type ComponentType } from 'react';
import { createQueryClientConfig, defaultQueryOptions } from './config';

/**
 * Check if we're in development environment
 * This function is called lazily to avoid top-level process access
 * which can cause issues with Next.js polyfills in Turbopack.
 *
 * In Next.js, process.env.NODE_ENV is replaced at build time.
 * We access it inside a function to avoid triggering polyfill loading.
 *
 * For client components, we can safely access process.env.NODE_ENV
 * as Next.js replaces it at build time, but we do it inside a function
 * to prevent top-level evaluation that triggers the polyfill.
 */
function isDevEnvironment(): boolean {
  // Only check on client side
  if (typeof window === 'undefined') {
    return false;
  }

  // Next.js replaces process.env.NODE_ENV at build time
  // Accessing it inside a function prevents top-level polyfill loading
  // The IIFE ensures lazy evaluation and allows Next.js to replace the value
  return (function () {
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  })();
}

// Componente per i devtools che viene caricato solo lato client
function Devtools({ client }: { client?: QueryClient }) {
  const [DevtoolsComponent, setDevtoolsComponent] = useState<ComponentType<{
    initialIsOpen?: boolean;
    client?: QueryClient;
  }> | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Usa il client dal prop se fornito, altrimenti dal contesto
  // useQueryClient() viene chiamato sempre (regole degli hook) ma funzionerà
  // perché siamo dentro QueryClientProvider
  const contextClient = useQueryClient();
  const queryClient = client || contextClient;

  useEffect(() => {
    // Assicurati che il componente sia montato e che il provider sia disponibile
    if (typeof window === 'undefined') {
      return undefined;
    }

    // Carica i devtools solo in sviluppo e solo lato client
    if (isDevEnvironment() && typeof window !== 'undefined') {
      // Usa requestAnimationFrame per assicurarsi che il rendering avvenga
      // dopo che il DOM è pronto e il provider è montato
      // Usa eval per evitare che Next.js/Turbopack pre-risolva l'import durante la build
      const frameId = requestAnimationFrame(() => {
        try {
          // Usa Function constructor per evitare che il bundler risolva l'import
          const loadDevtools = new Function('return import("@tanstack/react-query-devtools")');
          loadDevtools()
            .then((mod: { ReactQueryDevtools: React.ComponentType<Record<string, unknown>> }) => {
              setDevtoolsComponent(() => mod.ReactQueryDevtools);
              setIsReady(true);
            })
            .catch(() => {
              // Se i devtools non sono disponibili, ignora silenziosamente
              setIsReady(true);
            });
        } catch (_error: unknown) {
          // Se l'import fallisce, ignora silenziosamente
          setIsReady(true);
        }
      });

      return () => cancelAnimationFrame(frameId);
    } else {
      // In produzione o SSR, non caricare i devtools
      setIsReady(true);
    }
    return undefined;
  }, []);

  // Renderizza solo quando il componente è pronto e il QueryClient è disponibile
  if (!isReady || !DevtoolsComponent || !queryClient) {
    return null;
  }

  // Passa il client esplicitamente se disponibile
  // Se il prop non è supportato, il componente userà comunque il contesto (che è verificato)
  return <DevtoolsComponent initialIsOpen={false} client={queryClient} />;
}

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
 * import { QueryProvider } from '@giulio-leone/lib-api/react-query';
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
export function QueryProvider({ children, client, persist = false }: QueryProviderProps) {
  const [queryClient] = useState(() => {
    if (client) return client;

    const baseConfig = createQueryClientConfig();

    // For React Native with persistence, add offline-first network mode
    if (persist && typeof window === 'undefined') {
      return new QueryClient({
        ...baseConfig,
        defaultOptions: {
          queries: {
            ...(defaultQueryOptions?.queries || {}),
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            networkMode: 'offlineFirst' as const,
          },
          mutations: {
            ...(defaultQueryOptions?.mutations || {}),
            networkMode: 'offlineFirst' as const,
          },
        },
      });
    }

    return new QueryClient(baseConfig);
  });

  // For React Native with persistence, use PersistQueryClientProvider
  // Note: This requires @tanstack/react-query-persist-client and @react-native-async-storage/async-storage
  // The app should handle the import and pass a custom client if persistence is needed
  // For now, we'll use the standard provider and let the app handle persistence if needed

  // Standard provider for web or without persistence
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Devtools client={queryClient} />
    </QueryClientProvider>
  );
}
