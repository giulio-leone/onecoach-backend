import { NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { InvitationService } from '@giulio-leone/lib-core/invitation.service';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import type { UserRole } from '@giulio-leone/types';

export const dynamic = 'force-dynamic';

interface SessionUser {
  id: string;
  role: UserRole;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    const invitation = await InvitationService.revokeInvitation(id);

    return NextResponse.json(invitation);
  } catch (error: unknown) {
    logError('Error revoking invitation', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
