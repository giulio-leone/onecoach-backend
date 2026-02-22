/**
 * IAP React Query Hooks
 *
 * Custom hooks for in-app purchases with TanStack Query and Zustand integration
 */

'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  iapKeys,
  iapQueries,
  type VerifyReceiptRequest,
  type RestorePurchasesRequest,
} from '../queries/iap.queries';
import { useIAPStore } from '@giulio-leone/lib-stores/iap.store';
import { getErrorMessage } from '@giulio-leone/lib-shared';

/**
 * Hook to get subscription status
 *
 * Automatically syncs with Zustand store
 */
export function useSubscriptionStatus() {
  const setSubscriptionStatus = useIAPStore((state: any) => state.setSubscriptionStatus);

  const query = useQuery({
    queryKey: iapKeys.subscriptionStatus(),
    queryFn: async () => {
      const response = await iapQueries.getSubscriptionStatus();
      return response.subscription;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (query.data) {
      setSubscriptionStatus(query.data);
    } else if (query.error) {
      setSubscriptionStatus(null);
    }
  }, [query.data, query.error, setSubscriptionStatus]);

  return query;
}

/**
 * Hook to verify receipt and purchase product
 *
 * Automatically updates Zustand store and invalidates subscription status
 */
export function usePurchaseProduct() {
  const queryClient = useQueryClient();
  const setPurchaseState = useIAPStore((state: any) => state.setPurchaseState);
  const setError = useIAPStore((state: any) => state.setError);
  const setSubscriptionStatus = useIAPStore((state: any) => state.setSubscriptionStatus);

  return useMutation({
    mutationFn: (request: VerifyReceiptRequest) => iapQueries.verifyReceipt(request),
    onMutate: () => {
      setPurchaseState('verifying');
      setError(null);
    },
    onSuccess: async (response) => {
      if (response.valid && response.subscription) {
        setPurchaseState('completed');
        // Update subscription status in store
        setSubscriptionStatus({
          isActive: response.subscription.isActive,
          productId: response.subscription.productId as any,
          expirationDate: response.subscription.expirationDate,
          isInTrialPeriod: response.subscription.isInTrial,
          willAutoRenew: response.subscription.willAutoRenew,
          platform: null, // Will be set by platform-specific code
        });
        // Invalidate and refetch subscription status
        await queryClient.invalidateQueries({ queryKey: iapKeys.subscriptionStatus() });
      } else {
        setPurchaseState('error');
        setError({
          code: 'VERIFICATION_ERROR',
          message: response.error || 'Receipt verification failed',
        });
      }
    },
    onError: (error) => {
      setPurchaseState('error');
      setError({
        code: 'VERIFICATION_ERROR',
        message: getErrorMessage(error),
      });
    },
  });
}

/**
 * Hook to restore purchases
 *
 * Automatically updates Zustand store and invalidates subscription status
 */
export function useRestorePurchases() {
  const queryClient = useQueryClient();
  const setPurchaseState = useIAPStore((state: any) => state.setPurchaseState);
  const setError = useIAPStore((state: any) => state.setError);

  return useMutation({
    mutationFn: (request: RestorePurchasesRequest) => iapQueries.restorePurchases(request),
    onMutate: () => {
      setPurchaseState('verifying');
      setError(null);
    },
    onSuccess: async () => {
      setPurchaseState('idle');
      // Invalidate and refetch subscription status
      await queryClient.invalidateQueries({ queryKey: iapKeys.subscriptionStatus() });
    },
    onError: (error) => {
      setPurchaseState('error');
      setError({
        code: 'RESTORE_ERROR',
        message: getErrorMessage(error),
      });
    },
  });
}
