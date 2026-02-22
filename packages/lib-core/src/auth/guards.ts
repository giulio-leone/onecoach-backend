/**
 * Auth Guards
 *
 * Guards per proteggere API routes e verificare autorizzazioni
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from './session';
import { isAdminRole, isSuperAdminRole } from './roles';

import { logger } from '@giulio-leone/lib-shared';
/**
 * Guard per verificare autenticazione
 * Ritorna user se autenticato, altrimenti NextResponse con errore 401
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  // Verifica che l'utente abbia un ID valido
  if (!user.id || typeof user.id !== 'string') {
    logger.error('[requireAuth] User object senza ID valido:', user);
    return NextResponse.json(
      { error: 'Errore di autenticazione: sessione non valida' },
      { status: 401 }
    );
  }

  return user;
}

/**
 * Guard per verificare che l'utente sia admin o super admin
 * Ritorna user se admin/super admin, altrimenti NextResponse con errore 403
 */
export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  if (!isAdminRole(user.role)) {
    return NextResponse.json(
      { error: 'Accesso negato - Richiesti privilegi admin' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Guard per verificare che l'utente sia super admin
 * Ritorna user se super admin, altrimenti NextResponse con errore 403
 */
export async function requireSuperAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  if (!isSuperAdminRole(user.role)) {
    return NextResponse.json(
      { error: 'Accesso negato - Richiesti privilegi super admin' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Verifica se l'utente può accedere alla risorsa
 * (è il proprietario o è admin)
 */
export async function canAccessResource(resourceUserId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Admin e Super Admin possono accedere a tutto
  if (isAdminRole(user.role)) {
    return true;
  }

  // L'utente può accedere solo alle sue risorse
  return user.id === resourceUserId;
}

/**
 * Guard che verifica se l'utente può accedere alla risorsa
 */
export async function requireResourceAccess(resourceUserId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const canAccess = await canAccessResource(resourceUserId);

  if (!canAccess) {
    return NextResponse.json({ error: 'Accesso negato a questa risorsa' }, { status: 403 });
  }

  return user;
}

/**
 * Wrapper per API route con auth guard
 */
export function withAuth(handler: (req: Request, user: unknown) => Promise<Response>) {
  return async (req: Request) => {
    const userOrError = await requireAuth();

    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    return handler(req, userOrError);
  };
}

/**
 * Wrapper per API route con admin guard
 */
export function withAdmin(handler: (req: Request, user: unknown) => Promise<Response>) {
  return async (req: Request) => {
    const userOrError = await requireAdmin();

    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    return handler(req, userOrError);
  };
}

/**
 * Wrapper per API route con super admin guard
 */
export function withSuperAdmin(handler: (req: Request, user: unknown) => Promise<Response>) {
  return async (req: Request) => {
    const userOrError = await requireSuperAdmin();

    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    return handler(req, userOrError);
  };
}
