import { prisma } from '../prisma';

export class PayoutProfileService {
  static async getProfile(userId: string) {
    return prisma.user_payout_profiles.findUnique({ where: { userId } });
  }

  static async upsertProfile(
    userId: string,
    data: {
      beneficiaryName: string;
      taxCode?: string | null;
      vatNumber?: string | null;
      iban?: string | null;
      bicSwift?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      postalCode?: string | null;
      country?: string | null;
      taxResidence?: string | null;
      notes?: string | null;
    }
  ) {
    const existing = await prisma.user_payout_profiles.findUnique({ where: { userId } });
    if (existing) {
      return prisma.user_payout_profiles.update({ where: { userId }, data });
    }
    return prisma.user_payout_profiles.create({ data: { userId, ...data } });
  }
}
