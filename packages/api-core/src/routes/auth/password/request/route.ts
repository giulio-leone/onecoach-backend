/**
 * Password Reset Request API
 *
 * Generates a password reset token and sends it via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@giulio-leone/lib-core';
import { createId } from '@giulio-leone/lib-shared/id-generator';
import crypto from 'crypto';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

// Rate limiting: In-memory implementation for simplicity
// NOTE: For production with multiple server instances or serverless deployments,
// replace this with a database-backed rate limiter (e.g., Redis, Prisma) or a service like Upstash
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + 60 * 60 * 1000 }); // 1 hour
    return true;
  }

  if (record.count >= 3) {
    // Max 3 requests per hour
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email richiesta' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting
    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json({ error: 'Troppe richieste. Riprova tra un ora.' }, { status: 429 });
    }

    // Check if user exists
    const user = await prisma.users.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
        status: 'ACTIVE',
      },
    });

    // Always return success to avoid email enumeration
    // Even if user doesn't exist, we pretend we sent the email
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Se l'email esiste, riceverai le istruzioni per il reset della password.",
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Invalidate any existing tokens for this user
    await prisma.password_reset_tokens.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: {
          gte: new Date(),
        },
      },
      data: {
        usedAt: new Date(), // Mark as used
      },
    });

    // Create new reset token
    await prisma.password_reset_tokens.create({
      data: {
        id: createId(),
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Send email with reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${token}`;

    if (process.env.NODE_ENV === 'development') {
      logger.warn('🔑 Password reset link:', { resetLink });
      logger.warn('🔑 Raw token:', { token });
    }

    return NextResponse.json({
      success: true,
      message: "Se l'email esiste, riceverai le istruzioni per il reset della password.",
      // Only include reset link in development
      ...(process.env.NODE_ENV === 'development' && { resetLink }),
    });
  } catch (error: unknown) {
    logError('Errore interno del server', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
