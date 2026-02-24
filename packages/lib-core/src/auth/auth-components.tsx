/**
 * Auth UI Components
 *
 * Reusable components for common auth states
 * Follows DRY - no duplication of loading/error states
 */

'use client';

import { Loader2 } from 'lucide-react';
import { useAuth } from '@giulio-leone/lib-api/hooks';

/**
 * Loading state component for auth
 */
export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}

/**
 * Component that renders children only if authenticated
 * Shows loading or login required message otherwise
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Autenticazione richiesta
          </p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Effettua il login per accedere a questa pagina
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Component that renders children only if user has required role
 */
export function RequireRole({
  role,
  children,
  fallback,
}: {
  role: 'ATHLETE' | 'COACH' | 'ADMIN' | 'SUPER_ADMIN';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isLoading, hasRole } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!hasRole(role)) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Accesso negato</p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Non hai i permessi necessari per accedere a questa pagina
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
