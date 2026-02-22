/**
 * @onecoach/lib-exercise
 *
 * Servizi per il dominio esercizi
 * Implementa contratti da @onecoach/contracts
 */

export * from './exercise.service';
export * from './exercise-admin.service';
export * from './exercise-id-resolver.service';
export * from './one-rep-max.service';

// Re-export types for convenience
export type { LocalizedExercise, ExerciseTranslationView } from '@giulio-leone/types';
