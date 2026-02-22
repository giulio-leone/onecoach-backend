/**
 * Admin Credentials API Route
 *
 * GET: Ottieni le credenziali admin/super admin configurate (solo per visualizzazione)
 * PATCH: Aggiorna le credenziali admin/super admin su Vercel e nel database
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import {
  updateVercelAdminCredentials,
  updateVercelSuperAdminCredentials,
} from '@giulio-leone/lib-vercel-admin';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * GET: Ottieni le credenziali configurate (solo email, non password)
 */
export async function GET() {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    // Ottieni admin e super admin dal database
    const admin = await prisma.users.findFirst({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
      },
    });

    const superAdmin = await prisma.users.findFirst({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
      },
    });

    return NextResponse.json({
      admin: admin || null,
      superAdmin: superAdmin || null,
    });
  } catch (error: unknown) {
    logError('Errore nel recupero credenziali', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * PATCH: Aggiorna le credenziali admin o super admin
 */
export async function PATCH(req: Request) {
  const currentUser = await requireAdmin();

  if (currentUser instanceof NextResponse) {
    return currentUser;
  }

  try {
    const body = await req.json();
    const { type, email, password, name, credits } = body;

    // Validazione
    if (!type || (type !== 'admin' && type !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Tipo deve essere "admin" o "super_admin"' },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password sono richiesti' }, { status: 400 });
    }

    // Validazione password con policy di sicurezza
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: passwordValidation.errors?.[0] || 'Password non valida',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Verifica permessi: admin può modificare solo admin, super admin può modificare entrambi
    if (type === 'super_admin' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Solo i super admin possono modificare le credenziali super admin' },
        { status: 403 }
      );
    }

    // Trova l'utente esistente
    const existingUser = await prisma.users.findFirst({
      where: {
        role: type === 'admin' ? 'ADMIN' : 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Aggiorna nel database
    let updatedUser;
    if (existingUser) {
      // Aggiorna utente esistente
      updatedUser = await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: name?.trim() || existingUser.name,
          credits: credits !== undefined ? Number(credits) : existingUser.credits,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          credits: true,
        },
      });
    } else {
      // Crea nuovo utente (dovrebbe essere raro, ma gestiamolo)
      const { generateUUID } = await import('@giulio-leone/lib-shared/id-generator');
      updatedUser = await prisma.users.create({
        data: {
          id: generateUUID(), // UUID required for Supabase Realtime compatibility
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: name?.trim() || (type === 'admin' ? 'Admin onecoach' : 'Super Admin onecoach'),
          role: type === 'admin' ? 'ADMIN' : 'SUPER_ADMIN',
          status: 'ACTIVE',
          credits: credits !== undefined ? Number(credits) : 10000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          credits: true,
        },
      });
    }

    // Aggiorna in Edge Config (aggiornamento in tempo reale)
    const vercelResult =
      type === 'admin'
        ? await updateVercelAdminCredentials({
            email: updatedUser.email,
            password, // Password in chiaro per Edge Config (verrà hashata da seed)
            name: updatedUser.name || undefined,
            credits: updatedUser.credits,
          })
        : await updateVercelSuperAdminCredentials({
            email: updatedUser.email,
            password, // Password in chiaro per Edge Config (verrà hashata da seed)
            name: updatedUser.name || undefined,
            credits: updatedUser.credits,
          });

    if (!vercelResult.success) {
      // Log l'errore ma non fallire completamente - il database è aggiornato
      logError(
        "Errore nell'aggiornamento su Vercel",
        new Error(vercelResult.error || vercelResult.message)
      );
    }

    return NextResponse.json({
      success: true,
      message: `Credenziali ${type} aggiornate con successo`,
      user: updatedUser,
      vercel: vercelResult,
    });
  } catch (error: unknown) {
    logError("Errore nell'aggiornamento credenziali", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
