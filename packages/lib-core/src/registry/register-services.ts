/**
 * Service Registration
 *
 * Registra tutte le implementazioni dei servizi nel registry.
 * Uses dynamic imports for external packages (one-nutrition, one-workout, lib-food, lib-ai)
 * to avoid circular dependency: lib-core ↔ lib-food/one-nutrition/one-workout/lib-ai
 */

import { registerService } from './service-registry';
import { analyticsService } from '../analytics/analytics.service';
import { creditService } from '../credit.service';
import { subscriptionService } from '../subscription.service';
import { userProfileService } from '../user-profile.service';
import { paymentService } from '../payment.service';
import { onboardingService } from '../onboarding.service';
import { marketplaceService } from '../marketplace/marketplace.service';
import { coachService } from '../coach/coach.service';
import type { IExerciseService, IFoodService, IAnalyticsService } from '@giulio-leone/lib-shared';
import {
  getBodyMeasurementHistory,
  createBodyMeasurement as createBodyMeasurementFn,
} from '../analytics/body-measurements.service';

/**
 * Wrapper per analyticsService che implementa IAnalyticsService
 * Combina funzioni da analytics.service e body-measurements.service
 */
const analyticsServiceAdapter: IAnalyticsService = {
  ...analyticsService,
  async getUserAnalytics(userId) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return await analyticsService.generateAnalyticsReport(userId, startDate, endDate);
  },
  async getChartData(userId, chartType, period) {
    const endDate = new Date();
    const startDate = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    startDate.setDate(startDate.getDate() - days);

    switch (chartType) {
      case 'weight':
        return await analyticsService.generateWeightChart(userId, startDate, endDate);
      case 'volume':
        return await analyticsService.generateVolumeChart(userId, startDate, endDate);
      default:
        throw new Error(`Unknown chart type: ${chartType}`);
    }
  },
  async getBodyMeasurements(userId) {
    return await getBodyMeasurementHistory(userId);
  },
  async createBodyMeasurement(userId, measurement) {
    return await createBodyMeasurementFn(userId, {
      date: measurement.date,
      weight: measurement.weight,
      bodyFat: measurement.bodyFat,
      muscleMass: measurement.muscleMass,
      chest: measurement.chest,
      waist: measurement.waist,
      hips: measurement.hips,
      thigh: measurement.thigh,
      arm: measurement.arm,
      calf: measurement.calf,
      neck: measurement.neck,
      shoulders: measurement.shoulders,
      notes: measurement.notes,
      photos: measurement.photos,
    });
  },
  async getUserGoals(userId) {
    return await analyticsService.getUserGoals(userId);
  },
  async createUserGoal(userId, goal) {
    return await analyticsService.createUserGoal(userId, goal);
  },
};

/**
 * Registra tutti i servizi nel registry.
 * Dynamic imports break circular: lib-core ↔ one-nutrition/one-workout/lib-food/lib-ai
 */
export async function registerAllServices(): Promise<void> {
  const [
    { nutritionService },
    { workoutService, exerciseService },
    { foodService },
    { chatService },
  ] = await Promise.all([
    import('@giulio-leone/one-nutrition'),
    import('@giulio-leone/one-workout'),
    import('@giulio-leone/lib-food'),
    import('@giulio-leone/ai-config'),
  ]);

  const exerciseServiceAdapter = exerciseService as unknown as IExerciseService;
  const foodServiceAdapter = foodService as unknown as IFoodService;

  registerService('nutrition', nutritionService);
  registerService('workout', workoutService);
  registerService('exercise', exerciseServiceAdapter);
  registerService('food', foodServiceAdapter);
  registerService('analytics', analyticsServiceAdapter);
  registerService('credit', creditService);
  registerService('subscription', subscriptionService);
  registerService('userProfile', userProfileService);
  registerService('payment', paymentService);
  registerService('onboarding', onboardingService);
  registerService('chat', chatService);
  registerService('marketplace', marketplaceService);
  registerService('coach', coachService);
}
