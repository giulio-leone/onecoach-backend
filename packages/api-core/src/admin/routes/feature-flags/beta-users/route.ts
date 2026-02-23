/**
 * Admin Beta Users API Route
 *
 * GET: List all beta users
 * PATCH: Toggle beta status for a user
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { featureFlagsService } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const { searchParams } = new URL(req.url);
    const betaOnly = searchParams.get('betaOnly') === 'true';

    let users;

    if (betaOnly) {
      users = await featureFlagsService.getBetaUsers();
    } else {
      // Get all users with beta status
      users = await prisma.users.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          betaEnabled: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
      betaCount: users.filter((u: { betaEnabled: boolean }) => u.betaEnabled).length,
    });
  } catch (error: unknown) {
    logError('Error fetching beta users', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function PATCH(req: Request) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const body = await req.json();
    const { userId, betaEnabled } = body;

    // Validation
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (typeof betaEnabled !== 'boolean') {
      return NextResponse.json({ error: 'betaEnabled must be a boolean' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update beta status
    await featureFlagsService.updateUserBetaStatus(userId, betaEnabled);

    // Get updated user
    const updatedUser = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        betaEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Beta status ${betaEnabled ? 'enabled' : 'disabled'} for user`,
    });
  } catch (error: unknown) {
    logError('Error updating user beta status', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
