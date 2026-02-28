/**
 * Shared normalizer / validation helpers for API route handlers.
 *
 * Centralises logic that was previously duplicated across multiple _helpers.ts files.
 */

import type { UserRole } from '@prisma/client';
import { getUserRepo } from '@giulio-leone/core';
import { logger } from '@giulio-leone/lib-shared';

// ── Value normalizers ───────────────────────────────────────────────

export function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}

export function normalizeEnum<T extends string>(
  value: unknown,
  validValues: readonly T[]
): T | null {
  if (value === null || value === undefined || value === '') return null;
  const str = String(value).trim();
  if (str === '') return null;
  if (validValues.includes(str as T)) return str as T;
  if (process.env.NODE_ENV === 'development') {
    logger.warn(`Invalid enum value: ${str}, expected one of: ${validValues.join(', ')}`);
  }
  return null;
}

// ── Actor / role resolution ─────────────────────────────────────────

export async function resolveActorRole(
  userId: string,
  userRole?: UserRole
): Promise<{ id: string; role: UserRole }> {
  const role =
    userRole ?? ((await getUserRepo().findById(userId))?.role as UserRole) ?? ('USER' as UserRole);
  return { id: userId, role };
}
