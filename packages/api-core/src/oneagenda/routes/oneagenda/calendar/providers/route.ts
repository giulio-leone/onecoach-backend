/**
 * Calendar Providers API Route
 *
 * GET /api/oneagenda/calendar/providers - List configured calendar providers
 * POST /api/oneagenda/calendar/providers - Add iCal provider
 * DELETE /api/oneagenda/calendar/providers - Remove calendar provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { CalendarSyncService } from '@giulio-leone/oneagenda-core';
import { logger } from '@giulio-leone/lib-shared';

const syncService = new CalendarSyncService();

/**
 * GET /api/oneagenda/calendar/providers
 * List configured calendar providers
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    type UserProvider = {
      provider: string;
      syncEnabled: boolean;
      lastSyncAt?: string | Date | null;
      accessToken?: string | null;
    };

    const providers = syncService.getUserProviders(session.user.id) as UserProvider[];

    return NextResponse.json({
      providers: providers.map((p: unknown) => ({
        provider: (p as UserProvider).provider,
        syncEnabled: (p as UserProvider).syncEnabled,
        lastSyncAt: (p as UserProvider).lastSyncAt,
        hasToken: !!(p as UserProvider).accessToken,
      })),
    });
  } catch (error: unknown) {
    logger.error('List providers error', { error, userId: session.user.id });
    return NextResponse.json({ error: 'Failed to list providers' }, { status: 500 });
  }
}

/**
 * POST /api/oneagenda/calendar/providers
 * Add iCal provider
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { calendarUrl } = body;

    if (!calendarUrl) {
      return NextResponse.json({ error: 'Calendar URL is required' }, { status: 400 });
    }

    syncService.registerProvider({
      provider: 'ical',
      userId: session.user.id,
      calendarUrl,
      syncEnabled: true,
    });

    return NextResponse.json({ success: true, provider: 'ical' });
  } catch (error: unknown) {
    logger.error('Add provider error', { error, userId: session.user.id });
    return NextResponse.json({ error: 'Failed to add provider' }, { status: 500 });
  }
}

/**
 * DELETE /api/oneagenda/calendar/providers
 * Remove calendar provider
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const provider = searchParams.get('provider');

  try {

    if (!provider || !['google', 'microsoft', 'ical'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    syncService.removeProvider(session.user.id, provider as 'google' | 'microsoft' | 'ical');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Remove provider error', { error, userId: session.user.id, provider });
    return NextResponse.json({ error: 'Failed to remove provider' }, { status: 500 });
  }
}
