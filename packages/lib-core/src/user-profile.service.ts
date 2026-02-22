/**
 * User Profile Service
 *
 * Gestione profilo utente
 * Implementa IUserProfileService contract
 */

import { prisma } from './prisma';
import type { user_profiles } from '@prisma/client';
import type { IUserProfileService, UserProfileInput } from '@giulio-leone/contracts';
import { createId } from '@giulio-leone/lib-shared/id-generator';

import { logger } from '@giulio-leone/lib-shared';
function sanitizeStringArray(values?: string[] | null): string[] {
  if (!values || values.length === 0) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value: unknown) => (typeof value === 'string' ? value.trim() : ''))
        .filter((entry): entry is string => Boolean(entry))
    )
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
      logger.warn('Error converting weightKg to number:', { error });
      weightKgValue = null;
    }
  }

  return {
    ...profile,
    weightKg: weightKgValue,
  };
}

export class UserProfileService implements IUserProfileService {
  async getOrCreate(userId: string): Promise<user_profiles> {
    try {
      const existing = await prisma.user_profiles.findUnique({
        where: { userId },
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
      });

      return newProfile as user_profiles;
    } catch (error: unknown) {
      logger.error('[UserProfileService.getOrCreate]', error);
      if (error instanceof Error) {
        logger.error('[UserProfileService.getOrCreate] Error message:', error.message);
        logger.error('[UserProfileService.getOrCreate] Error stack:', error.stack);
      }
      throw error;
    }
  }

  async getSerialized(
    userId: string
  ): Promise<Omit<user_profiles, 'weightKg'> & { weightKg: number | null }> {
    try {
      const profile = await this.getOrCreate(userId);
      const serialized = serializeProfile(profile);
      if (!serialized) {
        logger.error('[UserProfileService.getSerialized] Serialization returned null');
        throw new Error('Impossibile serializzare il profilo');
      }
      return serialized;
    } catch (error: unknown) {
      logger.error('[UserProfileService.getSerialized]', error);
      throw error;
    }
  }

  async update(userId: string, input: UserProfileInput): Promise<user_profiles> {
    try {
      await this.getOrCreate(userId);

      // Prepara i dati con conversioni appropriate
      // Using Record type to ensure new fields work even with stale Prisma type definitions
      const updateData: Record<string, unknown> = {};

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
        updateData.weightKg = input.weightKg !== null ? input.weightKg : null;
      }
      if (input.weightUnit !== undefined && input.weightUnit !== null) {
        updateData.weightUnit = input.weightUnit;
      }
      if (input.weightIncrement !== undefined) {
        updateData.weightIncrement = input.weightIncrement !== null ? input.weightIncrement : null;
      }
      if (input.activityLevel !== undefined) {
        updateData.activityLevel = input.activityLevel !== null ? input.activityLevel : null;
      }
      if (input.trainingFrequency !== undefined) {
        updateData.trainingFrequency =
          input.trainingFrequency !== null ? input.trainingFrequency : null;
      }
      if (input.sessionDurationMinutes !== undefined) {
        updateData.sessionDurationMinutes =
          input.sessionDurationMinutes !== null ? input.sessionDurationMinutes : null;
      }
      if (input.dailyCalories !== undefined) {
        updateData.dailyCalories = input.dailyCalories !== null ? input.dailyCalories : null;
      }
      if (input.nutritionGoals !== undefined) {
        updateData.nutritionGoals = sanitizeStringArray(input.nutritionGoals);
      }
      if (input.workoutGoals !== undefined) {
        updateData.workoutGoals = sanitizeStringArray(input.workoutGoals);
      }
      if (input.equipment !== undefined) {
        updateData.equipment = sanitizeStringArray(input.equipment);
      }
      if (input.dietaryRestrictions !== undefined) {
        updateData.dietaryRestrictions = sanitizeStringArray(input.dietaryRestrictions);
      }
      if (input.dietaryPreferences !== undefined) {
        updateData.dietaryPreferences = sanitizeStringArray(input.dietaryPreferences);
      }
      if (input.dietType !== undefined) {
        updateData.dietType = input.dietType !== null ? input.dietType : null;
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
      logger.error('[UserProfileService.update]', error);
      if (error instanceof Error) {
        logger.error('[UserProfileService.update] Error message:', error.message);
        logger.error('[UserProfileService.update] Error stack:', error.stack);
      }
      throw error;
    }
  }
}

export const userProfileService: UserProfileService = new UserProfileService();
