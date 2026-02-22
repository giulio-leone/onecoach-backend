import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@giulio-leone/lib-shared';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/oneagenda/calendar/google/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const userId = searchParams.get('state');

  if (!code || !userId) {
    return NextResponse.redirect('/oneagenda?error=invalid_request');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    await tokenResponse.json();

    // Store tokens in database (placeholder - requires CalendarProvider model)
    // await prisma.calendarProvider.upsert(...tokens)

    return NextResponse.redirect('/oneagenda?success=google_connected');
  } catch (error: unknown) {
    logger.error('Google Calendar auth error', { error, userId });
    return NextResponse.redirect('/oneagenda?error=auth_failed');
  }
}
