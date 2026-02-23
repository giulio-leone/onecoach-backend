/**
 * Admin User API Route
 *
 * GET: Ottiene dettagli di un utente (solo admin/super admin)
 * PATCH: Aggiorna un utente (solo admin/super admin, con protezioni)
 * DELETE: Elimina un utente (solo super admin, non può eliminare super admin)
 */

import { NextResponse } from 'next/server';
import { requireAdmin, requireSuperAdmin } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import bcrypt from 'bcryptjs';
import type { UserRole, UserStatus } from '@giulio-leone/types';
import {
  updateVercelAdminCredentials,
  updateVercelSuperAdminCredentials,
} from '@giulio-leone/lib-vercel-admin';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    const { id: userId } = await params;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            workout_programs: true,
            nutrition_plans: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: unknown) {
    logError('Errore nel recupero utente', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  const currentUser = adminOrError;

  try {
    const { id: userId } = await params;
    const body = await req.json();
    const { email, name, password, role, status, credits } = body;

    // Verifica che l'utente esista
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Protezioni: solo super admin può modificare ruoli e solo super admin può modificare super admin
    if (role && role !== targetUser.role) {
      if (currentUser.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Solo i super admin possono modificare i ruoli' },
          { status: 403 }
        );
      }

      // Non permettere di modificare il ruolo di un super admin se non sei super admin
      if (targetUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Non puoi modificare un super admin' }, { status: 403 });
      }
    }

    // Se si sta modificando un super admin, solo un super admin può farlo
    if (targetUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non puoi modificare un super admin' }, { status: 403 });
    }

    // Prepara i dati da aggiornare
    const updateData: {
      email?: string;
      name?: string | null;
      password?: string;
      role?: UserRole;
      status?: UserStatus;
      credits?: number;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (email !== undefined) {
      // Verifica che l'email non sia già in uso da un altro utente
      const existingUser = await prisma.users.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { error: 'Un utente con questa email esiste già' },
          { status: 409 }
        );
      }

      updateData.email = email.toLowerCase().trim();
    }

    if (name !== undefined) {
      updateData.name = name?.trim() || null;
    }

    if (password !== undefined && password !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role !== undefined && currentUser.role === 'SUPER_ADMIN') {
      updateData.role = role as UserRole;
    }

    if (status !== undefined) {
      updateData.status = status as UserStatus;
    }

    if (credits !== undefined) {
      updateData.credits = credits;
    }

    // Aggiorna utente
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Sincronizza con Edge Config se è admin/super admin e sono stati modificati email, password, name o credits
    const isAdmin = updatedUser.role === 'ADMIN' || updatedUser.role === 'SUPER_ADMIN';
    const hasAdminChanges =
      isAdmin &&
      (email !== undefined ||
        password !== undefined ||
        name !== undefined ||
        credits !== undefined);

    if (hasAdminChanges) {
      try {
        const credentials = {
          email: updatedUser.email,
          password: password || '', // Password in chiaro (vuota se non modificata, non verrà aggiornata in Edge Config)
          name: updatedUser.name || undefined,
          credits: updatedUser.credits,
        };

        if (updatedUser.role === 'SUPER_ADMIN') {
          await updateVercelSuperAdminCredentials(credentials);
        } else if (updatedUser.role === 'ADMIN') {
          await updateVercelAdminCredentials(credentials);
        }
      } catch (error: unknown) {
        // Log l'errore ma non fallire - il database è aggiornato
        logError(
          "Errore nella sincronizzazione con Edge Config (l'utente è stato aggiornato)",
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Utente aggiornato con successo',
      user: updatedUser,
    });
  } catch (error: unknown) {
    logError("Errore nell'aggiornamento utente", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const superAdminOrError = await requireSuperAdmin();

  if (superAdminOrError instanceof NextResponse) {
    return superAdminOrError;
  }

  const currentUser = superAdminOrError;

  try {
    const { id: userId } = await params;

    // Non permettere di eliminare se stessi
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: 'Non puoi eliminare il tuo stesso account' },
        { status: 400 }
      );
    }

    // Verifica che l'utente esista
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Non permettere di eliminare un super admin
    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Non puoi eliminare un account super admin' },
        { status: 403 }
      );
    }

    // Elimina utente (soft delete impostando status a DELETED)
    await prisma.users.update({
      where: { id: userId },
      data: {
        status: 'DELETED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Utente eliminato con successo',
    });
  } catch (error: unknown) {
    logError("Errore nell'eliminazione utente", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
