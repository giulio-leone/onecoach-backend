import { prisma } from '@giulio-leone/lib-core';
import { logError } from '@giulio-leone/lib-shared';

import { createId } from '@giulio-leone/lib-core';

/**
 * Onboarding step configuration
 * Definisce i 15 step del wizard
 */
export const ONBOARDING_STEPS = {
  PROFILE_SETUP: 1, // Step 1: Setup profilo base (nome, email, avatar)
  GOALS_SETUP: 2, // Step 2: Obiettivi fitness e nutrition
  DASHBOARD_TOUR: 3, // Step 3: Tour della dashboard
  LIVE_COACH_INTRO: 4, // Step 4: Introduzione al Live Coach
  ANALYTICS_INTRO: 5, // Step 5: Introduzione agli Analytics
  CHAT_INTRO: 6, // Step 6: Introduzione alla Chat AI
  CALENDAR_INTRO: 7, // Step 7: Introduzione al Calendar
  CREATION_INTRO: 8, // Step 8: Creazione workout/nutrition
  PROFILE_COMPLETE: 9, // Step 9: Completamento profilo dettagliato
  CREDITS_INTRO: 10, // Step 10: Sistema crediti AI
  MARKETPLACE_INTRO: 11, // Step 11: Marketplace plans
  AFFILIATES_INTRO: 12, // Step 12: Sistema affiliazione
  COACH_OPTION: 13, // Step 13: Opzione per diventare coach
  SUBSCRIPTION_OFFER: 14, // Step 14: Offerta subscription
  COMPLETION: 15, // Step 15: Completamento onboarding
} as const;

export const TOTAL_STEPS = 15;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

export interface OnboardingProgress {
  id: string;
  userId: string;
  isCompleted: boolean;
  currentStep: number;
  completedSteps: Record<number, boolean>;
  skippedSteps: Record<number, boolean>;
  metadata?: Record<string, unknown>;
  startedAt: Date;
  completedAt: Date | null;
  lastInteraction: Date;
}

export interface StepCompletionInput {
  stepNumber: number;
  skipped?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Onboarding Service
 * Gestisce lo stato e il progresso dell'onboarding wizard
 * Segue i principi SOLID:
 * - Single Responsibility: gestisce solo l'onboarding
 * - Open/Closed: estendibile per nuovi step
 * - Interface Segregation: interfacce specifiche per ogni operazione
 */
export class OnboardingService {
  /**
   * Ottiene o crea il progresso onboarding per un utente
   */
  static async getOrCreate(userId: string): Promise<OnboardingProgress> {
    try {
      const existing = await prisma.user_onboarding_progress.findUnique({
        where: { userId },
      });

      if (existing) {
        return this.deserializeProgress(existing);
      }

      // Crea un nuovo record di progresso
      const newProgress = await prisma.user_onboarding_progress.create({
        data: {
          id: createId(),
          userId,
          isCompleted: false,
          currentStep: ONBOARDING_STEPS.PROFILE_SETUP,
          completedSteps: {},
          skippedSteps: {},
          startedAt: new Date(),
          lastInteraction: new Date(),
        },
      });

      return this.deserializeProgress(newProgress);
    } catch (error: unknown) {
      logError('Errore', error);
      throw error;
    }
  }

  /**
   * Ottiene il progresso corrente per un utente
   */
  static async getProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      const progress = await prisma.user_onboarding_progress.findUnique({
        where: { userId },
      });

      if (!progress) {
        return null;
      }

