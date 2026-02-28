import { prisma } from '../prisma';

type OnboardingProfileInput = {
  name?: string;
  age?: number;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm?: number;
  weightKg?: number;
};

export async function saveOnboardingProfile(
  userId: string,
  profileData: OnboardingProfileInput
): Promise<void> {
  const { name, age, sex, heightCm, weightKg } = profileData;

  await prisma.$transaction(async (tx: any) => {
    if (name) {
      await tx.users.update({
        where: { id: userId },
        data: { name },
      });
    }

    await tx.user_profiles.upsert({
      where: { userId },
      update: {
        ...(age !== undefined ? { age } : {}),
        ...(sex !== undefined ? { sex } : {}),
        ...(heightCm !== undefined ? { heightCm } : {}),
        ...(weightKg !== undefined ? { weightKg } : {}),
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        userId,
        age: age ?? null,
        sex: sex ?? null,
        heightCm: heightCm ?? null,
        weightKg: weightKg ?? null,
        updatedAt: new Date(),
      },
    });
  });
}
