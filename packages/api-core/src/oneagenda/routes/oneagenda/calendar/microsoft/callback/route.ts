import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@giulio-leone/lib-shared';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_REDIRECT_URI =
  process.env.NEXTAUTH_URL + '/api/oneagenda/calendar/microsoft/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const userId = searchParams.get('state');

  if (!code || !userId) {
    return NextResponse.redirect('/oneagenda?error=invalid_request');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          redirect_uri: MICROSOFT_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    await tokenResponse.json();

    // Store tokens in database (placeholder - requires CalendarProvider model)
    // await prisma.calendarProvider.upsert(...tokens)

    return NextResponse.redirect('/oneagenda?success=microsoft_connected');
  } catch (error: unknown) {
    logger.error('Microsoft Calendar auth error', { error, userId });
    return NextResponse.redirect('/oneagenda?error=auth_failed');
  }
}
