/**
 * Analytics Overview API
 *
 * GET /api/analytics/overview - Get comprehensive analytics report
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { generateAnalyticsReport } from '@giulio-leone/lib-analytics/analytics.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).optional(),
});

/**
 * GET /api/analytics/overview
 *
 * Get comprehensive analytics report for the authenticated user.
 *
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - period: '7d' | '30d' | '90d' | '1y' (optional, default: '30d')
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
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

    // Generate analytics report
    const user = userOrError as { id: string };
    const report = await generateAnalyticsReport(user.id, startDate, endDate);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (_error: unknown) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: _error.issues },
        { status: 400 }
      );
    }

    const message = _error instanceof Error ? _error.message : 'Error generating analytics report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
