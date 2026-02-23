/**
 * Coach Vetting API
 * POST /api/coach/vetting - Submit vetting request
 * GET /api/coach/vetting - Get vetting status
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { coachService } from '@giulio-leone/lib-coach';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coach/vetting
 * Get vetting request status
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vettingRequest = await coachService.getVettingRequest(session.user.id);

    if (!vettingRequest) {
      return NextResponse.json({ error: 'No vetting request found' }, { status: 404 });
    }

    return NextResponse.json(vettingRequest);
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * POST /api/coach/vetting
 * Submit vetting request
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a coach
    const profile = await coachService.getProfile(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: 'Coach profile required' }, { status: 400 });
    }

    // Check if already has pending/approved request
    const existing = await coachService.getVettingRequest(session.user.id);
    if (existing && (existing.status === 'PENDING' || existing.status === 'APPROVED')) {
      return NextResponse.json({ error: 'Vetting request already exists' }, { status: 400 });
    }

    const data = await _request.json();

    const vettingRequest = await coachService.submitVettingRequest({
      userId: session.user.id,
      credentialDocuments: data.credentialDocuments,
    });

    return NextResponse.json(vettingRequest, { status: 201 });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
