import { subscriptionService } from '@giulio-leone/lib-core';
import { AffiliateService } from '@giulio-leone/lib-marketplace';
import { PromotionService } from '@giulio-leone/lib-marketplace';
import { OpenRouterSubkeyService } from '@giulio-leone/lib-ai';
import { marketplaceService } from '@giulio-leone/lib-marketplace';

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
