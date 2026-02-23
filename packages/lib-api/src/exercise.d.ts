/**
 * Exercise API
 *
 * API functions per exercises
 */
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  category?: string;
  muscleGroups?: string[];
  equipment?: string[];
  [key: string]: unknown;
}
export interface ExerciseResponse {
  exercise: Exercise;
}
export interface ExercisesResponse<T extends Exercise = Exercise> {
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}
export interface ExerciseListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  exerciseTypeId?: string;
  equipmentIds?: string[];
  bodyPartIds?: string[];
  muscleIds?: string[];
  approvalStatus?: string;
  includeTranslations?: boolean;
  includeUnapproved?: boolean;
}
export declare const exerciseApi: {
  /**
   * Get all exercises with optional filters
   */
  list(params?: ExerciseListParams): Promise<ExercisesResponse>;
  /**
   * Get exercise by ID
   */
  getById(id: string): Promise<ExerciseResponse>;
  /**
   * Create exercise
   */
  create(data: unknown): Promise<ExerciseResponse>;
  /**
   * Update exercise
   */
  update(id: string, data: unknown): Promise<ExerciseResponse>;
  /**
   * Delete exercise
   */
  delete(id: string): Promise<void>;
  /**
   * Batch operations (approve, reject, delete)
   */
  batch(
    action: 'approve' | 'reject' | 'delete',
    ids: string[]
  ): Promise<{
    success: boolean;
    results: Array<{
      id: string;
      success: boolean;
      error?: string;
    }>;
    updated?: number;
    deleted?: number;
    status?: string;
  }>;
};
//# sourceMappingURL=exercise.d.ts.map
