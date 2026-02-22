/**
 * Admin Feature Flags API Route
 *
 * GET: List all feature flags
 * POST: Create a new feature flag
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { featureFlagsService } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import type { RolloutStrategy } from '@giulio-leone/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const flags = await featureFlagsService.getAllFeatureFlags();

    // Enrich with metrics
    const flagsWithMetrics = await Promise.all(
      flags.map(async (flag) => {
        const metrics = await featureFlagsService.getFlagMetricsAggregated(flag.key);
        const avgRating = await featureFlagsService.getFlagAverageRating(flag.key);

        return {
          ...flag,
          metrics,
          avgRating,
        };
      })
    );

    return NextResponse.json({
      success: true,
      flags: flagsWithMetrics,
    });
  } catch (error: unknown) {
    logError('Error fetching feature flags', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function POST(req: Request) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const body = await req.json();
    const { key, name, description, enabled, strategy, config, metadata } = body;

    // Validation
    if (!key || !name) {
      return NextResponse.json({ error: 'key and name are required' }, { status: 400 });
    }

    if (!strategy) {
      return NextResponse.json({ error: 'strategy is required' }, { status: 400 });
    }

    // Check if flag already exists
    const existing = await featureFlagsService.getFeatureFlag(key);
    if (existing) {
      return NextResponse.json({ error: 'Flag with this key already exists' }, { status: 409 });
    }

    // Create flag
    await featureFlagsService.createFeatureFlag(
      {
        key,
        name,
        description,
        enabled: enabled ?? false,
        strategy: strategy as RolloutStrategy,
        config,
        metadata,
      },
      adminOrError.id
    );

    // Get created flag
    const flag = await featureFlagsService.getFeatureFlag(key!);

    return NextResponse.json({
      success: true,
      flag,
    });
  } catch (error: unknown) {
    logError('Error creating feature flag', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
