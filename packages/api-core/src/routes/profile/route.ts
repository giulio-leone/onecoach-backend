/**
 * User Profile API Route
 *
 * GET:    Restituisce il profilo dell'utente autenticato
 * PUT:    Aggiorna il profilo con le informazioni fornite
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ActivityLevel, DietType, Sex, WeightUnit } from '@prisma/client';
import { prisma, requireAuth, userProfileService } from '@giulio-leone/lib-core';
import {
  convertDecimalToNumber,
  isError,
  isPrismaError,
  isZodError,
  logError,
  logger,
  mapErrorToApiResponse,
} from '@giulio-leone/lib-shared';
export const dynamic = 'force-dynamic';

// Prisma richiede il runtime Node.js
// Schema Zod semplificato che accetta null correttamente
// I valori vengono già normalizzati prima della validazione
const profileSchema = z.object({
  age: z.number().min(10).max(120).nullable().optional(),
  sex: z.nativeEnum(Sex).nullable().optional(),
  heightCm: z.number().min(100).max(250).nullable().optional(),
  weightKg: z.number().min(30).max(250).nullable().optional(),
  weightUnit: z.nativeEnum(WeightUnit).optional(),
  activityLevel: z.nativeEnum(ActivityLevel).nullable().optional(),
  trainingFrequency: z.number().min(1).max(14).nullable().optional(),
  dailyCalories: z.number().min(800).max(7000).nullable().optional(),
  nutritionGoals: z.array(z.string()).optional().default([]),
  workoutGoals: z.array(z.string()).optional().default([]),
  equipment: z.array(z.string()).optional().default([]),
  dietaryRestrictions: z.array(z.string()).optional().default([]),
  dietaryPreferences: z.array(z.string()).optional().default([]),
  dietType: z.nativeEnum(DietType).nullable().optional(),
  healthNotes: z.string().max(2000).nullable().optional(),
  autoRecalculateMacros: z.boolean().optional(),
});

export async function GET() {
  try {
    const userOrError = await requireAuth();

    if (userOrError instanceof NextResponse) {
      return userOrError;
    }

    // Verifica che userOrError abbia un id valido
    if (!userOrError.id || typeof userOrError.id !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[PROFILE GET] User ID non valido:', userOrError);
      }
      return NextResponse.json(
        { error: 'Errore di autenticazione: ID utente non valido' },
        { status: 401 }
      );
    }

    // Verifica che l'utente esista ancora nel database
    const userExists = await prisma.users.findUnique({
      where: { id: userOrError.id },
      select: { id: true, status: true },
    });

    if (!userExists) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[PROFILE GET] User not found in database:', userOrError.id);
      }
      return NextResponse.json(
        { error: 'Utente non trovato nel database. Effettua il login di nuovo.' },
        { status: 401 }
      );
    }

    if (userExists.status !== 'ACTIVE') {
      if (process.env.NODE_ENV === 'development') {
        logger.error('[PROFILE GET] User is not ACTIVE:', { userId: userOrError.id, status: userExists.status });
      }
      return NextResponse.json(
        { error: 'Account non attivo. Contatta il supporto.' },
        { status: 403 }
      );
    }

    const profile = await userProfileService.getSerialized(userOrError.id);

    // Carica anche i dati dell'utente (autoRecalculateMacros, credits)
    const user = await prisma.users.findUnique({
      where: { id: userOrError.id },
      select: { autoRecalculateMacros: true, credits: true, name: true, email: true },
    });

    const response = {
      success: true,
      profile: {
        ...profile,
        user: {
          autoRecalculateMacros: user?.autoRecalculateMacros ?? false,
          credits: user?.credits ?? 0,
          name: user?.name ?? null,
          email: user?.email ?? null,
        },
      },
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    if (err instanceof Error) {
      logError('Errore nel recupero del profilo', err);

      if (process.env.NODE_ENV === 'development') {
        if (isError(err)) {
          logger.error('[PROFILE GET] Error name:', err.name);
          logger.error('[PROFILE GET] Error message:', err.message);
          logger.error('[PROFILE GET] Error stack:', err.stack);
        }
      }
      if (isPrismaError(err)) {
        logger.error('[PROFILE GET] Prisma error code:', err.code);
        logger.error('[PROFILE GET] Prisma error meta:', err.meta);
      }
    }

    const { response, status } = mapErrorToApiResponse(err);
    return NextResponse.json(response, { status });
  }
}

export async function PUT(_req: Request) {
  const userOrError = await requireAuth();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  // Verifica che userOrError abbia un id valido
  if (!userOrError.id || typeof userOrError.id !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      logger.error('[PROFILE PUT] User ID non valido:', userOrError);
    }
    return NextResponse.json(
      { error: 'Errore di autenticazione: ID utente non valido' },
      { status: 401 }
    );
  }

  // Verifica che l'utente esista ancora nel database
  const userExists = await prisma.users.findUnique({
    where: { id: userOrError.id },
    select: { id: true, status: true },
  });

  if (!userExists) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('[PROFILE PUT] User not found in database:', userOrError.id);
    }
    return NextResponse.json(
      { error: 'Utente non trovato nel database. Effettua il login di nuovo.' },
      { status: 401 }
    );
  }

  if (userExists.status !== 'ACTIVE') {
    if (process.env.NODE_ENV === 'development') {
      logger.error('[PROFILE PUT] User is not ACTIVE:', { userId: userOrError.id, status: userExists.status });
    }
    return NextResponse.json(
      { error: 'Account non attivo. Contatta il supporto.' },
      { status: 403 }
    );
  }

  try {
    const body = await _req.json();

    // Helper per normalizzare valori numerici
    const normalizeNumber = (value: string | number | null | undefined): number | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const num = typeof value === 'number' ? value : Number(value);
      return isNaN(num) ? null : num;
    };

    // Helper per normalizzare valori enum/string - valida solo enum validi
    const normalizeEnum = <T extends string>(
      value: string | number | null | undefined,
      validValues: readonly T[]
    ): T | null => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const str = String(value).trim();
      if (str === '') {
        return null;
      }
      // Verifica se il valore è un enum valido
      if (validValues.includes(str as T)) {
        return str as T;
      }
      // Se non è un enum valido, ritorna null invece di fallire
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`Invalid enum value: ${str}, expected one of: ${validValues.join(', ')}`);
      }
      return null;
    };

    // Normalizza i valori: converte stringhe vuote, undefined, NaN in null
    // Assicuriamoci che tutti i campi siano sempre presenti, anche se undefined nel body originale
    const normalizedBody = {
      age: normalizeNumber(body.age ?? null),
      sex: normalizeEnum(body.sex ?? null, Object.values(Sex) as Sex[]),
      heightCm: normalizeNumber(body.heightCm ?? null),
      weightKg: normalizeNumber(body.weightKg ?? null),
      weightUnit:
        normalizeEnum(body.weightUnit ?? null, Object.values(WeightUnit) as WeightUnit[]) ?? 'KG',
      activityLevel: normalizeEnum(
        body.activityLevel ?? null,
        Object.values(ActivityLevel) as ActivityLevel[]
      ),
      trainingFrequency: normalizeNumber(body.trainingFrequency ?? null),
      dailyCalories: normalizeNumber(body.dailyCalories ?? null),
      // nutritionGoals ora contiene direttamente gli ID (CUIDs), non più enum values
      nutritionGoals: Array.isArray(body.nutritionGoals)
        ? body.nutritionGoals.filter(
            (id: string | number | boolean | null | undefined): id is string =>
              typeof id === 'string' && id.length > 0
          )
        : [],
      // workoutGoals ora contiene direttamente gli ID (CUIDs), non più enum values
      workoutGoals: Array.isArray(body.workoutGoals)
        ? body.workoutGoals.filter(
            (id: string | number | boolean | null | undefined): id is string =>
              typeof id === 'string' && id.length > 0
          )
        : [],
      // equipment ora contiene direttamente gli ID (CUIDs), non più nomi
      equipment: Array.isArray(body.equipmentIds)
        ? body.equipmentIds.filter(
            (id: string | number | boolean | null | undefined): id is string =>
              typeof id === 'string' && id.length > 0
          )
        : [],
      dietaryRestrictions: Array.isArray(body.dietaryRestrictions) ? body.dietaryRestrictions : [],
      dietaryPreferences: Array.isArray(body.dietaryPreferences) ? body.dietaryPreferences : [],
      dietType: normalizeEnum(body.dietType ?? null, Object.values(DietType) as DietType[]),
      healthNotes:
        body.healthNotes === '' || body.healthNotes === undefined || body.healthNotes === null
          ? null
          : String(body.healthNotes),
      autoRecalculateMacros:
        body.autoRecalculateMacros !== undefined ? Boolean(body.autoRecalculateMacros) : undefined,
    };

    // Normalized body è pronto per la validazione
    const parsed = profileSchema.parse(normalizedBody);

    // Aggiorna il profilo (equipment contiene già gli ID)
    const updatedProfile = await userProfileService.update(userOrError.id, parsed);

    // Aggiorna autoRecalculateMacros se presente
    if (parsed.autoRecalculateMacros !== undefined) {
      await prisma.users.update({
        where: { id: userOrError.id },
        data: { autoRecalculateMacros: parsed.autoRecalculateMacros },
      });
    }

    if (!updatedProfile) {
      throw new Error('Profilo non trovato dopo aggiornamento');
    }

    // Carica i dati aggiornati dell'utente
    const user = await prisma.users.findUnique({
      where: { id: userOrError.id },
      select: { autoRecalculateMacros: true, credits: true },
    });

    // Serializza il profilo per convertire Decimal a numero in modo sicuro
    type SerializedProfile = {
      id: string;
      userId: string;
      age: number | null;
      sex: Sex | null;
      heightCm: number | null;
      weightKg: number | null;
      activityLevel: ActivityLevel | null;
      trainingFrequency: number | null;
      dailyCalories: number | null;
      nutritionGoals: string[];
      workoutGoals: string[];
      equipment: string[];
      dietaryRestrictions: string[];
      dietaryPreferences: string[];
      dietType: DietType | null;
      healthNotes: string | null;
      createdAt: Date;
      updatedAt: Date;
    };

    const serializedProfile: SerializedProfile = {
      id: updatedProfile.id,
      userId: updatedProfile.userId ?? '',
      age: updatedProfile.age,
      sex: updatedProfile.sex,
      heightCm: updatedProfile.heightCm,
      weightKg: convertDecimalToNumber(updatedProfile.weightKg),
      activityLevel: updatedProfile.activityLevel,
      trainingFrequency: updatedProfile.trainingFrequency,
      dailyCalories: updatedProfile.dailyCalories,
      nutritionGoals: updatedProfile.nutritionGoals,
      workoutGoals: updatedProfile.workoutGoals,
      equipment: updatedProfile.equipment,
      dietaryRestrictions: updatedProfile.dietaryRestrictions,
      dietaryPreferences: updatedProfile.dietaryPreferences,
      dietType: updatedProfile.dietType,
      healthNotes: updatedProfile.healthNotes,
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    };

    return NextResponse.json({
      success: true,
      profile: {
        ...serializedProfile,
        user: {
          autoRecalculateMacros: user?.autoRecalculateMacros ?? false,
          credits: user?.credits ?? 0,
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logError('Errore durante il salvataggio del profilo', error);

      if (process.env.NODE_ENV === 'development') {
        if (isError(error)) {
          logger.error('Error message:', error.message);
          logger.error('Error stack:', error.stack);
        }
      }
      if (isZodError(error)) {
        logger.error('Zod validation errors:', JSON.stringify(error.issues, null, 2));
      }
      if (isPrismaError(error)) {
        logger.error('Prisma error code:', error.code);
        logger.error('Prisma error meta:', error.meta);
      }
    }

    if (isZodError(error)) {
      return NextResponse.json(
        {
          error: 'Dati profilo non validi',
          details: error.flatten(),
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
