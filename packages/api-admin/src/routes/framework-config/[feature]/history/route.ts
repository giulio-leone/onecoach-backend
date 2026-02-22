/**
 * AI Framework Feature History API
 *
 * GET /api/admin/framework-config/:feature/history - Get config history
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';

export const dynamic = 'force-dynamic';
import {
  AIFrameworkConfigService,
  FrameworkFeature,
} from '@giulio-leone/lib-ai';

type RouteParams = Promise<{ feature: string }>;

export async function GET(_request: NextRequest, context: { params: RouteParams }) {
  try {
    await requireAdmin();

    const { feature: featureParam } = await context.params;
    const feature = featureParam as FrameworkFeature;

    // Validate feature
    if (!Object.values(FrameworkFeature).includes(feature)) {
      return NextResponse.json(
        {
          error: 'Invalid feature',
          validFeatures: Object.values(FrameworkFeature),
        },
        { status: 400 }
      );
    }

    const history = await AIFrameworkConfigService.getHistory(feature);

    return NextResponse.json({
      feature,
      history,
    });
  } catch (_error: unknown) {
    return NextResponse.json(
      {
        error: _error instanceof Error ? _error.message : 'Failed to fetch history',
      },
      { status: _error instanceof Error && _error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
