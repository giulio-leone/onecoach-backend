/**
 * Password Reset Confirm API
 *
 * Validates token and updates user password
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@giulio-leone/lib-core';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token richiesto' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password richiesta' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `La password deve essere di almeno ${PASSWORD_MIN_LENGTH} caratteri` },
        { status: 400 }
      );
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            'La password deve contenere almeno una lettera maiuscola, una minuscola e un numero',
        },
        { status: 400 }
      );
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        token: hashedToken,
        usedAt: null,
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token non valido o scaduto. Richiedi un nuovo reset della password.' },
        { status: 400 }
      );
    }

    if (!resetToken.user) {
      return NextResponse.json({ error: 'Token non valido o utente non trovato' }, { status: 400 });
    }

    // Check if user is active
    if (resetToken.user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account non attivo' }, { status: 403 });
    }

    const userId = resetToken.userId ?? resetToken.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'Token non valido o utente non trovato' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and mark token as used in a transaction
    await prisma.$transaction([
      // Update user password
      prisma.users.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }),

      // Mark token as used
      prisma.password_reset_tokens.update({
        where: { id: resetToken.id },
        data: {
          usedAt: new Date(),
        },
      }),

      // Invalidate all other unused tokens for this user
      prisma.password_reset_tokens.updateMany({
        where: {
          userId,
          usedAt: null,
          id: {
            not: resetToken.id,
          },
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    if (process.env.NODE_ENV === 'development') {
      logger.warn('✅ Password reset successful for user:', { email: resetToken.user?.email ?? userId });
    }

    return NextResponse.json({
      success: true,
      message: 'Password aggiornata con successo. Ora puoi effettuare il login.',
    });
  } catch (error: unknown) {
    logError('Errore interno del server', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
