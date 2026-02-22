import { NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_REDIRECT_URI =
  process.env.NEXTAUTH_URL + '/api/oneagenda/calendar/microsoft/callback';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  authUrl.searchParams.append('client_id', MICROSOFT_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', MICROSOFT_REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'Calendars.ReadWrite offline_access');
  authUrl.searchParams.append('response_mode', 'query');
  authUrl.searchParams.append('state', session.user.id);

  return NextResponse.redirect(authUrl.toString());
}
