/**
 * Onboarding Service
 *
 * Gestisce lo stato e il progresso dell'onboarding wizard
 * Implementa IOnboardingService contract
 */

import { prisma } from './prisma';
import { createId } from '@giulio-leone/lib-shared/id-generator';
import type { IOnboardingService } from '@giulio-leone/contracts';
import type { OnboardingProgress, StepCompletionInput } from '@giulio-leone/types';
import type { Prisma } from '@prisma/client';

import { logger } from '@giulio-leone/lib-shared';
type DbOnboardingProgress = Prisma.user_onboarding_progressGetPayload<object>;

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

/**
 * Onboarding Service
 */
export class OnboardingService implements IOnboardingService {
  /**
   * Ottiene o crea il progresso onboarding per un utente
   */
  async getOrCreate(userId: string): Promise<OnboardingProgress> {
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
      logger.error('[OnboardingService.getOrCreate]', error);
      throw error;
    }
  }

  /**
   * Ottiene il progresso corrente per un utente
   */
  async getProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      const progress = await prisma.user_onboarding_progress.findUnique({
        where: { userId },
      });

      if (!progress) {
        return null;
      }

      return this.deserializeProgress(progress);
    } catch (error: unknown) {
      logger.error('[OnboardingService.getProgress]', error);
      throw error;
    }
  }

  /**
   * Completa uno step dell'onboarding
   */
  async completeStep(userId: string, input: StepCompletionInput): Promise<OnboardingProgress> {
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
              ? (progressMetadata as Prisma.InputJsonValue)
              : undefined,
          isCompleted: isOnboardingCompleted,
          completedAt: isOnboardingCompleted ? new Date() : undefined,
          lastInteraction: new Date(),
        },
      });

      return this.deserializeProgress(updated);
    } catch (error: unknown) {
      logger.error('[OnboardingService.completeStep]', error);
      throw error;
    }
  }

  /**
   * Vai a uno step specifico (utile per navigation tra step)
   */
  async goToStep(userId: string, stepNumber: number): Promise<OnboardingProgress> {
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
      logger.error('[OnboardingService.goToStep]', error);
      throw error;
    }
  }

  /**
   * Resetta l'onboarding (utile per testing o re-onboarding)
   */
  async reset(userId: string): Promise<OnboardingProgress> {
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
      logger.error('[OnboardingService.reset]', error);
      throw error;
    }
  }

  /**
   * Completa immediatamente l'onboarding (skip all)
   */
  async completeAll(userId: string): Promise<OnboardingProgress> {
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
      logger.error('[OnboardingService.completeAll]', error);
      throw error;
    }
  }

  /**
   * Controlla se un utente ha completato l'onboarding
   */
  async isCompleted(userId: string): Promise<boolean> {
    try {
      const progress = await this.getProgress(userId);
      return progress?.isCompleted ?? false;
    } catch (error: unknown) {
      logger.error('[OnboardingService.isCompleted]', error);
      return false;
    }
  }

  /**
   * Helper per deserializzare il progresso dal database
   * Converte i JSON fields in oggetti TypeScript tipizzati
   */
  private deserializeProgress(dbProgress: DbOnboardingProgress): OnboardingProgress {
    return {
      id: dbProgress.id,
      userId: dbProgress.userId ?? '',
      isCompleted: dbProgress.isCompleted,
      currentStep: dbProgress.currentStep,
      completedSteps:
        typeof dbProgress.completedSteps === 'string'
          ? JSON.parse(dbProgress.completedSteps)
          : dbProgress.completedSteps || {},
      skippedSteps:
        typeof dbProgress.skippedSteps === 'string'
          ? JSON.parse(dbProgress.skippedSteps)
          : dbProgress.skippedSteps || {},
      metadata:
        typeof dbProgress.metadata === 'string'
          ? JSON.parse(dbProgress.metadata)
          : dbProgress.metadata || undefined,
      startedAt: new Date(dbProgress.startedAt),
      completedAt: dbProgress.completedAt ? new Date(dbProgress.completedAt) : null,
      lastInteraction: new Date(dbProgress.lastInteraction),
    };
  }
}

export const onboardingService: OnboardingService = new OnboardingService();
