import jwt from 'jsonwebtoken';
import { auth } from './config';
import { prisma } from '../prisma';
import { logger } from '@giulio-leone/lib-shared';

interface SessionUser {
  id?: string;
  sub?: string;
  email?: string | null;
}

/**
 * Resolves the authenticated user's ID from the session.
 * Tries session.user.id, then sub, then looks up by email in DB.
 * Returns null if no valid user can be identified.
 */
export async function resolveAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;

  let userId: string | null =
    (sessionUser?.id as string | undefined) ?? (sessionUser?.sub as string | undefined) ?? null;

  if (!userId && sessionUser?.email) {
    const email = String(sessionUser.email).toLowerCase();
    const dbUser = await prisma.users.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    userId = dbUser?.id ?? null;
  }

  return userId;
}

/**
 * Gets a signed Supabase Realtime token for the authenticated user.
 * Returns null if user cannot be identified.
 */
export async function getSignedSupabaseToken(): Promise<{ token: string } | null> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) return null;

  try {
    const token = signSupabaseToken(userId);
    return { token };
  } catch (error) {
    logger.error('Error signing Supabase token:', error);
    return null;
  }
}

export function signSupabaseToken(userId: string): string {
  const secret = process.env.ONECOAH_DB_SUPABASE_JWT_SECRET;
  if (!secret) {
    // In production this should probably throw, but for dev/build robustness we might warn
    // However, without this secret, Realtime won't work secured.
    throw new Error('ONECOAH_DB_SUPABASE_JWT_SECRET is not defined');
  }

  const payload = {
    aud: 'authenticated',
    role: 'authenticated',
    sub: userId,
    // Optional: Add custom claims if needed for RLS
    // app_metadata: { provider: 'next_auth' },
  };

  // Sign the token with the secret
  // Supabase JWTs usually need to match the JWT secret in the Supabase project settings
  return jwt.sign(payload, secret, { expiresIn: '1h' }); // Short-lived, client should refresh if needed
}
