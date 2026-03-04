/**
 * Calendar Sync Service
 *
 * Manages external calendar provider connections and bidirectional sync.
 * Currently stores provider config in agenda_user_preferences metadata.
 *
 * Note: Calendar provider/event tables don't exist yet in the schema.
 * This service uses a JSON-based storage approach as an intermediate step.
 */

import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as import('@prisma/client').PrismaClient;
import type { CalendarProvider, CalendarProviderConfig } from './types';

export class CalendarSyncService {
  async getUserProviders(userId: string): Promise<CalendarProvider[]> {
    const prefs = await prisma.agenda_user_preferences.findUnique({
      where: { userId },
    });

    if (!prefs) return [];

    // Provider configs stored as JSON array in a column or derived from preferences
    // For now return empty until calendar_providers table is created
    return [];
  }

  async registerProvider(
    config: CalendarProviderConfig,
  ): Promise<CalendarProvider> {
    // Upsert user preferences to track provider registration
    await prisma.agenda_user_preferences.upsert({
      where: { userId: config.userId },
      create: {
        userId: config.userId,
        timezone: 'Europe/Rome',
      },
      update: {},
    });

    return {
      id: `${config.provider}-${config.userId}`,
      provider: config.provider,
      userId: config.userId,
      calendarUrl: config.calendarUrl,
      syncEnabled: config.syncEnabled ?? true,
    };
  }

  async removeProvider(userId: string, _provider: string): Promise<void> {
    // No-op until calendar_providers table exists
    void userId;
  }

  async bidirectionalSync(
    _userId: string,
    _provider: string,
    _events: unknown[],
    _startDate: Date | string,
    _endDate: Date | string,
  ): Promise<{ synced: number; errors: string[] }> {
    // Stub: full implementation requires calendar_providers + calendar_events tables
    return { synced: 0, errors: [] };
  }
}
