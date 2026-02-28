/**
 * Streaming Logger Factory
 *
 * Bridges the base Logger API (message, context?) to the ServiceLogger API
 * (step, message, data?) consumed by domain services.
 */

import { createPrefixedLogger } from '@giulio-leone/lib-shared';
import type { ServiceLogger } from '@giulio-leone/lib-core';

/**
 * Create a ServiceLogger adapter from a prefix string.
 *
 * Normalises the (step, data?) pair into a flat context object so that
 * structured logging back-ends receive consistent output.
 *
 * @example
 * ```ts
 * const logger = createServiceLogger('Nutrition');
 * logger.info('INIT', 'Starting generation', { userId: '123' });
 * // => [Nutrition] Starting generation  { step: 'INIT', userId: '123' }
 * ```
 */
export function createServiceLogger(prefix: string): ServiceLogger {
  const base = createPrefixedLogger(prefix);

  const buildContext = (step: string, data?: unknown): Record<string, unknown> => {
    if (data !== undefined && typeof data === 'object' && data !== null) {
      return { step, ...(data as Record<string, unknown>) };
    }
    if (data === undefined) return { step };
    return { step, data };
  };

  return {
    info: (step, message, data?) => base.info(message, buildContext(step, data)),
    error: (step, message, data?) => base.error(message, undefined, buildContext(step, data)),
    warn: (step, message, data?) => base.warn(message, buildContext(step, data)),
    debug: (step, message, data?) => base.debug(message, buildContext(step, data)),
  };
}
