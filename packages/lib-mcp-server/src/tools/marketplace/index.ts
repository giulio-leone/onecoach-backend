/**
 * MCP Marketplace & Affiliate Tools
 *
 * Tools for managing marketplace products, orders, and affiliate programs.
 * Uses actual Prisma schema field names.
 *
 * @module lib-mcp-server/tools/marketplace
 */

import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { prisma, type Prisma } from '@giulio-leone/lib-core';

// ============================================================================
// MARKETPLACE PLAN TOOLS
// ============================================================================

export const marketplaceListPlansTool: McpTool = {
  name: 'marketplace_list_plans',
  description: 'Lists marketplace plans (nutrition/workout plans for sale)',
  parameters: z.object({
    planType: z.enum(['NUTRITION', 'WORKOUT', 'ALL']).default('ALL'),
    coachId: z.string().optional(),
    isPublished: z.boolean().optional(),
    limit: z.number().int().min(1).max(50).default(20),
    offset: z.number().int().min(0).default(0),
  }),
  execute: async (args, _context: McpContext) => {
    const where: Prisma.marketplace_plansWhereInput = {};

    if (args.planType !== 'ALL') {
      where.planType = args.planType;
    }
    if (args.coachId) {
      where.coachId = args.coachId;
    }
    if (args.isPublished !== undefined) {
      where.isPublished = args.isPublished;
    }

    const plans = await prisma.marketplace_plans.findMany({
      where,
      take: args.limit,
      skip: args.offset,
      include: {
        coach: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      content: [
        {
          type: 'text',
          text:
            plans.length > 0
              ? `🛒 **${plans.length} piani trovati:**\n\n${plans
                  .map(
                    (p: any) =>
                      `• **${p.title}** (${p.planType})\n  💰 €${p.price} | ⭐ ${p.averageRating ?? 'N/A'} | 👤 ${p.coach?.name ?? 'N/A'}`
                  )
                  .join('\n\n')}`
              : 'Nessun piano nel marketplace',
        },
      ],
      plans,
    };
  },
};

export const marketplaceGetPlanTool: McpTool = {
  name: 'marketplace_get_plan',
  description: 'Gets details of a marketplace plan',
  parameters: z.object({
    planId: z.string(),
  }),
  execute: async (args, _context: McpContext) => {
    const plan = await prisma.marketplace_plans.findUnique({
      where: { id: args.planId },
      include: {
        coach: { select: { name: true, email: true } },
        plan_ratings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!plan) {
      throw new Error('Piano non trovato');
    }

    return {
      content: [
        {
          type: 'text',
          text: `📋 **${plan.title}**

📝 ${plan.description}

💰 **Prezzo:** €${plan.price}
⭐ **Rating:** ${plan.averageRating ?? 'N/A'} (${plan.totalReviews} recensioni)
🏷️ **Tipo:** ${plan.planType}
📊 **Pubblicato:** ${plan.isPublished ? 'Sì' : 'No'}
👤 **Coach:** ${plan.coach?.name ?? 'N/A'}
🔢 **Vendite:** ${plan.totalPurchases}`,
        },
      ],
      plan,
    };
  },
};

export const marketplaceCreatePlanTool: McpTool = {
  name: 'marketplace_create_plan',
  description: 'Creates a new marketplace plan',
  parameters: z.object({
    title: z.string().min(3).max(255),
    description: z.string().min(10).max(2000),
    planType: z.enum(['NUTRITION', 'WORKOUT']),
    price: z.number().min(0),
    nutritionPlanId: z.string().optional(),
    workoutProgramId: z.string().optional(),
    coverImage: z.string().optional(),
  }),
  execute: async (args, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const plan = await prisma.marketplace_plans.create({
      data: {
        title: args.title,
        description: args.description,
        planType: args.planType,
        price: args.price,
        nutritionPlanId: args.nutritionPlanId,
        workoutProgramId: args.workoutProgramId,
        coachId: context.userId,
        isPublished: false,
        coverImage: args.coverImage,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Piano marketplace "${plan.title}" creato!\n\n💡 Pubblica con \`marketplace_update_plan\` impostando isPublished: true`,
        },
      ],
      plan,
    };
  },
};

export const marketplaceUpdatePlanTool: McpTool = {
  name: 'marketplace_update_plan',
  description: 'Updates a marketplace plan',
  parameters: z.object({
    planId: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    isPublished: z.boolean().optional(),
    coverImage: z.string().optional(),
  }),
  execute: async (args, _context: McpContext) => {
    const { planId, ...updates } = args;

    const updateData: Prisma.marketplace_plansUpdateInput = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.isPublished === true) {
      updateData.publishedAt = new Date();
    }

    const plan = await prisma.marketplace_plans.update({
      where: { id: planId },
      data: updateData,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Piano "${plan.title}" aggiornato (Pubblicato: ${plan.isPublished ? 'Sì' : 'No'})`,
        },
      ],
      plan,
    };
  },
};

// ============================================================================
// PURCHASE TOOLS
// ============================================================================

export const marketplaceListPurchasesTool: McpTool = {
  name: 'marketplace_list_purchases',
  description: 'Lists purchases for a coach or buyer',
  parameters: z.object({
    coachId: z.string().optional(),
    userId: z.string().optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'REFUNDED', 'FAILED', 'ALL']).default('ALL'),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  execute: async (args, _context: McpContext) => {
    const where: Prisma.plan_purchasesWhereInput = {};

    if (args.coachId) {
      where.marketplace_plan = { coachId: args.coachId };
    }
    if (args.userId) {
      where.userId = args.userId;
    }
    if (args.status !== 'ALL') {
      where.status = args.status;
    }

    const purchases = await prisma.plan_purchases.findMany({
      where,
      take: args.limit,
      include: {
        marketplace_plan: { select: { title: true, planType: true } },
        users: { select: { name: true } },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    const totalRevenue = purchases.reduce((sum: number, o) => sum + (o.price?.toNumber() ?? 0), 0);

    return {
      content: [
        {
          type: 'text',
          text: `📦 **${purchases.length} acquisti** (€${totalRevenue.toFixed(2)} totali)\n\n${purchases
            .map(
              (o: any) => `• ${o.marketplace_plan?.title ?? 'N/A'} - €${o.price ?? 0} (${o.status})`
            )
            .join('\n')}`,
        },
      ],
      purchases,
      totalRevenue,
    };
  },
};

export const marketplaceGetPurchaseTool: McpTool = {
  name: 'marketplace_get_purchase',
  description: 'Gets details of a specific purchase',
  parameters: z.object({
    purchaseId: z.string(),
  }),
  execute: async (args, _context: McpContext) => {
    const purchase = await prisma.plan_purchases.findUnique({
      where: { id: args.purchaseId },
      include: {
        marketplace_plan: true,
        users: { select: { name: true, email: true } },
      },
    });

    if (!purchase) {
      throw new Error('Acquisto non trovato');
    }

    return {
      content: [
        {
          type: 'text',
          text: `🧾 **Acquisto #${purchase.id.slice(0, 8)}**

📋 Piano: ${purchase.marketplace_plan?.title ?? 'N/A'}
👤 Acquirente: ${purchase.users?.name ?? 'N/A'}
💰 Importo: €${purchase.price ?? 0}
📊 Status: ${purchase.status}
📅 Data: ${purchase.purchasedAt.toLocaleDateString('it-IT')}`,
        },
      ],
      purchase,
    };
  },
};

// ============================================================================
// AFFILIATE TOOLS
// ============================================================================

export const affiliateGetStatsTool: McpTool = {
  name: 'affiliate_get_stats',
  description: 'Gets affiliate statistics for a user',
  parameters: z.object({
    userId: z.string().optional(),
  }),
  execute: async (args, context: McpContext) => {
    const userId = args.userId ?? context.userId;

    if (!userId) {
      throw new Error('User ID required');
    }

    // Get referral code
    const referralCode = await prisma.referral_codes.findUnique({
      where: { userId },
    });

    // Get rewards
    const rewards = await prisma.affiliate_rewards.aggregate({
      where: { userId },
      _sum: { currencyAmount: true },
      _count: true,
    });

    // Get pending rewards
    const pendingRewards = await prisma.affiliate_rewards.aggregate({
      where: {
        userId,
        status: 'PENDING',
      },
      _sum: { currencyAmount: true },
    });

    // Get attributions count if referral code exists
    let attributionsCount = 0;
    if (referralCode) {
      attributionsCount = await prisma.referral_attributions.count({
        where: { referralCodeId: referralCode.id },
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Statistiche Affiliate**

🔗 **Codice referral:** ${referralCode?.code ?? 'Nessuno'}
👥 **Referral totali:** ${attributionsCount}
💰 **Commissioni totali:** €${rewards._sum?.currencyAmount?.toNumber() ?? 0}
⏳ **In attesa di payout:** €${pendingRewards._sum?.currencyAmount?.toNumber() ?? 0}
📈 **Numero transazioni:** ${rewards._count}`,
        },
      ],
      stats: {
        referralCode: referralCode?.code,
        totalReferrals: attributionsCount,
        totalCommissions: rewards._sum?.currencyAmount?.toNumber() ?? 0,
        pendingPayout: pendingRewards._sum?.currencyAmount?.toNumber() ?? 0,
      },
    };
  },
};

export const affiliateGetLinksTool: McpTool = {
  name: 'affiliate_get_links',
  description: 'Gets or creates affiliate referral links',
  parameters: z.object({
    userId: z.string().optional(),
    programId: z.string().optional(),
  }),
  execute: async (args, context: McpContext) => {
    const userId = args.userId ?? context.userId;

    if (!userId) {
      throw new Error('User ID required');
    }

    let code = await prisma.referral_codes.findUnique({
      where: { userId },
      include: {
        affiliate_programs: { select: { name: true } },
      },
    });

    // If no code exists and programId provided, create one
    if (!code && args.programId) {
      code = await prisma.referral_codes.create({
        data: {
          code: `REF-${userId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          userId,
          programId: args.programId,
        },
        include: {
          affiliate_programs: { select: { name: true } },
        },
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: code
            ? `🔗 **Link Affiliate:**\n\n• **${code.code}** (${code.affiliate_programs?.name ?? 'Default'})`
            : 'Nessun codice referral. Specifica un programId per crearne uno.',
        },
      ],
      code,
    };
  },
};

export const affiliateListReferralsTool: McpTool = {
  name: 'affiliate_list_referrals',
  description: 'Lists referrals made through affiliate links',
  parameters: z.object({
    userId: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  execute: async (args, context: McpContext) => {
    const userId = args.userId ?? context.userId;

    if (!userId) {
      throw new Error('User ID required');
    }

    // First get the user's referral code
    const referralCode = await prisma.referral_codes.findUnique({
      where: { userId },
    });

    if (!referralCode) {
      return {
        content: [{ type: 'text', text: 'Nessun codice referral associato a questo utente' }],
        referrals: [],
      };
    }

    const referrals = await prisma.referral_attributions.findMany({
      where: { referralCodeId: referralCode.id },
      take: args.limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      content: [
        {
          type: 'text',
          text:
            referrals.length > 0
              ? `👥 **${referrals.length} Referral**\n\n${referrals
                  .map(
                    (r: any) =>
                      `• Status: ${r.status} | Livello: ${r.level} | ${r.createdAt.toLocaleDateString('it-IT')}`
                  )
                  .join('\n')}`
              : 'Nessun referral registrato',
        },
      ],
      referrals,
    };
  },
};

// ============================================================================
// RATING TOOLS
// ============================================================================

export const marketplaceAddRatingTool: McpTool = {
  name: 'marketplace_add_rating',
  description: 'Adds a rating to a marketplace plan (must have purchased)',
  parameters: z.object({
    marketplacePlanId: z.string(),
    rating: z.number().int().min(1).max(5),
    review: z.string().max(1000).optional(),
  }),
  execute: async (args, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized');
    }

    // Verify purchase exists
    const hasPurchased = await prisma.plan_purchases.findFirst({
      where: {
        marketplacePlanId: args.marketplacePlanId,
        userId: context.userId,
        status: 'COMPLETED',
      },
    });

    if (!hasPurchased) {
      throw new Error('Devi aver acquistato questo piano per lasciare una recensione');
    }

    const planRating = await prisma.plan_ratings.create({
      data: {
        marketplacePlanId: args.marketplacePlanId,
        userId: context.userId,
        rating: args.rating,
        review: args.review,
      },
    });

    // Update average rating on plan
    const avgResult = await prisma.plan_ratings.aggregate({
      where: { marketplacePlanId: args.marketplacePlanId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.marketplace_plans.update({
      where: { id: args.marketplacePlanId },
      data: {
        averageRating: avgResult._avg.rating,
        totalReviews: avgResult._count,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `⭐ Recensione aggiunta: ${args.rating}/5\n${args.review ? `"${args.review}"` : ''}`,
        },
      ],
      planRating,
    };
  },
};

// ============================================================================
// ANALYTICS TOOLS
// ============================================================================

export const marketplaceGetAnalyticsTool: McpTool = {
  name: 'marketplace_get_analytics',
  description: 'Gets marketplace analytics for a coach',
  parameters: z.object({
    coachId: z.string().optional(),
    days: z.number().int().min(7).max(365).default(30),
  }),
  execute: async (args, context: McpContext) => {
    const coachId = args.coachId ?? context.userId;

    if (!coachId) {
      throw new Error('Coach ID required');
    }

    const since = new Date();
    since.setDate(since.getDate() - args.days);

    const [revenue, purchaseCount, planCount, topPlan] = await Promise.all([
      prisma.plan_purchases.aggregate({
        where: {
          marketplace_plan: { coachId },
          purchasedAt: { gte: since },
          status: 'COMPLETED',
        },
        _sum: { price: true },
      }),
      prisma.plan_purchases.count({
        where: {
          marketplace_plan: { coachId },
          purchasedAt: { gte: since },
          status: 'COMPLETED',
        },
      }),
      prisma.marketplace_plans.count({
        where: { coachId, isPublished: true },
      }),
      prisma.marketplace_plans.findFirst({
        where: { coachId },
        orderBy: { totalPurchases: 'desc' },
        select: { title: true, totalPurchases: true },
      }),
    ]);

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Analytics Marketplace (${args.days} giorni)**

💰 **Revenue:** €${revenue._sum.price?.toNumber() ?? 0}
📦 **Vendite:** ${purchaseCount}
📋 **Piani pubblicati:** ${planCount}
🏆 **Top seller:** ${topPlan?.title ?? 'N/A'} (${topPlan?.totalPurchases ?? 0} vendite)`,
        },
      ],
      analytics: {
        revenue: revenue._sum.price?.toNumber() ?? 0,
        purchases: purchaseCount,
        publishedPlans: planCount,
        topPlan,
      },
    };
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const marketplaceTools = [
  marketplaceListPlansTool,
  marketplaceGetPlanTool,
  marketplaceCreatePlanTool,
  marketplaceUpdatePlanTool,
  marketplaceListPurchasesTool,
  marketplaceGetPurchaseTool,
  affiliateGetStatsTool,
  affiliateGetLinksTool,
  affiliateListReferralsTool,
  marketplaceAddRatingTool,
  marketplaceGetAnalyticsTool,
];

import { arrayToToolRecord } from '../../utils/helpers';

export const marketplaceToolsRecord = arrayToToolRecord(marketplaceTools);
