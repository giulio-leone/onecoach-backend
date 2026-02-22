import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createId } from '@giulio-leone/lib-shared';
import { seedAdminsFromEnv } from '../auth/admin-seed';

import { logger } from '../logger.service';
// Stable UUID for seed data (idempotent)
const SEED_DEMO_CREDITS_ID = '00000000-0000-4000-8000-000000000100';

export async function seedAuth(prisma: PrismaClient) {
  const isProduction = process.env.NODE_ENV === 'production';

  // PRIORITÀ 1: Crea admin e super admin da env vars (funziona in production E development)
  // Questo garantisce sincronizzazione con Vercel env vars
  logger.warn('🔐 Checking for admin/super admin env vars...');
  const { admin: adminSeedResult, superAdmin: superAdminSeedResult } =
    await seedAdminsFromEnv(prisma);

  let admin = null;

  if (superAdminSeedResult?.admin) {
    logger.warn(
      `✅ Super Admin ${superAdminSeedResult.created ? 'created' : 'updated'}: ${superAdminSeedResult.admin.email}`
    );
    admin = await prisma.users.findUnique({
      where: { email: superAdminSeedResult.admin.email },
    });
  }

  if (adminSeedResult?.admin) {
    logger.warn(
      `✅ Admin ${adminSeedResult.created ? 'created' : 'updated'}: ${adminSeedResult.admin.email}`
    );
    // Se non abbiamo un super admin, usa l'admin per i seed
    if (!admin) {
      admin = await prisma.users.findUnique({
        where: { email: adminSeedResult.admin.email },
      });
    }
  }

  // FALLBACK: Cerca admin esistente se non creato da env vars
  if (!admin) {
    logger.warn('⚠️ No admin env vars found. Searching for existing admin...');
    admin = await prisma.users.findFirst({
      where: {
        OR: [
          { role: 'SUPER_ADMIN', status: 'ACTIVE' },
          { role: 'ADMIN', status: 'ACTIVE' },
        ],
      },
      orderBy: {
        role: 'asc', // SUPER_ADMIN prima di ADMIN
      },
    });
  }

  // DEVELOPMENT ONLY: Crea default admin per seed dati demo
  if (!admin && !isProduction) {
    logger.warn('⚠️ No admin found. Creating default development admin...');
    const defaultEmail = 'admin@onecoach.com';
    const defaultPassword = 'Admin123!';
    const defaultName = 'Admin onecoach';
    const defaultCredits = 10000;

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    admin = await prisma.users.upsert({
      where: { email: defaultEmail },
      update: {
        password: hashedPassword,
        name: defaultName,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        credits: defaultCredits,
      },
      create: {
        id: createId(),
        email: defaultEmail,
        password: hashedPassword,
        name: defaultName,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        credits: defaultCredits,
        updatedAt: new Date(),
      },
    });
    logger.warn('✅ Default development admin created');
  }

  // Se non c'è admin, alcuni seed potrebbero fallire (non critico)
  if (!admin) {
    logger.warn('⚠️ No admin found. Some seeds may be skipped.');
    logger.warn('ℹ️ Set ADMIN_EMAIL/SUPER_ADMIN_EMAIL env vars to create admin during seed.');
  }

  // Demo user (only in development, skip in production)
  let demoUser;
  if (!isProduction) {
    const demoEmail = 'demo@onecoach.com';
    const demoPassword = await bcrypt.hash('Demo123!', 10);

    demoUser = await prisma.users.upsert({
      where: { email: demoEmail },
      update: {},
      create: {
        id: createId(),
        email: demoEmail,
        password: demoPassword,
        name: 'Demo User',
        role: 'USER',
        status: 'ACTIVE',
        credits: 100,
        updatedAt: new Date(),
      },
    });

    // Welcome credits record for demo
    await prisma.credit_transactions.upsert({
      where: {
        // ensure idempotence by stable UUID
        id: SEED_DEMO_CREDITS_ID,
      },
      update: {},
      create: {
        id: SEED_DEMO_CREDITS_ID,
        userId: demoUser.id,
        amount: 100,
        type: 'ADMIN_ADJUSTMENT',
        description: 'Crediti di benvenuto',
        balanceAfter: 100,
      },
    });
  } else {
    // In production, find existing demo user or create placeholder
    demoUser = await prisma.users.findFirst({
      where: { email: 'demo@onecoach.com' },
    });
  }

  return { admin, demoUser: demoUser || admin }; // Fallback to admin if demo user not found
}
