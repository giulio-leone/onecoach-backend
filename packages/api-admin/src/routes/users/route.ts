/**
 * Admin Users API Route
 *
 * GET: Lista tutti gli utenti (solo admin/super admin)
 * POST: Crea un nuovo utente (solo super admin)
 */

import { NextResponse } from 'next/server';
import { requireAdmin, requireSuperAdmin } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import bcrypt from 'bcryptjs';
import { generateUUID } from '@giulio-leone/lib-shared/id-generator';
import type { UserRole, UserStatus } from '@giulio-leone/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const adminOrError = await requireAdmin();

  if (adminOrError instanceof NextResponse) {
    return adminOrError;
  }

  try {
    // Pagination parameters with sensible defaults
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));

    const [users, total] = await Promise.all([
      prisma.users.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.users.count(),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: unknown) {
    logError('Errore nel recupero utenti', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function POST(req: Request) {
  const superAdminOrError = await requireSuperAdmin();

  if (superAdminOrError instanceof NextResponse) {
    return superAdminOrError;
  }

  try {
    const body = await req.json();
    const { email, name, password, role, status, credits } = body;

    // Validazione
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password sono richiesti' }, { status: 400 });
    }

    // Verifica che l'email non esista già
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Un utente con questa email esiste già' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea utente
    const user = await prisma.users.create({
      data: {
        id: generateUUID(), // UUID required for Supabase Realtime compatibility
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        password: hashedPassword,
        role: (role as UserRole) || 'USER',
        status: (status as UserStatus) || 'ACTIVE',
        credits: credits || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        credits: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Utente creato con successo',
        user,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logError('Errore nella creazione utente', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
