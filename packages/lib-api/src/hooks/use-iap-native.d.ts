/**
 * IAP Native Hooks
 *
 * Hooks for React Native/Expo that handle native IAP integration
 * Combines Zustand store + native IAP APIs + TanStack Query
 */
import type { ProductId } from '@giulio-leone/lib-stores/iap.store';
/**
 * Hook to manage IAP in React Native
 * Replaces IAPProvider context
 */
export declare function useIAP(): {
  products: import('@giulio-leone/lib-stores/iap.store').IAPProduct[];
  subscriptionStatus: import('@giulio-leone/lib-stores/iap.store').SubscriptionStatus | null;
  purchaseState: import('@giulio-leone/lib-stores/iap.store').PurchaseState;
  error: import('@giulio-leone/lib-stores/iap.store').IAPError | null;
  loadProducts: () => Promise<void>;
  purchaseProduct: (productId: ProductId) => Promise<boolean>;
  restorePurchases: () => Promise<
    | {
        success: boolean;
        purchases: {
          receipt: unknown;
          productId: string;
          platform: 'ios' | 'android';
          purchaseToken: string | undefined;
        }[];
        error?: undefined;
      }
    | {
        success: boolean;
        purchases: never[];
        error: string;
      }
  >;
  clearError: () => void;
};
//# sourceMappingURL=use-iap-native.d.ts.map
