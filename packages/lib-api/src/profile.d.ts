/**
 * Profile API
 *
 * API functions per user profile data
 */
export interface OneRepMaxResponse {
  maxes: unknown[];
}
export declare const profileApi: {
  /**
   * Get user one rep maxes
   */
  getOneRepMaxes(): Promise<OneRepMaxResponse>;
  /**
   * Upsert one rep max
   */
  upsertOneRepMax(data: unknown): Promise<{
    max: unknown;
  }>;
  /**
   * Delete one rep max
   */
  deleteOneRepMax(exerciseId: string): Promise<void>;
};
//# sourceMappingURL=profile.d.ts.map
