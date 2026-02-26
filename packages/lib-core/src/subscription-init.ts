import { subscriptionService } from './subscription.service';
import { AffiliateService } from './marketplace/affiliate.service';
import { PromotionService } from './marketplace/promotion.service';
import { marketplaceService } from './marketplace/marketplace.service';

/**
 * Initializes SubscriptionService with its external dependencies.
 * Uses dynamic import for lib-ai to break circular dep: lib-core → lib-ai → lib-core.
 */
export async function initSubscriptionService() {
  const { OpenRouterSubkeyService } = await import('@giulio-leone/lib-ai');
  subscriptionService.setDependencies({
    affiliateService: AffiliateService,
    promotionService: PromotionService,
    openRouterSubkeyService: OpenRouterSubkeyService,
    marketplaceService: marketplaceService,
  });
}
