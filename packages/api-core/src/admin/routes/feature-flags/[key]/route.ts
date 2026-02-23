/**
 * Admin Feature Flag API Route (Single Flag)
 *
 * GET: Get a specific feature flag
 * PATCH: Update a feature flag
 * DELETE: Delete a feature flag
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { featureFlagsService } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import type { RolloutStrategy } from '@giulio-leone/types';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const params = await context.params;
    const key = params.key;

    const flag = await featureFlagsService.getFeatureFlag(key);

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    // Enrich with metrics and feedback
    const metrics = await featureFlagsService.getFlagMetricsAggregated(key);
    const avgRating = await featureFlagsService.getFlagAverageRating(key);

    return NextResponse.json({
      success: true,
      flag: {
        ...flag,
        metrics,
        avgRating,
      },
    });
  } catch (error: unknown) {
    logError('Error fetching feature flag', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const params = await context.params;
    const key = params.key;
    const body = await req.json();

    const { name, description, enabled, strategy, config, metadata } = body;

    // Check if flag exists
    const existing = await featureFlagsService.getFeatureFlag(key);
    if (!existing) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    // Update flag
    await featureFlagsService.updateFeatureFlag(
      key!,
      {
        name,
        description,
        enabled,
        strategy: strategy as RolloutStrategy | undefined,
        config,
        metadata,
      },
      adminOrError.id
    );

    // Get updated flag
    const updatedFlag = await featureFlagsService.getFeatureFlag(key!);

    return NextResponse.json({
      success: true,
      flag: updatedFlag,
    });
  } catch (error: unknown) {
    logError('Error updating feature flag', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const params = await context.params;
    const key = params.key;

    // Check if flag exists
    const existing = await featureFlagsService.getFeatureFlag(key);
    if (!existing) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    // Delete flag
    await featureFlagsService.deleteFeatureFlag(key);

    return NextResponse.json({
      success: true,
      message: 'Flag deleted successfully',
    });
  } catch (error: unknown) {
    logError('Error deleting feature flag', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
