/**
 * Admin Feature Flag Feedback API Route
 *
 * GET: Get feedback for a specific feature flag
 * POST: Submit feedback for a feature flag (admin or user)
 */

import { NextResponse } from 'next/server';
import { requireAdmin, requireAuth } from '@giulio-leone/lib-core';
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

    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');

    const feedback = await featureFlagsService.getFlagFeedback(key, {
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
    });

    const avgRating = await featureFlagsService.getFlagAverageRating(key);

    return NextResponse.json({
      success: true,
      feedback,
      avgRating,
    });
  } catch (error: unknown) {
    logError('Error fetching flag feedback', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function POST(req: Request, context: RouteContext) {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const params = await context.params;
    const key = params.key;

    const body = await req.json();

    const { rating, comment, metadata } = body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating is required and must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Submit feedback
    await featureFlagsService.submitFlagFeedback({
      flagKey: key!,
      userId: userOrError.id,
      rating: parseInt(rating),
      comment,
      metadata,
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error: unknown) {
    logError('Error submitting flag feedback', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
