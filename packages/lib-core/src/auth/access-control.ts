/**
 * Access Control Module
 *
 * Prisma-level visibility filters and record-level access checks.
 * Uses role-based access control with field mapping overrides.
 */

import type { UserRole } from '@prisma/client';

export type Actor = {
  id: string;
  role: UserRole;
};

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];

export const isAdminLike = (role: UserRole): boolean => ADMIN_ROLES.includes(role);
export const isCoach = (role: UserRole): boolean => role === 'COACH';

type AccessFieldMap = {
  userIdField?: string;
  assignedToField?: string;
  assignedByField?: string;
  visibilityField?: string;
};

/**
 * Builds Prisma visibility filter for standard fields
 * (visibility, assigned_to_user_id, assigned_by_coach_id, userId).
 */
export function buildVisibilityWhere(
  actor: Actor,
  overrides: AccessFieldMap = {}
): Record<string, unknown> {
  const userIdField = overrides.userIdField ?? 'userId';
  const assignedToField = overrides.assignedToField ?? 'assignedToUserId';
  const assignedByField = overrides.assignedByField ?? 'assignedByCoachId';
  const visibilityField = overrides.visibilityField ?? 'visibility';

  if (isAdminLike(actor.role)) {
    return {};
  }

  if (isCoach(actor.role)) {
    return {
      OR: [
        { [assignedByField]: actor.id },
        { [userIdField]: actor.id },
        {
          [assignedToField]: actor.id,
          [visibilityField]: 'SHARED_WITH_COACH',
        },
      ],
    };
  }

  return {
    OR: [{ [userIdField]: actor.id }, { [assignedToField]: actor.id }],
  };
}

/**
 * Runtime check: does the actor have access to this record?
 */
export function canAccessRecord(
  actor: Actor,
  record: Record<string, unknown>,
  overrides: AccessFieldMap = {}
): boolean {
  const userIdField = overrides.userIdField ?? 'userId';
  const assignedToField = overrides.assignedToField ?? 'assignedToUserId';
  const assignedByField = overrides.assignedByField ?? 'assignedByCoachId';
  const visibilityField = overrides.visibilityField ?? 'visibility';

  if (isAdminLike(actor.role)) return true;

  const userId = record[userIdField];
  const assignedTo = record[assignedToField];
  const assignedBy = record[assignedByField];
  const visibility = record[visibilityField];

  if (isCoach(actor.role)) {
    return (
      userId === actor.id ||
      assignedBy === actor.id ||
      (assignedTo === actor.id && visibility === 'SHARED_WITH_COACH')
    );
  }

  return userId === actor.id || assignedTo === actor.id;
}

/**
 * Normalizes assignment and visibility fields for coach-created records.
 */
export function coachAssignmentDefaults<
  T extends { visibility?: unknown; assignedByCoachId?: unknown },
>(
  actor: Actor,
  input: T & { assignedToUserId?: string | null }
): T & {
  visibility: 'PRIVATE' | 'SHARED_WITH_COACH';
  assignedByCoachId?: string;
  assignedToUserId?: string | null;
} {
  const visibility = (input.visibility as 'PRIVATE' | 'SHARED_WITH_COACH' | undefined) ?? 'PRIVATE';

  return {
    ...input,
    visibility,
    assignedByCoachId: actor.id,
  };
}
