/**
 * AI Framework Configuration Admin API
 *
 * GET    /api/admin/framework-config         - List all framework features
 * GET    /api/admin/framework-config/:feature - Get specific feature config
 * PUT    /api/admin/framework-config/:feature - Update feature config
 * POST   /api/admin/framework-config/initialize - Initialize defaults
 * GET    /api/admin/framework-config/:feature/history - Get config history
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';

export const dynamic = 'force-dynamic';
import {
  AIFrameworkConfigService,
  FrameworkFeature,
} from '@giulio-leone/lib-ai';

export async function GET(_request: NextRequest) {
  try {
    const userOrError = await requireAdmin();
    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    const configs = await AIFrameworkConfigService.getAllConfigs();

    // Enrich with descriptions
    const enriched = configs.map((config) => ({
      ...config,
      description:
        config.description ||
        AIFrameworkConfigService.getFeatureDescription(config.feature as FrameworkFeature),
    }));

    return NextResponse.json({
      configs: enriched,
      features: Object.values(FrameworkFeature),
      descriptions: AIFrameworkConfigService.getAllFeatureDescriptions(),
    });
  } catch (_error: unknown) {
    return NextResponse.json(
      {
        error: _error instanceof Error ? _error.message : 'Failed to fetch framework configs',
      },
      { status: _error instanceof Error && _error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userOrError = await requireAdmin();
    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    const body = await request.json();

    if (body.action === 'initialize') {
      await AIFrameworkConfigService.initializeDefaults(userOrError.id);
      const configs = await AIFrameworkConfigService.getAllConfigs();

      return NextResponse.json({
        success: true,
        message: 'Framework configs initialized',
        configs,
      });
    }

    return NextResponse.json(
      {
        error: 'Invalid action',
      },
      { status: 400 }
    );
  } catch (_error: unknown) {
    return NextResponse.json(
      {
        error: _error instanceof Error ? _error.message : 'Failed to initialize configs',
      },
      { status: _error instanceof Error && _error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
