import { Logger as SharedLogger, type LogLevel as SharedLogLevel } from '@giulio-leone/lib-shared';

/**
 * @giulio-leone/lib-core
 * Standardized Logger Service
 *
 * Re-exports and wraps the high-quality logger from lib-shared
 * to provide a stable API for core services.
 */

export type LogLevel = SharedLogLevel;

export interface LogMetadata {
  [key: string]: unknown;
}

export interface ILogger {
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, error?: Error | string | unknown, metadata?: LogMetadata): void;
  child(context: string): ILogger;
}

/**
 * Wrapper class that adapts lib-shared Logger to ILogger interface if needed,
 * though they are mostly compatible.
 */
class LoggerService implements ILogger {
  private inner: SharedLogger;

  constructor(context: string = 'App') {
    this.inner = new SharedLogger({ prefix: context });
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.inner.debug(message, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.inner.info(message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.inner.warn(message, metadata);
  }

  error(message: string, error?: Error | string | unknown, metadata?: LogMetadata): void {
    this.inner.error(message, error, metadata);
  }

  child(context: string): ILogger {
    // SharedLogger.child already handles prefix concatenation
    const childShared = this.inner.child(context);
    const wrapper = new LoggerService();
    (wrapper as unknown as { inner: SharedLogger }).inner = childShared;
    return wrapper;
  }
}

// Export default instance
export const logger = new LoggerService();

// Export class for custom instances
export { LoggerService as Logger };
