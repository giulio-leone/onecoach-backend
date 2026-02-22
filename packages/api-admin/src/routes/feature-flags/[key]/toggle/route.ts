/**
 * Admin Feature Flag Toggle API Route
 *
 * POST: Toggle a feature flag on/off
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { featureFlagsService } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function POST(_req: Request, context: RouteContext) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const params = await context.params;
    const key = params.key;

    const newState = await featureFlagsService.toggleFeatureFlag(key!, adminOrError.id);

    return NextResponse.json({
      success: true,
      enabled: newState,
      message: `Flag ${newState ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error: unknown) {
    logError('Error toggling feature flag', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
