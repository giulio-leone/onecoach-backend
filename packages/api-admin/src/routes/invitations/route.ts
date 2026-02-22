import { NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { InvitationService } from '@giulio-leone/lib-core/invitation.service';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import { z } from 'zod';
import type { UserRole } from '@giulio-leone/types';
import { InvitationStatus, InvitationType } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface SessionUser {
  id: string;
  role: UserRole;
}

const createInvitationSchema = z.object({
  type: z.enum(['ONE_TIME', 'MULTI_USE']),
  maxUses: z.number().min(1).optional(),
  expiresAt: z.string().optional(), // ISO date string
  code: z.string().min(3).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as InvitationStatus | null) || undefined;
    const type = (searchParams.get('type') as InvitationType | null) || undefined;

    const result = await InvitationService.getInvitations({
      page,
      limit,
      search,
      status,
      type,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    logError('Error fetching invitations', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { type, maxUses, expiresAt, code } = validation.data;

    const invitation = await InvitationService.createInvitation({
      type,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      code,
      createdById: user.id,
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error: unknown) {
    logError('Error creating invitation', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
