import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('../session', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@giulio-leone/lib-shared', () => ({
  logger: { error: vi.fn() },
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      _body: body,
      status: init?.status ?? 200,
    })),
  },
}));

import { getCurrentUser } from '../session';
import type { AuthenticatedUser } from '../session';
import {
  AuthError,
  requireAuthOrThrow,
  requireAdminOrThrow,
  requireSuperAdminOrThrow,
} from '../guards';

const mockedGetCurrentUser = vi.mocked(getCurrentUser);

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    credits: 10,
    image: null,
    copilotEnabled: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── AuthError ───────────────────────────────────────────────────

describe('AuthError', () => {
  it('defaults to status 401', () => {
    const err = new AuthError('unauthorized');
    expect(err.message).toBe('unauthorized');
    expect(err.status).toBe(401);
    expect(err.name).toBe('AuthError');
    expect(err).toBeInstanceOf(Error);
  });

  it('accepts a custom 403 status', () => {
    const err = new AuthError('forbidden', 403);
    expect(err.status).toBe(403);
  });

  it('toResponse() returns a NextResponse with correct body and status', () => {
    const err = new AuthError('no access', 403);
    const res = err.toResponse() as unknown as Record<string, unknown>;
    expect((res._body as { error: string }).error).toBe('no access');
    expect(res.status).toBe(403);
  });
});

// ─── requireAuthOrThrow ──────────────────────────────────────────

describe('requireAuthOrThrow', () => {
  it('returns the user when authenticated', async () => {
    const user = makeUser();
    mockedGetCurrentUser.mockResolvedValue(user);

    const result = await requireAuthOrThrow();
    expect(result).toBe(user);
  });

  it('throws 401 AuthError when no user', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    await expect(requireAuthOrThrow()).rejects.toThrow(AuthError);
    await expect(requireAuthOrThrow()).rejects.toMatchObject({ status: 401 });
  });

  it('throws 401 AuthError when user has no id', async () => {
    mockedGetCurrentUser.mockResolvedValue(makeUser({ id: '' }));

    await expect(requireAuthOrThrow()).rejects.toThrow(AuthError);
    await expect(requireAuthOrThrow()).rejects.toMatchObject({ status: 401 });
  });

  it('throws 401 AuthError when user id is not a string', async () => {
    mockedGetCurrentUser.mockResolvedValue(
      // @ts-expect-error intentionally testing non-string id
      makeUser({ id: 123 })
    );

    await expect(requireAuthOrThrow()).rejects.toThrow(AuthError);
    await expect(requireAuthOrThrow()).rejects.toMatchObject({ status: 401 });
  });
});

// ─── requireAdminOrThrow ─────────────────────────────────────────

describe('requireAdminOrThrow', () => {
  it('returns user when role is ADMIN', async () => {
    const user = makeUser({ role: 'ADMIN' });
    mockedGetCurrentUser.mockResolvedValue(user);

    const result = await requireAdminOrThrow();
    expect(result).toBe(user);
  });

  it('returns user when role is SUPER_ADMIN (inherits ADMIN)', async () => {
    const user = makeUser({ role: 'SUPER_ADMIN' });
    mockedGetCurrentUser.mockResolvedValue(user);

    const result = await requireAdminOrThrow();
    expect(result).toBe(user);
  });

  it('throws 403 AuthError when user is not admin', async () => {
    mockedGetCurrentUser.mockResolvedValue(makeUser({ role: 'USER' }));

    await expect(requireAdminOrThrow()).rejects.toThrow(AuthError);
    await expect(requireAdminOrThrow()).rejects.toMatchObject({ status: 403 });
  });

  it('throws 403 for COACH role (not admin)', async () => {
    mockedGetCurrentUser.mockResolvedValue(makeUser({ role: 'COACH' }));

    await expect(requireAdminOrThrow()).rejects.toThrow(AuthError);
    await expect(requireAdminOrThrow()).rejects.toMatchObject({ status: 403 });
  });

  it('throws 401 AuthError when no session', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    await expect(requireAdminOrThrow()).rejects.toThrow(AuthError);
    await expect(requireAdminOrThrow()).rejects.toMatchObject({ status: 401 });
  });
});

// ─── requireSuperAdminOrThrow ────────────────────────────────────

describe('requireSuperAdminOrThrow', () => {
  it('returns user when role is SUPER_ADMIN', async () => {
    const user = makeUser({ role: 'SUPER_ADMIN' });
    mockedGetCurrentUser.mockResolvedValue(user);

    const result = await requireSuperAdminOrThrow();
    expect(result).toBe(user);
  });

  it('throws 403 AuthError when user is ADMIN (not super)', async () => {
    mockedGetCurrentUser.mockResolvedValue(makeUser({ role: 'ADMIN' }));

    await expect(requireSuperAdminOrThrow()).rejects.toThrow(AuthError);
    await expect(requireSuperAdminOrThrow()).rejects.toMatchObject({ status: 403 });
  });

  it('throws 403 for regular USER role', async () => {
    mockedGetCurrentUser.mockResolvedValue(makeUser({ role: 'USER' }));

    await expect(requireSuperAdminOrThrow()).rejects.toThrow(AuthError);
    await expect(requireSuperAdminOrThrow()).rejects.toMatchObject({ status: 403 });
  });

  it('throws 401 AuthError when no session', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    await expect(requireSuperAdminOrThrow()).rejects.toThrow(AuthError);
    await expect(requireSuperAdminOrThrow()).rejects.toMatchObject({ status: 401 });
  });
});
