/**
 * No-Op Cron Adapter
 *
 * Default CronProvider for platforms that handle cron externally
 * (Vercel via vercel.json, Firebase via Cloud Scheduler).
 *
 * Registers jobs in memory for introspection but does not execute them.
 * Use NodeCronAdapter (with `node-cron` package) for VPS deployments
 * that need programmatic scheduling.
 */

import type { CronProvider, CronJob } from '../ports/cron-provider';

export class NoOpCronAdapter implements CronProvider {
  readonly name = 'no-op-cron';
  private jobs: Map<string, CronJob> = new Map();

  schedule(name: string, cronExpression: string, handler: () => Promise<void>): void {
    this.jobs.set(name, { name, schedule: cronExpression, handler, enabled: true });
  }

  unschedule(name: string): void {
    this.jobs.delete(name);
  }

  listScheduled(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  start(): void {
    // No-op: crons are handled by the platform
  }

  stop(): void {
    // No-op
  }
}
