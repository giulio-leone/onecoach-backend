/**
 * Node Cron Adapter
 *
 * CronProvider for VPS/self-hosted deployments using `node-cron`.
 * Schedules and runs cron jobs within the Node.js process.
 *
 * Requires: npm install node-cron @types/node-cron
 */

import type { CronProvider, CronJob } from '../ports/cron-provider';

interface ScheduledTask {
  stop: () => void;
  start: () => void;
}

export class NodeCronAdapter implements CronProvider {
  readonly name = 'node-cron';
  private jobs: Map<string, CronJob> = new Map();
  private tasks: Map<string, ScheduledTask> = new Map();
  private cron: any;

  async init(): Promise<void> {
    try {
      this.cron = await import('node-cron');
    } catch {
      throw new Error('node-cron package is required for NodeCronAdapter. Install with: pnpm add node-cron');
    }
  }

  schedule(name: string, cronExpression: string, handler: () => Promise<void>): void {
    if (!this.cron) {
      throw new Error('NodeCronAdapter not initialized. Call init() first.');
    }

    this.unschedule(name);

    const task = this.cron.schedule(cronExpression, async () => {
      try {
        await handler();
      } catch (err) {
        console.error(`[node-cron] Job "${name}" failed:`, err);
      }
    }, { scheduled: false });

    this.jobs.set(name, { name, schedule: cronExpression, handler, enabled: true });
    this.tasks.set(name, task);
  }

  unschedule(name: string): void {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
    }
    this.jobs.delete(name);
  }

  listScheduled(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  start(): void {
    for (const task of this.tasks.values()) {
      task.start();
    }
  }

  stop(): void {
    for (const task of this.tasks.values()) {
      task.stop();
    }
  }
}