      return this.deserializeProgress(progress);
    } catch (error: unknown) {
      logError('Errore', error);
      throw error;
    }
  }

  /**
   * Completa uno step dell'onboarding
   */
  static async completeStep(
    userId: string,
    input: StepCompletionInput
  ): Promise<OnboardingProgress> {
    try {
      const { stepNumber, skipped = false, metadata } = input;

      // Validazione step number
      if (stepNumber < 1 || stepNumber > TOTAL_STEPS) {
        throw new Error(`Invalid step number: ${stepNumber}`);
      }

      // Ottieni o crea il progresso
      const currentProgress = await this.getOrCreate(userId);

      // Aggiorna completedSteps o skippedSteps
      const completedSteps = { ...currentProgress.completedSteps };
      const skippedSteps = { ...currentProgress.skippedSteps };
      const progressMetadata = { ...currentProgress.metadata };

      if (skipped) {
        skippedSteps[stepNumber] = true;
      } else {
        completedSteps[stepNumber] = true;
      }

      // Salva metadata se fornito
      if (metadata) {
        progressMetadata[`step_${stepNumber}`] = metadata;
      }

      // Calcola il prossimo step
      const nextStep = stepNumber + 1;
      const isOnboardingCompleted = nextStep > TOTAL_STEPS;

      // Aggiorna il database
      const updated = await prisma.user_onboarding_progress.update({
        where: { userId },
        data: {
          currentStep: isOnboardingCompleted ? TOTAL_STEPS : nextStep,
          completedSteps,
          skippedSteps,
          metadata:
            Object.keys(progressMetadata).length > 0
              ? (progressMetadata as Record<string, string | number | boolean | null>)
              : undefined,
          isCompleted: isOnboardingCompleted,
          completedAt: isOnboardingCompleted ? new Date() : undefined,
          lastInteraction: new Date(),
        },
      });

      return this.deserializeProgress(updated);
    } catch (error: unknown) {
      logError('Errore', error);
      throw error;
    }
  }

  /**
   * Vai a uno step specifico (utile per navigation tra step)
   */
  static async goToStep(userId: string, stepNumber: number): Promise<OnboardingProgress> {
    try {
      // Validazione step number
      if (stepNumber < 1 || stepNumber > TOTAL_STEPS) {
        throw new Error(`Invalid step number: ${stepNumber}`);
      }

      // Ottieni o crea il progresso
      await this.getOrCreate(userId);

      // Aggiorna solo il currentStep
      const updated = await prisma.user_onboarding_progress.update({
        where: { userId },
        data: {
          currentStep: stepNumber,
          lastInteraction: new Date(),
        },
      });

      return this.deserializeProgress(updated);
    } catch (error: unknown) {
      logError('Errore', error);
      throw error;
    }
  }

  /**
   * Resetta l'onboarding (utile per testing o re-onboarding)
   */
  static async reset(userId: string): Promise<OnboardingProgress> {
    try {
      const updated = await prisma.user_onboarding_progress.update({
        where: { userId },
        data: {
          isCompleted: false,
          currentStep: ONBOARDING_STEPS.PROFILE_SETUP,
          completedSteps: {},
          skippedSteps: {},
          metadata: undefined,
          completedAt: null,
          lastInteraction: new Date(),
        },
      });

      return this.deserializeProgress(updated);
    } catch (error: unknown) {
      logError('Errore', error);
      throw error;
    }
  }

  /**
   * Completa immediatamente l'onboarding (skip all)
   */
  static async completeAll(userId: string): Promise<OnboardingProgress> {
    try {
      // Marca tutti gli step come skipped
      const allSkipped: Record<number, boolean> = {};
      for (let i = 1; i <= TOTAL_STEPS; i++) {
        allSkipped[i] = true;
      }

      const updated = await prisma.user_onboarding_progress.update({
        where: { userId },
        data: {
          isCompleted: true,
          currentStep: TOTAL_STEPS,
          skippedSteps: allSkipped,
          completedAt: new Date(),
          lastInteraction: new Date(),
        },
      });

      return this.deserializeProgress(updated);
    } catch (error: unknown) {
      logError('Errore', error);
      throw error;
    }
  }

  /**
   * Controlla se un utente ha completato l'onboarding
   */
  static async isCompleted(userId: string): Promise<boolean> {
    try {
      const progress = await this.getProgress(userId);
      return progress?.isCompleted ?? false;
    } catch (error: unknown) {
      logError('Errore', error);
      return false;
    }
  }

  /**
   * Ottiene statistiche sull'onboarding (utile per analytics)
   */
  static async getStatistics() {
    try {
      const [total, completed, inProgress] = await Promise.all([
        prisma.user_onboarding_progress.count(),
        prisma.user_onboarding_progress.count({
          where: { isCompleted: true },
        }),
        prisma.user_onboarding_progress.count({
          where: { isCompleted: false },
        }),
      ]);

      // Calcola tempo medio di completamento
      const completedRecords = await prisma.user_onboarding_progress.findMany({
        where: {
          isCompleted: true,
          completedAt: { not: null },
        },
        select: {
          startedAt: true,
          completedAt: true,
        },
      });

      type CompletedRecord = { startedAt: Date; completedAt: Date | null };
      const totalMinutes = completedRecords.reduce((sum: number, record: CompletedRecord) => {
        if (record.completedAt) {
          const diffMs = record.completedAt.getTime() - record.startedAt.getTime();
          return sum + diffMs / (1000 * 60); // converti in minuti
        }
        return sum;
      }, 0);

      const avgMinutes =
        completedRecords.length > 0 ? Math.round(totalMinutes / completedRecords.length) : 0;

      return {
        total,
        completed,
        inProgress,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0',
        avgCompletionTimeMinutes: avgMinutes,
      };
    } catch (error: unknown) {
      logError('Errore', error);
      throw error;
    }
  }

  /**
   * Helper per deserializzare il progresso dal database
   * Converte i JSON fields in oggetti TypeScript tipizzati
   */
  private static deserializeProgress(dbProgress: {
    id: string;
    userId: string | null;
    isCompleted: boolean;
    currentStep: number;
    completedSteps: unknown;
    skippedSteps: unknown;
    metadata: unknown;
    startedAt: Date;
    completedAt: Date | null;
    lastInteraction: Date;
  }): OnboardingProgress {
    // Helper per parsare JSON in modo sicuro
    const safeJsonParse = <T>(value: unknown, fallback: T): T => {
      if (typeof value !== 'string') {
        return (value as T) || fallback;
      }
      try {
        return JSON.parse(value) as T;
      } catch (error: unknown) {
        logError('Failed to parse JSON in onboarding progress', error);
        return fallback;
      }
    };

    return {
      id: dbProgress.id,
      userId: dbProgress.userId ?? '',
      isCompleted: dbProgress.isCompleted,
      currentStep: dbProgress.currentStep,
      completedSteps: safeJsonParse<Record<number, boolean>>(dbProgress.completedSteps, {}),
      skippedSteps: safeJsonParse<Record<number, boolean>>(dbProgress.skippedSteps, {}),
      metadata: safeJsonParse<Record<string, unknown> | undefined>(dbProgress.metadata, undefined),
      startedAt: new Date(dbProgress.startedAt),
      completedAt: dbProgress.completedAt ? new Date(dbProgress.completedAt) : null,
      lastInteraction: new Date(dbProgress.lastInteraction),
    };
  }
}
