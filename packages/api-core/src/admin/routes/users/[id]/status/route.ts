/**
 * Admin User Status API Route
 *
 * PUT: Modifica status utente (solo admin)
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import type { UserStatus } from '@giulio-leone/types';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const { id: userId } = await params;
    const { status } = await _req.json();

    if (!status) {
      return NextResponse.json({ error: 'Status richiesto' }, { status: 400 });
    }

    // Update user status
    await prisma.users.update({
      where: { id: userId },
      data: {
        status: status as UserStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Status aggiornato con successo',
    });
  } catch (error: unknown) {
    logError('Errore nell', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
