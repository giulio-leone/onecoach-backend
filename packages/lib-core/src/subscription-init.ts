import { subscriptionService } from './subscription.service';
import { AffiliateService } from './marketplace/affiliate.service';
import { PromotionService } from './marketplace/promotion.service';
import { OpenRouterSubkeyService } from '@giulio-leone/lib-ai';
import { marketplaceService } from './marketplace/marketplace.service';

/**
 * Initializes SubscriptionService with its external dependencies.
 * This pattern avoids circular dependencies between lib-core, lib-marketplace, and lib-ai.
 */
export function initSubscriptionService() {
  subscriptionService.setDependencies({
    affiliateService: AffiliateService,
    promotionService: PromotionService,
    openRouterSubkeyService: OpenRouterSubkeyService,
    marketplaceService: marketplaceService,
  });
}
