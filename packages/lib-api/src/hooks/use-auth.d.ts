/**
 * Auth React Query Hooks
 *
 * Custom hooks for authentication with TanStack Query and Zustand integration
 */
import type { RefreshTokenRequest } from '../queries/auth.queries';
import type { User } from '@giulio-leone/lib-stores/auth';
/**
 * Hook to sync NextAuth session with Zustand store
 *
 * This hook automatically syncs the NextAuth session to Zustand store
 * for consistent state management across the app.
 */
export declare function useSyncAuth(): void;
/**
 * Hook to get current user
 *
 * Automatically syncs NextAuth session with Zustand store
 * Returns Zustand user state for consistent access
 */
export declare function useMe(): {
  data: User | null;
  isLoading: boolean;
  error: null;
  refetch: () => void;
};
/**
 * Hook to login
 *
 * Automatically updates Zustand store and TanStack Query cache
 */
export declare function useLogin(): import('@tanstack/react-query').UseMutationResult<
  import('..').AuthResponse,
  Error,
  import('..').LoginCredentials,
  void
>;
/**
 * Hook to register
 *
 * Automatically updates Zustand store and TanStack Query cache
 */
export declare function useRegister(): import('@tanstack/react-query').UseMutationResult<
  import('..').AuthResponse,
  Error,
  import('..').RegisterData,
  void
>;
/**
 * Hook to logout
 *
 * Clears Zustand store and TanStack Query cache
 * Also calls NextAuth signOut for consistency
 */
export declare function useLogout(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  void,
  void
>;
/**
 * Hook to sign out (NextAuth wrapper)
 *
 * Simple wrapper around NextAuth signOut that also clears Zustand
 * Use this for simple logout without mutations
 */
export declare function useSignOut(): (options?: {
  callbackUrl?: string;
  redirect?: boolean;
}) => Promise<void>;
/**
 * Hook to refresh access token
 */
export declare function useRefreshToken(): import('@tanstack/react-query').UseMutationResult<
  import('..').RefreshTokenResponse,
  Error,
  RefreshTokenRequest,
  unknown
>;
/**
 * Hook to check if user is authenticated
 */
export declare function useIsAuthenticated(): boolean;
/**
 * Hook to get current user from store
 */
export declare function useCurrentUser(): User | null;
declare const CLIENT_ROLE_REQUIREMENTS: {
  readonly ATHLETE: 'USER';
  readonly COACH: 'COACH';
  readonly ADMIN: 'ADMIN';
  readonly SUPER_ADMIN: 'SUPER_ADMIN';
};
type ClientRole = keyof typeof CLIENT_ROLE_REQUIREMENTS;
/**
 * Hook to check if user has a specific role
 */
export declare function useHasRole(role: ClientRole): boolean;
/**
 * Hook to check if user is admin
 */
export declare function useIsAdmin(): boolean;
/**
 * Hook to check if user is coach
 */
export declare function useIsCoach(): boolean;
/**
 * Hook to check if user is athlete
 */
export declare function useIsAthlete(): boolean;
export {};
//# sourceMappingURL=use-auth.d.ts.map
