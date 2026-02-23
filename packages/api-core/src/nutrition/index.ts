/**
 * @giulio-leone/api-nutrition
 *
 * API routes per il dominio nutrizione
 * Esporta route handlers che possono essere usati in apps/next/app/api/nutrition/*
 */

import { getService } from '@giulio-leone/lib-registry';
import type { NextRequest } from 'next/server';

/**
 * GET /api/nutrition
 * Lista tutti i piani nutrizionali dell'utente
 */
export async function GET(_request: NextRequest) {
  try {
    const nutritionService = getService('nutrition');
    // getAll() doesn't accept filters per contract
    const result = await nutritionService.getAll();

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result.data);
  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nutrition
 * Crea un nuovo piano nutrizionale
 */
export async function POST(request: NextRequest) {
  try {
    const nutritionService = getService('nutrition');
    const body = await request.json();

    const result = await nutritionService.create(body);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result.data, { status: 201 });
  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
