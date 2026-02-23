/**
 * Templates API
 *
 * API functions per workout and nutrition templates
 */
export interface TemplateResponse {
  template: unknown;
}
export interface TemplatesResponse {
  templates: unknown[];
}
export declare const templateApi: {
  /**
   * Get workout templates
   */
  getWorkoutTemplates(): Promise<TemplatesResponse>;
  /**
   * Create workout template
   */
  createWorkoutTemplate(data: unknown): Promise<TemplateResponse>;
  /**
   * Update workout template
   */
  updateWorkoutTemplate(id: string, data: unknown): Promise<TemplateResponse>;
  /**
   * Delete workout template
   */
  deleteWorkoutTemplate(id: string): Promise<void>;
  /**
   * Get nutrition templates
   */
  getNutritionTemplates(): Promise<TemplatesResponse>;
  /**
   * Create nutrition template
   */
  createNutritionTemplate(data: unknown): Promise<TemplateResponse>;
  /**
   * Update nutrition template
   */
  updateNutritionTemplate(id: string, data: unknown): Promise<TemplateResponse>;
  /**
   * Delete nutrition template
   */
  deleteNutritionTemplate(id: string): Promise<void>;
};
//# sourceMappingURL=templates.d.ts.map
