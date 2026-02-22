/**
 * Auth React Query Hooks
 *
 * Custom hooks for authentication with TanStack Query and Zustand integration
 */

'use client';

import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { authKeys, authQueries } from '../queries/auth.queries';
import { useAuthStore } from '@giulio-leone/lib-stores/auth';
import type { RefreshTokenRequest } from '../queries/auth.queries';
import type { User } from '@giulio-leone/lib-stores/auth';
import { normalizeRole, roleSatisfies } from '@giulio-leone/lib-core';

/**
 * Hook to sync NextAuth session with Zustand store
 *
 * This hook automatically syncs the NextAuth session to Zustand store
 * for consistent state management across the app.
 */
export function useSyncAuth() {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((state: any) => state.setUser);
  const setLoading = useAuthStore((state: any) => state.setLoading);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const sessionUser = session.user as Partial<User> & {
        id?: string;
        role?: string;
        image?: string;
      };
      const normalizedRole = (normalizeRole(sessionUser.role) ?? 'USER') as User['role'];

      // Convert NextAuth session user to Zustand User type
      const user: User = {
        id: sessionUser.id || '',
        email: sessionUser.email || '',
        name: sessionUser.name || '',
        role: normalizedRole,
        profileImage: sessionUser.image || undefined,
      };
      setUser(user);
      setLoading(false);
    } else {
      // Unauthenticated or no session
      setUser(null);
      setLoading(false);
    }
  }, [session, status, setUser, setLoading]);
}

/**
 * Hook to get current user
 *
 * Automatically syncs NextAuth session with Zustand store
 * Returns Zustand user state for consistent access
 */
export function useMe() {
  // Sync NextAuth with Zustand
  useSyncAuth();

  const user = useAuthStore((state: any) => state.user);
  const isLoading = useAuthStore((state: any) => state.isLoading);
  const { status } = useSession();

  // Return Zustand state with loading from both sources
  return {
    data: user,
    isLoading: isLoading || status === 'loading',
    error: null,
    refetch: () => { }, // No-op, sync happens automatically
  };
}

/**
 * Hook to login
 *
 * Automatically updates Zustand store and TanStack Query cache
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state: any) => state.setUser);
  const setTokens = useAuthStore((state: any) => state.setTokens);
  const setLoading = useAuthStore((state: any) => state.setLoading);

  return useMutation({
    mutationFn: authQueries.login,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      const expiresAt = Date.now() + data.expiresIn * 1000;

      // Update Zustand store
      setUser(data.user);
      setTokens(data.accessToken, data.refreshToken, expiresAt);
      setLoading(false);

      // Update TanStack Query cache
      queryClient.setQueryData(authKeys.me(), data.user);
    },
    onError: () => {
      setLoading(false);
    },
  });
}

/**
 * Hook to register
 *
 * Automatically updates Zustand store and TanStack Query cache
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state: any) => state.setUser);
  const setTokens = useAuthStore((state: any) => state.setTokens);
  const setLoading = useAuthStore((state: any) => state.setLoading);

  return useMutation({
    mutationFn: authQueries.register,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      const expiresAt = Date.now() + data.expiresIn * 1000;

      // Update Zustand store
      setUser(data.user);
      setTokens(data.accessToken, data.refreshToken, expiresAt);
      setLoading(false);

      // Update TanStack Query cache
      queryClient.setQueryData(authKeys.me(), data.user);
    },
    onError: () => {
      setLoading(false);
    },
  });
}

/**
 * Hook to logout
 *
 * Clears Zustand store and TanStack Query cache
 * Also calls NextAuth signOut for consistency
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state: any) => state.clearAuth);
  const setLoading = useAuthStore((state: any) => state.setLoading);

  return useMutation({
    mutationFn: async () => {
      // Call NextAuth signOut
      await nextAuthSignOut({ redirect: false });
      // Call API logout (if needed)
      await authQueries.logout();
    },
    onMutate: () => {
      setLoading(true);
    },
    onSettled: () => {
      // Clear auth state regardless of success/failure
      clearAuth();
      setLoading(false);

      // Clear all queries
      queryClient.clear();
    },
  });
}

/**
 * Hook to sign out (NextAuth wrapper)
 *
 * Simple wrapper around NextAuth signOut that also clears Zustand
 * Use this for simple logout without mutations
 */
export function useSignOut() {
  const clearAuth = useAuthStore((state: any) => state.clearAuth);

  return async (options?: { callbackUrl?: string; redirect?: boolean }) => {
    if (options?.redirect === false) {
      await nextAuthSignOut({ redirect: false });
    } else {
      await nextAuthSignOut({ redirect: true });
    }
    clearAuth();
  };
}

/**
 * Hook to refresh access token
 */
export function useRefreshToken() {
  const setTokens = useAuthStore((state: any) => state.setTokens);

  return useMutation({
    mutationFn: (request: RefreshTokenRequest) => authQueries.refresh(request),
    onSuccess: (data) => {
      const expiresAt = Date.now() + data.expiresIn * 1000;
      setTokens(data.accessToken, undefined, expiresAt);
    },
  });
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore((state: any) => state.isAuthenticated);
}

/**
 * Hook to get current user from store
 */
export function useCurrentUser() {
  return useAuthStore((state: any) => state.user);
}

const CLIENT_ROLE_REQUIREMENTS = {
  ATHLETE: 'USER',
  COACH: 'COACH',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

type ClientRole = keyof typeof CLIENT_ROLE_REQUIREMENTS;

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: ClientRole): boolean {
  const user = useCurrentUser();
  return roleSatisfies(CLIENT_ROLE_REQUIREMENTS[role], user?.role);
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  return useHasRole('ADMIN');
}

/**
 * Hook to check if user is coach
 */
export function useIsCoach(): boolean {
  return useHasRole('COACH');
}

/**
 * Hook to check if user is athlete
 */
export function useIsAthlete(): boolean {
  return useHasRole('ATHLETE');
}
