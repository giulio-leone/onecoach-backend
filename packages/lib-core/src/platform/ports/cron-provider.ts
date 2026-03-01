/**
 * CronProvider Port
 *
 * Platform-agnostic interface for scheduled tasks.
 * Decouples cron scheduling from specific platforms.
 *
 * Note: On Vercel, crons are configured in vercel.json (declarative).
 * On Firebase/VPS, crons need programmatic scheduling.
 */

export interface CronJob {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  enabled: boolean;
}

export interface CronProvider {
  /** Register a cron job */
  schedule(name: string, cronExpression: string, handler: () => Promise<void>): void;

  /** Remove a cron job */
  unschedule(name: string): void;

  /** List all registered jobs */
  listScheduled(): CronJob[];

  /** Start all scheduled jobs */
  start(): void;

  /** Stop all scheduled jobs */
  stop(): void;

  /** Provider name (for logging/diagnostics) */
  readonly name: string;
}
