/**
 * Admin User API Keys API Route
 *
 * GET: Lista tutte le subkey di un utente (solo admin)
 * DELETE: Revoca una subkey (solo admin)
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { OpenRouterSubkeyService } from '@giulio-leone/lib-ai';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const { id: userId } = await params;

    // Verifica che l'utente esista
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Recupera tutte le subkey dell'utente
    const apiKeys = await prisma.user_api_keys.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    type ApiKeyType = (typeof apiKeys)[number];

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys.map((key: ApiKeyType) => ({
        id: key.id,
        provider: key.provider,
        keyLabel: key.keyLabel,
        limit: key.limit,
        status: key.status,
        stripePaymentIntentId: key.stripePaymentIntentId,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      })),
    });
  } catch (error: unknown) {
    logError('Errore nel recupero delle subkey', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const { id: userId } = await params;
    const { keyId } = await _req.json();

    if (!keyId) {
      return NextResponse.json({ error: 'keyId richiesto' }, { status: 400 });
    }

    // Recupera la subkey
    const apiKey = await prisma.user_api_keys.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'Subkey non trovata' }, { status: 404 });
    }

    if (apiKey.userId !== userId) {
      return NextResponse.json({ error: 'Subkey non appartiene a questo utente' }, { status: 403 });
    }

    // Revoca la subkey via OpenRouter
    if (apiKey.status === 'ACTIVE') {
      try {
        await OpenRouterSubkeyService.revokeSubkey(apiKey.keyLabel);
      } catch (error: unknown) {
        logError('Errore interno del server', error);
        const { response, status } = mapErrorToApiResponse(error);
        return NextResponse.json(response, { status });
        // Continuiamo comunque ad aggiornare lo status nel DB
      }
    }

    // Aggiorna lo status nel database
    await prisma.user_api_keys.update({
      where: { id: keyId },
      data: {
        status: 'REVOKED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subkey revocata con successo',
    });
  } catch (error: unknown) {
    logError('Errore nella revoca della subkey', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
