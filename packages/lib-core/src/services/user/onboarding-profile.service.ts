/**
 * Onboarding Profile Service
 *
 * Servizio dedicato per salvare i dati del profilo durante l'onboarding
 * Segue principi SOLID: Single Responsibility
 */

import 'server-only';
import { prisma } from '@giulio-leone/lib-core';
import { userProfileService } from '@giulio-leone/lib-core';
import { logError } from '@giulio-leone/lib-shared';

interface ProfileData {
  name?: string;
  age?: number;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm?: number;
  weightKg?: number;
}

/**
 * Salva i dati del profilo durante l'onboarding
 * Non blocca il completamento dello step se il salvataggio fallisce
 */
export async function saveOnboardingProfile(
  userId: string,
  profileData: ProfileData
): Promise<void> {
  try {
    // Aggiorna il nome dell'utente se presente
    if (profileData.name?.trim()) {
      await prisma.users.update({
        where: { id: userId },
        data: { name: profileData.name.trim() },
      });
    }

    // Aggiorna il profilo utente
    await userProfileService.update(userId, {
      age: profileData.age ?? null,
      sex: profileData.sex ?? null,
      heightCm: profileData.heightCm ?? null,
      weightKg: profileData.weightKg ?? null,
    });
  } catch (error: unknown) {
    // Log l'errore ma non bloccare il completamento dello step
    logError('Errore salvataggio profilo durante onboarding', error);
    // Non rilanciare l'errore per non bloccare il completamento dello step
  }
}
