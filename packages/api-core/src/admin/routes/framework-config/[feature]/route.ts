/**
 * AI Framework Feature Configuration API
 *
 * GET    /api/admin/framework-config/:feature - Get feature config
 * PUT    /api/admin/framework-config/:feature - Update feature config
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

    const config = await AIFrameworkConfigService.getConfig(feature);

    return NextResponse.json({
      feature,
      isEnabled: config.isEnabled,
      config: config.config,
      description: AIFrameworkConfigService.getFeatureDescription(feature),
    });
  } catch (_error: unknown) {
    return NextResponse.json(
      {
        error: _error instanceof Error ? _error.message : 'Failed to fetch config',
      },
      { status: _error instanceof Error && _error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: RouteParams }) {
  const userOrError = await requireAdmin();
  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  // TypeScript type narrowing: userOrError is now definitely User
  // Use explicit type to help TypeScript understand the narrowed type
  const user = userOrError as Awaited<
    ReturnType<typeof import('@giulio-leone/lib-core').getCurrentUser>
  > & { id: string };

  try {
    const body = await request.json();

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

    // Validate config if provided
    if (body.config) {
      const validation = AIFrameworkConfigService.validateConfig(feature, body.config);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'Invalid configuration',
            errors: validation.errors,
          },
          { status: 400 }
        );
      }
    }

    const updated = await AIFrameworkConfigService.updateConfig({
      feature,
      isEnabled: body.isEnabled,
      config: body.config,
      updatedBy: user.id,
      changeReason: body.changeReason,
    });

    return NextResponse.json({
      success: true,
      config: updated,
    });
  } catch (_error: unknown) {
    return NextResponse.json(
      {
        error: _error instanceof Error ? _error.message : 'Failed to update config',
      },
      { status: _error instanceof Error && _error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
