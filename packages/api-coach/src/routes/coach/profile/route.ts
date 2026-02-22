/**
 * Coach Profile API
 * GET /api/coach/profile - Get current user's coach profile
 * POST /api/coach/profile - Create coach profile
 * PUT /api/coach/profile - Update coach profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { coachService } from '@giulio-leone/lib-coach';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coach/profile
 * Get current user's coach profile
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await coachService.getProfile(session.user.id);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * POST /api/coach/profile
 * Create coach profile
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if profile already exists
    const existing = await coachService.getProfile(session.user.id);
    if (existing) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 400 });
    }

    const data = await _request.json();

    // Validate required fields
    if (!data.bio && !data.credentials) {
      return NextResponse.json({ error: 'At least bio or credentials required' }, { status: 400 });
    }

    // Update user role to COACH
    await prisma.users.update({
      where: { id: session.user.id },
      data: { role: 'COACH' },
    });

    // Create profile
    const profile = await coachService.createProfile({
      userId: session.user.id,
      bio: data.bio,
      credentials: data.credentials,
      coachingStyle: data.coachingStyle,
      linkedinUrl: data.linkedinUrl,
      instagramUrl: data.instagramUrl,
      websiteUrl: data.websiteUrl,
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * PUT /api/coach/profile
 * Update coach profile
 */
export async function PUT(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if profile exists
    const existing = await coachService.getProfile(session.user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const data = await _request.json();

    const profile = await coachService.updateProfile(session.user.id, {
      bio: data.bio,
      credentials: data.credentials,
      coachingStyle: data.coachingStyle,
      linkedinUrl: data.linkedinUrl,
      instagramUrl: data.instagramUrl,
      websiteUrl: data.websiteUrl,
      isPubliclyVisible: data.isPubliclyVisible,
    });

    return NextResponse.json(profile);
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
