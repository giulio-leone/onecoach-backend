/**
 * Database Initialization API Route
 *
 * Endpoint per inizializzare il database con dati necessari se mancanti.
 * Utile per verificare e inizializzare il database dopo il deploy.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@giulio-leone/lib-core';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(_request: Request) {
  // L'inizializzazione del database viene fatta automaticamente durante il build
  // tramite lo script migrate-and-seed.sh. Questo endpoint è disabilitato per
  // evitare problemi con il bundle di Next.js che cerca di includere i file seed.
  return NextResponse.json(
    {
      success: false,
      message:
        'Database initialization is done automatically during build. Use GET to check status.',
    },
    { status: 405 }
  );
}

export async function GET(_request: Request) {
  try {
    // Verifica lo stato del database senza inizializzarlo
    const essentialData = await prisma.$transaction(async (tx) => {
      const [
        workoutGoalsCount,
        nutritionGoalsCount,
        policiesCount,
        exerciseTypesCount,
        adminCount,
      ] = await Promise.all([
        tx.workout_goals.count().catch(() => 0),
        tx.nutrition_goals.count().catch(() => 0),
        tx.policies.count().catch(() => 0),
        tx.exercise_types.count().catch(() => 0),
        tx.users.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }).catch(() => 0),
      ]);

      return {
        workoutGoals: workoutGoalsCount,
        nutritionGoals: nutritionGoalsCount,
        policies: policiesCount,
        exerciseTypes: exerciseTypesCount,
        admins: adminCount,
        isInitialized:
          workoutGoalsCount > 0 &&
          nutritionGoalsCount > 0 &&
          policiesCount > 0 &&
          exerciseTypesCount > 0,
      };
    });

    return NextResponse.json({
      success: true,
      status: essentialData,
    });
  } catch (error: unknown) {
    logger.error('❌ Database status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
