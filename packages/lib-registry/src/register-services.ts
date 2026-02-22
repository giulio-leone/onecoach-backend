/**
 * Service Registration
 *
 * Registra tutte le implementazioni dei servizi nel registry
 *
 * NOTE: exerciseService e foodService sono classi statiche (typeof Class),
 * ma i contratti richiedono istanze (IExerciseService/IFoodService).
 * Il cast `as` è necessario finché non si refactorizzano
 * i servizi per implementare direttamente i contratti.
 */

import { registerService } from './index';
import { nutritionService } from '@giulio-leone/one-nutrition';
import { workoutService } from '@giulio-leone/one-workout';
import { exerciseService } from '@giulio-leone/lib-exercise';
import { foodService } from '@giulio-leone/lib-food';
import { analyticsService } from '@giulio-leone/lib-analytics';
import {
  creditService,
  subscriptionService,
  userProfileService,
  paymentService,
  onboardingService,
} from '@giulio-leone/lib-core';
import { chatService } from '@giulio-leone/lib-ai';
import { marketplaceService } from '@giulio-leone/lib-marketplace';
import { coachService } from '@giulio-leone/lib-coach';
import type { IExerciseService, IFoodService, IAnalyticsService } from '@giulio-leone/contracts';
import {
  getBodyMeasurementHistory,
  createBodyMeasurement as createBodyMeasurementFn,
} from '@giulio-leone/lib-analytics';

/**
 * Wrapper per ExerciseService che implementa IExerciseService
 * TODO: Refactor ExerciseService per restituire Exercise invece di LocalizedExercise
 * e implementare direttamente IExerciseService
 */
const exerciseServiceAdapter = exerciseService as IExerciseService;

/**
 * Wrapper per FoodService che implementa IFoodService
 * TODO: Refactor FoodService per essere un'istanza invece di una classe statica
 * e implementare direttamente IFoodService (aggiungere delete e matchByBarcode)
 */
const foodServiceAdapter = foodService as IFoodService;

/**
 * Wrapper per analyticsService che implementa IAnalyticsService
 * Combina funzioni da analytics.service e body-measurements.service
 * TODO: Implementare getUserGoals e createUserGoal
 */
const analyticsServiceAdapter: IAnalyticsService = {
  ...analyticsService,
  async getUserAnalytics(userId) {
    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return await analyticsService.generateAnalyticsReport(userId, startDate, endDate);
  },
  async getChartData(userId, chartType, period) {
    // Calculate date range based on period
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
 * Registra tutti i servizi nel registry
 * Chiamare questa funzione all'avvio dell'applicazione
 */
export function registerAllServices(): void {
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
