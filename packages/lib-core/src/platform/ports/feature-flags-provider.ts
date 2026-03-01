/**
 * FeatureFlagsProvider Port
 *
 * Platform-agnostic interface for feature flag services.
 * Decouples flag evaluation from specific flag platforms.
 */

export interface FlagDefinition {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  origin?: string;
  options?: Array<{ value: unknown; label: string }>;
}

export interface FeatureFlagsProvider {
  /** Get all flag definitions */
  getFlags(): Promise<FlagDefinition[]>;

  /** Get a single flag definition by key */
  getFlag(key: string): Promise<FlagDefinition | undefined>;

  /** Check if a flag is enabled */
  isEnabled(key: string): Promise<boolean>;

  /** Provider name (for logging/diagnostics) */
  readonly name: string;
}
