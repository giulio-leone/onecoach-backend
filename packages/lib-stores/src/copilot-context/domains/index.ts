/**
 * Domain Configurations Export
 * 
 * Export all domain configurations for easy registration.
 * 
 * @module lib-stores/copilot-context/domains
 */

export { workoutDomain, type WorkoutContext, type WorkoutContextSelection } from './workout.domain';
export { nutritionDomain, type NutritionContext, type NutritionContextSelection } from './nutrition.domain';
export { oneAgendaDomain, type OneAgendaContext, type OneAgendaContextData, type OneAgendaContextSelection } from './oneagenda.domain';
export { liveSessionDomain, type LiveSessionContext } from './live-session.domain';

/**
 * All built-in domains for easy registration.
 * 
 * @example
 * ```ts
 * import { allDomains, registerDomain } from '@giulio-leone/lib-stores/copilot-context';
 * 
 * // Register all domains at once
 * allDomains.forEach(registerDomain);
 * ```
 */
export const allDomains = [
  // Import dynamically to avoid circular deps
] as const;

// Note: allDomains populated at runtime via registerAllDomains()

import { workoutDomain } from './workout.domain';
import { nutritionDomain } from './nutrition.domain';
import { oneAgendaDomain } from './oneagenda.domain';
import { liveSessionDomain } from './live-session.domain';
import { registerDomain } from '../copilot-context.store';

/**
 * Register all built-in domains.
 * Call this once at app startup.
 */
export function registerAllDomains(): void {
  registerDomain(workoutDomain);
  registerDomain(nutritionDomain);
  registerDomain(oneAgendaDomain);
  registerDomain(liveSessionDomain);
}
