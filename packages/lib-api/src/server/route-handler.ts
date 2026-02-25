import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuthOrThrow,
  requireAdminOrThrow,
  requireCoachOrThrow,
} from '@giulio-leone/lib-core';
import { handleRouteError } from '@giulio-leone/lib-shared';
import type { ZodSchema } from 'zod';

type AuthenticatedUser = Awaited<ReturnType<typeof requireAuthOrThrow>>;

interface RouteContext {
  user: AuthenticatedUser;
  /** Alias kept for destructuring as unused (`_user`) */
  _user: AuthenticatedUser;
  /** Alias for admin routes that destructure as `admin` */
  admin: AuthenticatedUser;
  req: NextRequest;
  /** Alias kept for destructuring as unused (`_req`) */
  _req: NextRequest;
  /** Alias for handlers that destructure as `request` */
  request: NextRequest;
  /** Alias for handlers that destructure as `_request` */
  _request: NextRequest;
  params: Record<string, string>;
  /** Alias kept for destructuring as unused (`_params`) */
  _params: Record<string, string>;
}

type RouteHandler = (ctx: RouteContext) => Promise<Response>;

interface RouteOptions {
  /** Authentication level: 'user' (default), 'admin', 'coach', or 'none' */
  auth?: 'user' | 'admin' | 'coach' | 'none';
  /** Route handler tag for error logging (e.g., '[HABITS_GET]') */
  tag?: string;
}

/**
 * Wraps a Next.js route handler with:
 * - Authentication (user or admin)
 * - Centralized error handling via handleRouteError
 *
 * Usage:
 * ```ts
 * export const GET = withRoute(async ({ user, req }) => {
 *   const data = await getDbClient().table.findMany({ where: { userId: user.id } });
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withRoute(handler: RouteHandler, options: RouteOptions = {}) {
  const { auth = 'user', tag } = options;

  return async (req: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    try {
      let user: AuthenticatedUser = null as unknown as AuthenticatedUser;

      if (auth === 'admin') {
        user = await requireAdminOrThrow();
      } else if (auth === 'coach') {
        user = await requireCoachOrThrow();
      } else if (auth === 'user') {
        user = await requireAuthOrThrow();
      }

      const params = (context?.params ? await context.params : {}) as Record<string, string>;

      return await handler({ user, _user: user, admin: user, req, _req: req, request: req, _request: req, params, _params: params });
    } catch (error: unknown) {
      return handleRouteError(error, tag);
    }
  };
}

/**
 * Validates request body against a Zod schema.
 * Returns parsed data or a 400 error response.
 */
export async function validateBody<T>(
  req: NextRequest | Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      error: NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}
