/**
 * Progress Snapshots API
 *
 * GET  /api/analytics/snapshots - Get snapshot history
 * POST /api/analytics/snapshots - Generate new snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import {
  generateProgressSnapshot,
  getProgressSnapshots,
  getLatestProgressSnapshot,
  backfillSnapshots,
} from '@giulio-leone/lib-analytics/progress-snapshot.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  latest: z.string().optional(),
});

const createSchema = z.object({
  date: z.string().optional(),
  backfill: z.boolean().optional(),
  backfillStartDate: z.string().optional(),
  backfillEndDate: z.string().optional(),
});

/**
 * GET /api/analytics/snapshots
 *
 * Get progress snapshot history.
 *
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - latest: 'true' to get only the latest snapshot
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
      latest: searchParams.get('latest') || undefined,
    });

    // If latest requested, return only the latest snapshot
    if (query.latest === 'true') {
      const snapshot = await getLatestProgressSnapshot((userOrError as { id: string }).id);
      return NextResponse.json({
        success: true,
        snapshot,
      });
    }

    if (!query.startDate || !query.endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const snapshots = await getProgressSnapshots((userOrError as { id: string }).id, startDate, endDate);

    return NextResponse.json({
      success: true,
      snapshots,
    });
  } catch (_error: unknown) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: _error.issues },
        { status: 400 }
      );
    }

    const message = _error instanceof Error ? _error.message : 'Error fetching snapshots';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/analytics/snapshots
 *
 * Generate a new progress snapshot.
 *
 * Body:
 * - date: ISO date string (optional, defaults to today)
 * - backfill: boolean (optional, for generating multiple snapshots)
 * - backfillStartDate: ISO date string (required if backfill=true)
 * - backfillEndDate: ISO date string (required if backfill=true)
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _request.json();
    const validated = createSchema.parse(body);

    // Backfill mode - generate multiple snapshots
    if (validated.backfill) {
      if (!validated.backfillStartDate || !validated.backfillEndDate) {
        return NextResponse.json(
          { error: 'backfillStartDate and backfillEndDate are required for backfill' },
          { status: 400 }
        );
      }

      const startDate = new Date(validated.backfillStartDate);
      const endDate = new Date(validated.backfillEndDate);

      const snapshots = await backfillSnapshots((userOrError as { id: string }).id, startDate, endDate);

      return NextResponse.json({
        success: true,
        snapshots,
        count: snapshots.length,
      });
    }

    // Single snapshot mode
    const date = validated.date ? new Date(validated.date) : new Date();
    const snapshot = await generateProgressSnapshot((userOrError as { id: string }).id, date);

    return NextResponse.json({
      success: true,
      snapshot,
    });
  } catch (_error: unknown) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: _error.issues },
        { status: 400 }
      );
    }

    const message = _error instanceof Error ? _error.message : 'Error generating snapshot';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
