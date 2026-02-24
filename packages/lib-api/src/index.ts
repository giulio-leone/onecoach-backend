// Export client
export * from './client';
// Export APIs explicitly
export { workoutApi } from './workout';
export { nutritionApi } from './nutrition';
export { exerciseApi } from './exercise';
export { foodApi } from './food';
export { coachApi } from './coach';
export { profileApi } from './profile';
export { analyticsApi } from './analytics';
export { templateApi } from './templates';
export { marketplaceApi } from './marketplace';
export { projectsApi } from './projects';
export { habitsApi } from './habits';
export { milestonesApi } from './milestones';
export { tasksApi } from './tasks';
// Export React Query hooks
export * from './hooks';
// Export query keys and functions
export * from './queries';
// Export React Query provider and config
export * from './react-query';
// Memory API
export * from './memory';
// Export Utils
export * from './utils';
// Export types
export type { WorkoutProgramResponse, WorkoutProgramsResponse } from './workout';
export type { NutritionPlanResponse, NutritionPlansResponse } from './nutrition';
export type { Exercise, ExerciseResponse, ExercisesResponse, ExerciseListParams } from './exercise';
export type { Food, FoodResponse, FoodsResponse, FoodListParams } from './food';
export type {
  CoachProfileResponse,
  PublicCoachProfileResponse,
  CoachProfile,
  PublicCoachProfile,
  CoachDashboardStats,
  CoachClient,
  CoachDashboardPlansFilters,
  CoachClientsFilters,
  MarketplacePlanCardProps,
} from './coach';
export type { OneRepMaxResponse } from './profile';
export type {
  AnalyticsOverviewParams,
  AnalyticsOverviewResponse,
  ChartDataParams,
} from './analytics';
export type { TemplateResponse, TemplatesResponse } from './templates';
export type {
  MarketplacePlan,
  MarketplacePlansResponse,
  MarketplacePlanResponse,
} from './marketplace';
export type { MilestoneResponse, MilestonesResponse } from './milestones';
export type { TaskResponse, TasksResponse } from './tasks';
