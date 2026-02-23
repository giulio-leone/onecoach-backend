/**
 * IAP React Query Hooks
 *
 * Custom hooks for in-app purchases with TanStack Query and Zustand integration
 */
import { type VerifyReceiptRequest, type RestorePurchasesRequest } from '../queries/iap.queries';
/**
 * Hook to get subscription status
 *
 * Automatically syncs with Zustand store
 */
export declare function useSubscriptionStatus(): import('@tanstack/react-query').UseQueryResult<
  import('@giulio-leone/lib-stores/iap.store').SubscriptionStatus,
  Error
>;
/**
 * Hook to verify receipt and purchase product
 *
 * Automatically updates Zustand store and invalidates subscription status
 */
export declare function usePurchaseProduct(): import('@tanstack/react-query').UseMutationResult<
  import('..').VerifyReceiptResponse,
  Error,
  VerifyReceiptRequest,
  void
>;
/**
 * Hook to restore purchases
 *
 * Automatically updates Zustand store and invalidates subscription status
 */
export declare function useRestorePurchases(): import('@tanstack/react-query').UseMutationResult<
  import('..').RestorePurchasesResponse,
  Error,
  RestorePurchasesRequest,
  void
>;
//# sourceMappingURL=use-iap.d.ts.map
