/**
 * Unified Auth Hook
 *
 * Single source of truth for authentication state
 * Follows KISS, SOLID, DRY, YAGNI principles
 *
 * This hook:
 * - Syncs NextAuth session with Zustand store
 * - Provides consistent API across the app
 * - Eliminates duplication
 * - Simplifies authentication checks
 */

'use client';

import { useSyncAuth } from './use-auth';
import { useAuthStore } from '@giulio-leone/lib-stores/auth';
import type { User } from '@giulio-leone/lib-stores/auth';
import {
  isAdminRole,
  isCoachRole,
  normalizeRole,
  roleSatisfies,
} from '@giulio-leone/lib-core';

/**
 * Unified auth hook return type
 */
export interface UseAuthReturn {
  // User data
  user: User | null;
  userId: string | null;

  // Loading states
  isLoading: boolean;
  isAuthenticated: boolean;

  // Role checks (computed)
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCoach: boolean;
  isAthlete: boolean;

  // Role check utility
  hasRole: (role: 'ATHLETE' | 'COACH' | 'ADMIN' | 'SUPER_ADMIN') => boolean;
}

/**
 * Main authentication hook
 *
 * Single hook to rule them all - replaces all useSession, useMe, useCurrentUser calls
 *
 * @example
 * ```tsx
 * const { user, userId, isLoading, isAdmin } = useAuth();
 *
 * if (isLoading) return <Loading />;
 * if (!user) return <LoginRequired />;
 * if (!isAdmin) return <AccessDenied />;
 * ```
 */
export function useAuth(): UseAuthReturn {
  // Sync NextAuth with Zustand (automatic)
  useSyncAuth();

  // Get state from Zustand (single source of truth)
  const user = useAuthStore((state: any) => state.user);
  const isLoading = useAuthStore((state: any) => state.isLoading);
  const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated);

  // Computed values (DRY - no duplication)
  const userId = user?.id ?? null;
  const normalizedRole = normalizeRole(user?.role);
  const isAdmin = isAdminRole(user?.role);
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';
  const isCoach = isCoachRole(user?.role);
  const isAthlete = normalizedRole === 'USER';

  const ROLE_REQUIREMENTS = {
    ATHLETE: 'USER',
    COACH: 'COACH',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
  } as const;

  // Role check utility (reusable)
  const hasRole = (role: keyof typeof ROLE_REQUIREMENTS): boolean => {
    return roleSatisfies(ROLE_REQUIREMENTS[role], user?.role);
  };

  return {
    user,
    userId,
    isLoading,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isCoach,
    isAthlete,
    hasRole,
  };
}
