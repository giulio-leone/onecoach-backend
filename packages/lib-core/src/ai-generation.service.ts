/**
 * AiGenerationService
 *
 * Facade for AI-driven content generation (exercises and foods).
 * TODO: Implement by delegating to @giulio-leone/one-workout and @giulio-leone/one-nutrition.
 */

export interface GenerateExercisesOptions {
  count: number;
  description: string;
  userId?: string;
  muscleGroups?: string[];
  bodyPartIds?: string[];
  autoApprove?: boolean;
  mergeExisting?: boolean;
  onProgress?: (progress: number, message: string) => void;
}

export interface GenerateExercisesResult {
  created: number;
  updatedItems: number;
  skippedSlugs: string[];
  createdItems: unknown[];
  errors: unknown[];
}

export interface GenerateFoodsOptions {
  count: number;
  description: string;
  userId?: string;
  existingFoods?: string[];
  categoryIds?: string[];
  mergeExisting?: boolean;
  onProgress?: (progress: number, message: string) => void;
}

export interface GenerateFoodsResult {
  created: number;
  updated: number;
  skipped: number;
  createdItems: unknown[];
  updatedItems: unknown[];
  skippedNames: string[];
  errors: unknown[];
}

export class AiGenerationService {
  // TODO: Implement by calling generateExercises from @giulio-leone/one-workout
  static async generateExercises(
    _options: GenerateExercisesOptions
  ): Promise<GenerateExercisesResult> {
    throw new Error('AiGenerationService.generateExercises is not yet implemented');
  }

  // TODO: Implement by calling generateFoods from @giulio-leone/one-nutrition
  static async generateFoods(_options: GenerateFoodsOptions): Promise<GenerateFoodsResult> {
    throw new Error('AiGenerationService.generateFoods is not yet implemented');
  }
}
