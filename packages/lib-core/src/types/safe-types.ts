/**
 * Safe Type Utilities
 *
 * SSOT for type-safe alternatives to `any` across the codebase.
 * Following SOLID principles: Single Responsibility for type safety.
 */

/**
 * Safe JSON value type for unknown JSON data.
 * Use this instead of `any` for JSON parsing/serialization.
 */
export type SafeJsonValue =
  | string
  | number
  | boolean
  | null
  | SafeJsonValue[]
  | { [key: string]: SafeJsonValue };

/**
 * Record with unknown values - safer than any.
 * Use for dynamic object access when types are not known ahead of time.
 */
export type UnknownRecord = Record<string, unknown>;

/**
 * Type guard for object with specific property.
 *
 * @example
 * if (hasProperty(obj, 'id')) {
 *   logger.warn(obj.id); // Type-safe access
 * }
 */
export function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

/**
 * Type guard for objects (non-null, non-array).
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for Error objects.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Safe cast with runtime validation.
 * Returns undefined if validation fails.
 *
 * @example
 * const user = safeCast(data, isUser);
 * if (user) { // Type is User
 *   logger.warn(user.name);
 * }
 */
export function safeCast<T>(value: unknown, validator: (v: unknown) => v is T): T | undefined {
  return validator(value) ? value : undefined;
}

/**
 * Extract error message safely from unknown error.
 * Use in catch blocks instead of `(error: any)`.
 *
 * @example
 * try {
 *   // ...
 * } catch (error) {
 *   logger.error(getErrorMessage(error));
 * }
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (isObject(error) && typeof error.message === 'string') {
    return error.message;
  }
  return String(error);
}

/**
 * Extract error stack safely from unknown error.
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }
  if (isObject(error) && typeof error.stack === 'string') {
    return error.stack;
  }
  return undefined;
}

/**
 * Type for exercise catalog items (shared pattern).
 */
export interface ExerciseCatalogItem {
  id: string;
  name: string;
}

/**
 * Generic logger interface for services.
 */
export interface ServiceLogger {
  info: (step: string, message: string, data?: unknown) => void;
  error: (step: string, message: string, data?: unknown) => void;
  warn: (step: string, message: string, data?: unknown) => void;
  debug?: (step: string, message: string, data?: unknown) => void;
}
