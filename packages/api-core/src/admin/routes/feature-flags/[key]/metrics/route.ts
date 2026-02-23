/**
 * Admin Feature Flag Metrics API Route
 *
 * GET: Get metrics for a specific feature flag
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { featureFlagsService } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const params = await context.params;
    const key = params.key;
    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // Get detailed metrics
    const metrics = await featureFlagsService.getFlagMetrics(key, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId: userId || undefined,
    });

    // Get aggregated metrics
    const aggregated = await featureFlagsService.getFlagMetricsAggregated(key);

    return NextResponse.json({
      success: true,
      metrics,
      aggregated,
    });
  } catch (error: unknown) {
    logError('Error fetching flag metrics', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
