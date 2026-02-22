import { NextResponse } from 'next/server';
import { InvitationService } from '@giulio-leone/lib-core/invitation.service';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Invitation code is required' }, { status: 400 });
    }

    // Verifica che le registrazioni tramite invito siano abilitate
    const { decide } = await import('../../../flags');
    const isInvitationRegistrationEnabled = await decide('ENABLE_INVITATION_REGISTRATION');

    if (!isInvitationRegistrationEnabled) {
      return NextResponse.json(
        {
          isValid: false,
          error: 'Le registrazioni tramite invito sono attualmente disabilitate',
        },
        { status: 200 }
      );
    }

    const validation = await InvitationService.validateInvitation(code);

    if (!validation.isValid) {
      return NextResponse.json({ isValid: false, error: validation.error }, { status: 200 });
    }

    return NextResponse.json({ isValid: true }, { status: 200 });
  } catch (error: unknown) {
    logError('Error validating invitation', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
