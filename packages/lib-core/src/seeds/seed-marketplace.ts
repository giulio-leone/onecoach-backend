import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createId } from '@giulio-leone/lib-shared';

import { logger } from '../logger.service';
// Stable UUIDs for seed data (idempotent)
// Generated once and kept constant to allow repeated seeding
const SEED_PLAN_WORKOUT_ID = '00000000-0000-4000-8000-000000000001';
const SEED_PLAN_NUTRITION_ID = '00000000-0000-4000-8000-000000000002';

export async function seedMarketplace(prisma: PrismaClient) {
  // Create coach
  const coachEmail = 'coach@onecoach.com';
  const coachPassword = await bcrypt.hash('Coach123!', 10);
  const coach = await prisma.users.upsert({
    where: { email: coachEmail },
    update: { password: coachPassword, role: 'COACH', status: 'ACTIVE', name: 'Coach Demo' },
    create: {
      id: createId(),
      email: coachEmail,
      password: coachPassword,
      role: 'COACH',
      status: 'ACTIVE',
      credits: 500,
      name: 'Coach Demo',
      updatedAt: new Date(),
    },
  });

  await prisma.coach_profiles.upsert({
    where: { userId: coach.id },
    update: { verificationStatus: 'APPROVED', isPubliclyVisible: true, updatedAt: new Date() },
    create: {
      id: createId(),
      userId: coach.id,
      bio: 'Coach certificato con 10+ anni di esperienza in forza e nutrizione.',
      verificationStatus: 'APPROVED',
      isPubliclyVisible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Plans (published) - using stable UUIDs for idempotent seeding
  const plans = [
    {
      id: SEED_PLAN_WORKOUT_ID,
      planType: 'WORKOUT' as const,
      title: 'Forza Base 8 settimane',
      description: 'Programma full-body per sviluppare forza fondamentale in 8 settimane.',
      price: 29.99,
    },
    {
      id: SEED_PLAN_NUTRITION_ID,
      planType: 'NUTRITION' as const,
      title: 'Nutrizione Essenziale 4 settimane',
      description: 'Piano alimentare semplice per abitudini sostenibili.',
      price: 19.99,
    },
  ];

  for (const p of plans) {
    await prisma.marketplace_plans.upsert({
      where: { id: p.id },
      update: {
        coachId: coach.id,
        planType: p.planType,
        title: p.title,
        description: p.description,
        price: p.price,
        currency: 'EUR',
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        id: p.id,
        coachId: coach.id,
        planType: p.planType,
        title: p.title,
        description: p.description,
        price: p.price,
        currency: 'EUR',
        isPublished: true,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  logger.warn(`✅ Marketplace coach and plans seeded: ${plans.length} plans`);
}
