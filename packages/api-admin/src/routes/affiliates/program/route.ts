import { NextResponse } from 'next/server';
import { prisma } from '@giulio-leone/lib-core';
import { requireAdmin } from '@giulio-leone/lib-core';
import type { Prisma as PrismaTypes } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

function sanitizeNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

interface AffiliateLevelInput {
  level: unknown;
  commissionRate: unknown;
  creditReward: unknown;
}

export async function GET() {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const program = await prisma.affiliate_programs.findFirst({
      include: { affiliate_program_levels: { orderBy: { level: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ program });
  } catch (error: unknown) {
    logger.error('Get affiliate program error:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero del programma affiliati' },
      { status: 500 }
    );
  }
}

export async function PUT(_req: Request) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _req.json();
    const {
      id,
      name,
      isActive,
      registrationCredit,
      baseCommissionRate,
      maxLevels,
      rewardPendingDays,
      subscriptionGraceDays,
      lifetimeCommissions,
      levels,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome programma obbligatorio' }, { status: 400 });
    }

    if (!Array.isArray(levels) || levels.length === 0) {
      return NextResponse.json({ error: 'Configurare almeno un livello' }, { status: 400 });
    }

    const sanitizedRegistrationCredit = Math.max(0, sanitizeNumber(registrationCredit));
    const sanitizedBaseRate = Math.max(0, sanitizeNumber(baseCommissionRate));
    const sanitizedMaxLevels = Math.max(1, Math.floor(sanitizeNumber(maxLevels, 1)));
    const sanitizedPendingDays = Math.max(0, Math.floor(sanitizeNumber(rewardPendingDays, 14)));
    const sanitizedGraceDays = Math.max(0, Math.floor(sanitizeNumber(subscriptionGraceDays, 3)));

    const normalizedLevels = (levels as AffiliateLevelInput[])
      .map((level) => ({
        level: Math.max(1, Math.floor(sanitizeNumber(level.level))),
        commissionRate: Math.max(0, sanitizeNumber(level.commissionRate)),
        creditReward: Math.max(0, Math.floor(sanitizeNumber(level.creditReward))),
      }))
      .sort((a, b) => a.level - b.level)
      .slice(0, sanitizedMaxLevels);

    const levelIds = normalizedLevels.map((level) => level.level);
    const existingProgram = id
      ? await prisma.affiliate_programs.findUnique({
          where: { id },
          include: { affiliate_program_levels: true },
        })
      : await prisma.affiliate_programs.findFirst({
          include: { affiliate_program_levels: true },
          orderBy: { createdAt: 'desc' },
        });

    const result = await prisma.$transaction(async (tx) => {
      let targetProgram: PrismaTypes.affiliate_programsGetPayload<{
        include: { affiliate_program_levels: true };
      }> | null = existingProgram;

      if (targetProgram) {
        const updatedProgram = await tx.affiliate_programs.update({
          where: { id: targetProgram.id },
          data: {
            name,
            isActive: Boolean(isActive),
            registrationCredit: sanitizedRegistrationCredit,
            baseCommissionRate: new Prisma.Decimal(sanitizedBaseRate),
            maxLevels: sanitizedMaxLevels,
            rewardPendingDays: sanitizedPendingDays,
            subscriptionGraceDays: sanitizedGraceDays,
            lifetimeCommissions: Boolean(lifetimeCommissions),
          },
          include: { affiliate_program_levels: { orderBy: { level: 'asc' } } },
        });
        targetProgram = updatedProgram;

        await tx.affiliate_program_levels.deleteMany({
          where: {
            programId: targetProgram!.id,
            level: { notIn: levelIds },
          },
        });

        for (const level of normalizedLevels) {
          await tx.affiliate_program_levels.upsert({
            where: {
              programId_level: {
                programId: targetProgram!.id,
                level: level.level,
              },
            },
            update: {
              commissionRate: new Prisma.Decimal(level.commissionRate),
              creditReward: level.creditReward,
            },
            create: {
              programId: targetProgram!.id,
              level: level.level,
              commissionRate: new Prisma.Decimal(level.commissionRate),
              creditReward: level.creditReward,
            },
          });
        }

        return targetProgram;
      }

      const createdProgram = await tx.affiliate_programs.create({
        data: {
          name,
          isActive: Boolean(isActive),
          registrationCredit: sanitizedRegistrationCredit,
          baseCommissionRate: new Prisma.Decimal(sanitizedBaseRate),
          maxLevels: sanitizedMaxLevels,
          rewardPendingDays: sanitizedPendingDays,
          subscriptionGraceDays: sanitizedGraceDays,
          lifetimeCommissions: Boolean(lifetimeCommissions),
          affiliate_program_levels: {
            create: normalizedLevels.map((level) => ({
              level: level.level,
              commissionRate: new Prisma.Decimal(level.commissionRate),
              creditReward: level.creditReward,
            })),
          },
        },
        include: { affiliate_program_levels: { orderBy: { level: 'asc' } } },
      });

      return createdProgram;
    });

    if (isActive && result) {
      await prisma.affiliate_programs.updateMany({
        where: { id: { not: result.id } },
        data: { isActive: false },
      });
    }

    if (!result) {
      return NextResponse.json({ error: 'Failed to create or update program' }, { status: 500 });
    }

    const updatedProgram = await prisma.affiliate_programs.findUnique({
      where: { id: result.id },
      include: { affiliate_program_levels: { orderBy: { level: 'asc' } } },
    });

    if (!updatedProgram) {
      return NextResponse.json({ error: 'Program not found after creation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, program: updatedProgram });
  } catch (error: unknown) {
    logger.error('Update affiliate program error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore nell'aggiornamento del programma affiliati",
      },
      { status: 500 }
    );
  }
}
