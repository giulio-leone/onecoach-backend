/**
 * Analytics Charts API
 *
 * GET /api/analytics/charts/[type] - Get chart data
 *
 * Supported types:
 * - weight: Weight progress chart
 * - volume: Workout volume chart
 * - macros: Nutrition macros chart
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import {
  generateWeightChart,
  generateVolumeChart,
  generateMacrosChart,
} from '@giulio-leone/lib-analytics/analytics.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
type RouteParams = Promise<{ type: string }>;

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).optional(),
  plan: z.string().optional(), // For macros chart
});

/**
 * GET /api/analytics/charts/[type]
 *
 * Get chart data for visualization.
 *
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - period: '7d' | '30d' | '90d' | '1y' (optional, default: '30d')
 * - plan: Nutrition plan ID (required for macros chart)
 */
export async function GET(
  _request: NextRequest,
  context: { params: RouteParams }
): Promise<NextResponse> {
  const params = await context.params;
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const { searchParams } = new URL(_request.url);
    const query = querySchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      period: searchParams.get('period') || '30d',
      plan: searchParams.get('planId') || undefined,
    });

    // Calculate date range
    let startDate: Date;
    let endDate = new Date();

    if (query.startDate) {
      startDate = new Date(query.startDate);
    } else {
      const daysAgo = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      }[query.period || '30d'];

      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
    }

    if (query.endDate) {
      endDate = new Date(query.endDate);
    }

    // Generate chart data based on type
    let chartData;

    switch (params.type) {
      case 'weight':
        chartData = await generateWeightChart((userOrError as { id: string }).id, startDate, endDate);
        break;

      case 'volume':
        chartData = await generateVolumeChart((userOrError as { id: string }).id, startDate, endDate);
        break;

      case 'macros':
        if (!query.plan) {
          return NextResponse.json(
            { error: 'planId is required for macros chart' },
            { status: 400 }
          );
        }
        chartData = await generateMacrosChart((userOrError as { id: string }).id, query.plan, startDate, endDate);
        break;

      default:
        return NextResponse.json({ error: 'Invalid chart type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      chart: chartData,
    });
  } catch (_error: unknown) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: _error.issues },
        { status: 400 }
      );
    }

    const message = _error instanceof Error ? _error.message : 'Error generating chart';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
