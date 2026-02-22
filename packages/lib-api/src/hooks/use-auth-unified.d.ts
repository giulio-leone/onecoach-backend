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
import type { User } from '@giulio-leone/lib-stores/auth';
/**
 * Unified auth hook return type
 */
export interface UseAuthReturn {
    user: User | null;
    userId: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isCoach: boolean;
    isAthlete: boolean;
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
export declare function useAuth(): UseAuthReturn;
//# sourceMappingURL=use-auth-unified.d.ts.map