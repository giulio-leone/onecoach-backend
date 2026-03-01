/**
 * ConfigProvider Port
 *
 * Platform-agnostic interface for remote configuration services.
 * Implements Hexagonal Architecture (Ports & Adapters) pattern.
 *
 * Adapters:
 * - VercelConfigAdapter: @vercel/edge-config
 * - FirebaseConfigAdapter: Firebase Remote Config
 * - EnvConfigAdapter: Environment variables (fallback)
 */

export interface ConfigProviderWriteResult {
  success: boolean;
  error?: string;
}

export interface ConfigProvider {
  /** Read a single config value by key */
  get<T = unknown>(key: string): Promise<T | undefined>;

  /** Read all config values */
  getAll(): Promise<Record<string, unknown>>;

  /** Check if a key exists */
  has(key: string): Promise<boolean>;

  /** Write a single config value */
  set(key: string, value: unknown): Promise<ConfigProviderWriteResult>;

  /** Write multiple config values */
  setMany(items: Record<string, unknown>): Promise<ConfigProviderWriteResult>;

  /** Delete a config value */
  delete(key: string): Promise<ConfigProviderWriteResult>;

  /** Provider name (for logging/diagnostics) */
  readonly name: string;
}
