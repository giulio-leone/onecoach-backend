import { PrismaClient } from '@prisma/client';
import { createId } from '@giulio-leone/lib-shared';

export async function seedAffiliate(prisma: PrismaClient, adminUserId: string) {
  const program = await prisma.affiliate_programs.upsert({
    where: { id: 'aff_prog_default' },
    update: {
      name: 'Programma Affiliazione Default',
      isActive: false,
      registrationCredit: 100,
      baseCommissionRate: 0.1,
      maxLevels: 3,
      subscriptionGraceDays: 3,
      rewardPendingDays: 14,
      lifetimeCommissions: true,
    },
    create: {
      id: 'aff_prog_default',
      name: 'Programma Affiliazione Default',
      isActive: false,
      registrationCredit: 100,
      baseCommissionRate: 0.1,
      maxLevels: 3,
      subscriptionGraceDays: 3,
      rewardPendingDays: 14,
      lifetimeCommissions: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const levels = [
    { level: 1, commissionRate: 0.1, creditReward: 100 },
    { level: 2, commissionRate: 0.05, creditReward: 50 },
    { level: 3, commissionRate: 0.02, creditReward: 25 },
  ];

  for (const lvl of levels) {
    await prisma.affiliate_program_levels.upsert({
      where: { programId_level: { programId: program.id, level: lvl.level } },
      update: {
        commissionRate: lvl.commissionRate,
        creditReward: lvl.creditReward,
      },
      create: {
        id: createId(),
        programId: program.id,
        level: lvl.level,
        commissionRate: lvl.commissionRate,
        creditReward: lvl.creditReward,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // Referral code admin (best effort)
  try {
    const module = (await import('@onecoach/lib-marketplace/affiliate.service')) as {
      AffiliateService?: {
        ensureUserReferralCode?: (userId: string, programId: string) => Promise<void>;
      };
    };
    if (module.AffiliateService?.ensureUserReferralCode) {
      await module.AffiliateService.ensureUserReferralCode(adminUserId, program.id);
    }
  } catch (_error: unknown) {}

  return program;
}
