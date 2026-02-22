import { NextResponse } from 'next/server';
import { requireAuth } from '@giulio-leone/lib-core';
import { ExerciseService } from '@giulio-leone/lib-exercise/exercise.service';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

/**
 * Autocomplete endpoint for exercise search
 * Optimized for real-time search with BM25 ranking and locale prioritization
 *
 * Query parameters:
 * - q: search term (required, min 2 characters)
 * - locale: preferred locale (optional, defaults to 'en')
 * - limit: max results (optional, default 10, max 50)
 * - muscles: comma-separated muscle names (optional)
 * - bodyParts: comma-separated body parts (optional)
 * - equipments: comma-separated equipment names (optional)
 */
export async function GET(_req: Request): Promise<Response> {
  const userOrError: any = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const url = new URL(_req.url);
    const query = url.searchParams.get('q')?.trim();
    const locale = url.searchParams.get('locale')?.toLowerCase() || 'en';
    const limitParam = url.searchParams.get('limit');
    const limit = Math.min(parseInt(limitParam || '10', 10), 50);

    // Require minimum search term length
    if (!query || query.length < 2) {
      return NextResponse.json({
        data: [],
        total: 0,
        message: 'Query must be at least 2 characters',
      });
    }

    // Parse optional filters (priorità a IDs se disponibili)
    const muscleIds = url.searchParams.get('muscleIds')?.split(',').filter(Boolean);
    const muscles = url.searchParams.get('muscles')?.split(',').filter(Boolean);
    const bodyPartIds = url.searchParams.get('bodyPartIds')?.split(',').filter(Boolean);
    const bodyParts = url.searchParams.get('bodyParts')?.split(',').filter(Boolean);
    const equipmentIds = url.searchParams.get('equipmentIds')?.split(',').filter(Boolean);
    const equipments = url.searchParams.get('equipments')?.split(',').filter(Boolean);

    // Perform search with BM25 ranking
    const results = await ExerciseService.search(query, {
      locale,
      page: 1,
      pageSize: limit,
      muscleIds: muscleIds ?? muscles, // Preferisci IDs, fallback a nomi
      bodyPartIds: bodyPartIds ?? bodyParts,
      equipmentIds: equipmentIds ?? equipments,
      includeTranslations: false,
      includeUnapproved: false,
    });

    return NextResponse.json({
      data: results,
      total: results.length,
      query,
      locale,
    });
  } catch (error: unknown) {
    logger.error('[API] exercises/autocomplete GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[API] exercises/autocomplete error details:', {
      message: errorMessage,
      query: new URL(_req.url).searchParams.get('q'),
      locale: new URL(_req.url).searchParams.get('locale'),
    });
    return NextResponse.json(
      { error: 'Errore nella ricerca degli esercizi', details: errorMessage },
      { status: 500 }
    );
  }
}
