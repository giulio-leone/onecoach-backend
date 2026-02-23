import { prisma, Prisma } from '@giulio-leone/lib-core';
import { logger } from '@giulio-leone/lib-shared';
import { Sex, WeightUnit, ActivityLevel, type user_profiles } from '@prisma/client';

import { createId } from '@giulio-leone/lib-core';

const log = logger.child('UserProfileService');

export interface UserProfileInput {
  age?: number | null;
  sex?: Sex | null;
  heightCm?: number | null;
  weightKg?: number | null;
  weightUnit?: WeightUnit;
  activityLevel?: ActivityLevel | null;
  trainingFrequency?: number | null;
  dailyCalories?: number | null;
  nutritionGoals?: string[] | null; // Array of NutritionGoal IDs (CUIDs)
  workoutGoals?: string[] | null; // Array of WorkoutGoal IDs
  equipment?: string[] | null;
  dietaryRestrictions?: string[] | null;
  dietaryPreferences?: string[] | null;
  healthNotes?: string | null;
}

function sanitizeStringArray(values?: string[] | null): string[] {
  if (!values || values.length === 0) {
    return [];
  }

  return Array.from(
    new Set(values.map((value) => value?.trim()).filter((entry): entry is string => Boolean(entry)))
  );
}

// Helper per serializzare il profilo convertendo Decimal a numero
function serializeProfile(
  profile: user_profiles | null
): (Omit<user_profiles, 'weightKg'> & { weightKg: number | null }) | null {
  if (!profile) {
    return null;
  }

  // Converti Decimal a number in modo sicuro
  let weightKgValue: number | null = null;
  if (profile.weightKg !== null && profile.weightKg !== undefined) {
    try {
      // Prisma Decimal può essere convertito con toString() o toNumber()
      weightKgValue =
        typeof profile.weightKg === 'object' && 'toNumber' in profile.weightKg
          ? (profile.weightKg as { toNumber: () => number }).toNumber()
          : Number(profile.weightKg);

      // Se la conversione fallisce, imposta a null
      if (weightKgValue === null || isNaN(weightKgValue)) {
        weightKgValue = null;
      }
    } catch (error: unknown) {
      log.warn('Error converting weightKg to number', error);
      weightKgValue = null;
    }
  }

  return {
    ...profile,
    weightKg: weightKgValue,
  };
}

export class UserProfileService {
  static async getOrCreate(userId: string): Promise<user_profiles> {
    try {
      // NOTE: Escludo dietType perché la colonna non esiste ancora nel database di produzione
      // Rimuovere questa select quando le migrazioni saranno applicate
      const existing = await prisma.user_profiles.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          age: true,
          sex: true,
          heightCm: true,
          weightKg: true,
          activityLevel: true,
          trainingFrequency: true,
          dailyCalories: true,
          workoutGoal: true,
          equipment: true,
          dietaryRestrictions: true,
          dietaryPreferences: true,
          // dietType: true, // TODO: uncomment quando migrazione applicata
          healthNotes: true,
          createdAt: true,
          updatedAt: true,
          weightUnit: true,
          workoutGoals: true,
          nutritionGoals: true,
        },
      });

      if (existing) {
        return existing as user_profiles;
      }

      const newProfile = await prisma.user_profiles.create({
        data: {
          id: createId(),
          userId,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          userId: true,
          age: true,
          sex: true,
          heightCm: true,
          weightKg: true,
          activityLevel: true,
          trainingFrequency: true,
          dailyCalories: true,
          workoutGoal: true,
          equipment: true,
          dietaryRestrictions: true,
          dietaryPreferences: true,
          // dietType: true, // TODO: uncomment quando migrazione applicata
          healthNotes: true,
          createdAt: true,
          updatedAt: true,
          weightUnit: true,
          workoutGoals: true,
          nutritionGoals: true,
        },
      });

      return newProfile as user_profiles;
    } catch (error: unknown) {
      log.error('[UserProfileService.getOrCreate] Failed', error);
      throw error;
    }
  }

  static async getSerialized(
    userId: string
  ): Promise<Omit<user_profiles, 'weightKg'> & { weightKg: number | null }> {
    try {
      const profile = await this.getOrCreate(userId);
      const serialized = serializeProfile(profile);
      if (!serialized) {
        log.error('[UserProfileService.getSerialized] Serialization returned null');
        throw new Error('Impossibile serializzare il profilo');
      }
      return serialized;
    } catch (error: unknown) {
      log.error('[UserProfileService.getSerialized] Failed', error);
      throw error;
    }
  }

  static async update(userId: string, input: UserProfileInput): Promise<user_profiles> {
    try {
      await this.getOrCreate(userId);

      // Prepara i dati con conversioni appropriate
      // Usiamo un oggetto parziale e poi costruiamo solo i campi che devono essere aggiornati
      const updateData: Prisma.user_profilesUpdateInput = {};

      // Solo se il valore è definito (non undefined), lo aggiungiamo all'update
      if (input.age !== undefined) {
        updateData.age = input.age !== null ? input.age : null;
      }
      if (input.sex !== undefined) {
        updateData.sex = input.sex !== null ? input.sex : null;
      }
      if (input.heightCm !== undefined) {
        updateData.heightCm = input.heightCm !== null ? input.heightCm : null;
      }
      if (input.weightKg !== undefined) {
        // Prisma converte automaticamente number a Decimal per weightKg
        updateData.weightKg = input.weightKg !== null ? input.weightKg : null;
      }
      if (input.weightUnit !== undefined && input.weightUnit !== null) {
        updateData.weightUnit = input.weightUnit;
      }
      if (input.activityLevel !== undefined) {
        updateData.activityLevel = input.activityLevel !== null ? input.activityLevel : null;
      }
      if (input.trainingFrequency !== undefined) {
        updateData.trainingFrequency =
          input.trainingFrequency !== null ? input.trainingFrequency : null;
      }
      if (input.dailyCalories !== undefined) {
        updateData.dailyCalories = input.dailyCalories !== null ? input.dailyCalories : null;
      }
      if (input.nutritionGoals !== undefined) {
        // nutritionGoals contiene direttamente gli ID (CUIDs), non più enum values
        // sanitizeStringArray rimuove valori vuoti e duplicati
        updateData.nutritionGoals = sanitizeStringArray(input.nutritionGoals);
      }
      if (input.workoutGoals !== undefined) {
        // workoutGoals contiene direttamente gli ID (CUIDs), non più enum values
        // sanitizeStringArray rimuove valori vuoti e duplicati
        updateData.workoutGoals = sanitizeStringArray(input.workoutGoals);
      }
      if (input.equipment !== undefined) {
        // equipment ora contiene direttamente gli ID (CUIDs), non più nomi
        // sanitizeStringArray rimuove valori vuoti e duplicati
        updateData.equipment = sanitizeStringArray(input.equipment);
      }
      if (input.dietaryRestrictions !== undefined) {
        updateData.dietaryRestrictions = sanitizeStringArray(input.dietaryRestrictions);
      }
      if (input.dietaryPreferences !== undefined) {
        updateData.dietaryPreferences = sanitizeStringArray(input.dietaryPreferences);
      }
      if (input.healthNotes !== undefined) {
        updateData.healthNotes = input.healthNotes ? input.healthNotes.trim() : null;
      }

      const updated = await prisma.user_profiles.update({
        where: { userId },
        data: updateData,
      });

      return updated;
    } catch (error: unknown) {
      log.error('[UserProfileService.update] Failed', error);
      throw error;
    }
  }
}
