import { NextResponse } from 'next/server';
import { auth } from '@giulio-leone/lib-core/auth';
import { decide, featureFlagsService } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import type { UserRole } from '@giulio-leone/types';

export const dynamic = 'force-dynamic';

interface SessionUser {
  id: string;
  role: UserRole;
}

const FLAG_KEY = 'ENABLE_INVITATION_REGISTRATION';

/**
 * GET /api/admin/invitations/settings
 * Restituisce lo stato del flag per le registrazioni tramite invito
 */
export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Controlla il flag
    const isEnabled = await decide(FLAG_KEY, {
      userId: user.id,
      userRole: user.role,
    });

    // Ottieni anche i dettagli del flag dal database
    const flag = await featureFlagsService.getFeatureFlag(FLAG_KEY);

    return NextResponse.json({
      enabled: isEnabled,
      flag: flag
        ? {
            key: flag.key,
            name: flag.name,
            description: flag.description,
            enabled: flag.enabled,
            strategy: flag.strategy,
          }
        : null,
    });
  } catch (error: unknown) {
    logError('Error fetching invitation settings', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * PATCH /api/admin/invitations/settings
 * Toggle del flag per abilitare/disabilitare registrazioni tramite invito
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
    }

    // Verifica che il flag esista
    const existingFlag = await featureFlagsService.getFeatureFlag(FLAG_KEY);
    if (!existingFlag) {
      return NextResponse.json(
        { error: 'Feature flag not found. Please run database seed.' },
        { status: 404 }
      );
    }

    // Se il valore è diverso, aggiorna
    if (existingFlag.enabled !== enabled) {
      await featureFlagsService.updateFeatureFlag(FLAG_KEY, { enabled }, user.id);
    }

    // Restituisci lo stato aggiornato
    const updatedFlag = await featureFlagsService.getFeatureFlag(FLAG_KEY);

    return NextResponse.json({
      enabled: updatedFlag?.enabled ?? false,
      flag: updatedFlag
        ? {
            key: updatedFlag.key,
            name: updatedFlag.name,
            description: updatedFlag.description,
            enabled: updatedFlag.enabled,
            strategy: updatedFlag.strategy,
          }
        : null,
    });
  } catch (error: unknown) {
    logError('Error updating invitation settings', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
