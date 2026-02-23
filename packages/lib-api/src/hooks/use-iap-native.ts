/**
 * IAP Native Hooks
 *
 * Hooks for React Native/Expo that handle native IAP integration
 * Combines Zustand store + native IAP APIs + TanStack Query
 */

'use client';

import { useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  acknowledgePurchaseAndroid,
  getAvailablePurchases,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';
import {
  useIAPProducts,
  useIAPSubscription,
  useIAPPurchase,
} from '@giulio-leone/lib-stores/iap.store';
import { useSubscriptionStatus, usePurchaseProduct, useRestorePurchases } from './use-iap';
import { ALL_PRODUCT_IDS, PRODUCT_TO_PLAN_MAP } from '@giulio-leone/lib-shared';
import type { ProductId } from '@giulio-leone/lib-stores/iap.store';
import { logger } from '@giulio-leone/lib-shared';

/**
 * Hook to manage IAP in React Native
 * Replaces IAPProvider context
 */
export function useIAP() {
  const { products, setProducts } = useIAPProducts();
  const { subscriptionStatus, setSubscriptionStatus } = useIAPSubscription();
  const { purchaseState, setPurchaseState, error, setError, clearError } = useIAPPurchase();
  const { data: subscriptionData } = useSubscriptionStatus();
  const { mutate: purchaseMutation } = usePurchaseProduct();
  const { mutate: restoreMutation } = useRestorePurchases();

  // Update store when subscription query data changes
  useEffect(() => {
    if (subscriptionData) {
      setSubscriptionStatus(subscriptionData);
    }
  }, [subscriptionData, setSubscriptionStatus]);

  // Initialize IAP connection
  useEffect(() => {
    initializeIAP();
    return () => {
      endConnection();
    };
  }, []);

  // Listen for purchase updates
  useEffect(() => {
    const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
      const receipt =
        'transactionReceipt' in purchase ? purchase.transactionReceipt : purchase.transactionId;
      if (receipt) {
        await handlePurchaseUpdate(purchase);
      }
    });

    const purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
      handlePurchaseError(error);
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  }, []);

  const initializeIAP = async () => {
    try {
      await initConnection();
      logger.info('IAP connection initialized');

      // Load products on init
      await loadProducts();

      // Check subscription status (via query)
      // useSubscriptionStatus will handle this
    } catch (err: unknown) {
      logger.error('IAP initialization error', err);
      setError({
        code: 'INIT_ERROR',
        message: 'Failed to initialize in-app purchases',
      });
    }
  };

  const loadProducts = useCallback(async () => {
    try {
      setPurchaseState('loading-products');
      setError(null);

      const productIds = ALL_PRODUCT_IDS;

      // Get products (iOS and Android both use getProducts)
      const fetchedProducts = await fetchProducts({ skus: productIds });
      if (!fetchedProducts) return;

      const mappedProducts = fetchedProducts.map((product) => {
        const productId =
          ((product as unknown as Record<string, unknown>).productId as string) ??
          ((product as unknown as Record<string, unknown>).productIdentifier as string) ??
          ((product as unknown as Record<string, unknown>).sku as string) ??
          '';
        const rawPrice = ((product as unknown as Record<string, unknown>).price as string) ?? '';
        const price = typeof rawPrice === 'string' ? rawPrice : String(rawPrice || '');

        return {
          productId: productId as ProductId,
          price,
          currency: ((product as unknown as Record<string, unknown>).currency as string) ?? '',
          localizedPrice:
            ((product as unknown as Record<string, unknown>).localizedPrice as string) ?? price,
          title: ((product as unknown as Record<string, unknown>).title as string) ?? productId,
          description:
            ((product as unknown as Record<string, unknown>).description as string) ?? '',
          subscriptionPeriod: getSubscriptionPeriod(productId as ProductId),
        };
      });

      setProducts(mappedProducts);
      setPurchaseState('products-loaded');
    } catch (err: unknown) {
      logger.error('Failed to load products', err);
      setError({
        code: 'LOAD_PRODUCTS_ERROR',
        message: 'Failed to load subscription plans',
      });
      setPurchaseState('error');
    }
  }, [setProducts, setPurchaseState, setError]);

  const purchaseProduct = useCallback(
    async (productId: ProductId): Promise<boolean> => {
      try {
        setPurchaseState('purchasing');
        setError(null);

        // Request purchase
        await requestPurchase({ productId } as unknown as Parameters<typeof requestPurchase>[0]);

        // Purchase update will be handled by purchaseUpdatedListener
        return true;
      } catch (err: unknown) {
        logger.error('Purchase failed', err);
        const error = err as PurchaseError;
        const userCancelled = error.code === 'E_USER_CANCELLED';

        setError({
          code: error.code || 'PURCHASE_ERROR',
          message: userCancelled ? 'Purchase cancelled' : 'Purchase failed',
          userCancelled,
        });
        setPurchaseState('error');
        return false;
      }
    },
    [setPurchaseState, setError]
  );

  const handlePurchaseUpdate = async (purchase: Purchase) => {
    try {
      setPurchaseState('verifying');

      const transactionId = purchase.transactionId || '';
      const transactionReceipt =
        ('transactionReceipt' in purchase
          ? ((purchase as unknown as Record<string, unknown>).transactionReceipt as string)
          : transactionId) || '';
      const purchaseToken =
        'purchaseToken' in purchase
          ? ((purchase as unknown as Record<string, unknown>).purchaseToken as string)
          : undefined;

      // Verify purchase with backend using mutation
      purchaseMutation({
        receipt: transactionReceipt,
        productId: purchase.productId as ProductId,
        platform: Platform.OS as 'ios' | 'android',
        purchaseToken: purchaseToken || undefined,
      });

      // Acknowledge/finish the purchase
      if (Platform.OS === 'ios') {
        await finishTransaction({ purchase, isConsumable: false });
      } else {
        // Android - acknowledge subscription
        if (purchaseToken) {
          await acknowledgePurchaseAndroid(purchaseToken);
        }
      }

      setPurchaseState('completed');

      Alert.alert('Success', 'Your subscription has been activated!', [
        { text: 'OK', onPress: () => setPurchaseState('idle') },
      ]);
    } catch (err: unknown) {
      logger.error('Failed to verify purchase', err);
      setError({
        code: 'VERIFICATION_ERROR',
        message: 'Failed to verify purchase',
      });
      setPurchaseState('error');
    }
  };

  const handlePurchaseError = (error: PurchaseError) => {
    logger.error('Purchase error', error);

    const userCancelled = String(error.code) === 'E_USER_CANCELLED';

    setError({
      code: error.code,
      message: userCancelled ? 'Purchase cancelled' : error.message,
      userCancelled,
    });
    setPurchaseState('error');
  };

  const restorePurchases = useCallback(async () => {
    try {
      setPurchaseState('verifying');
      setError(null);

      // Get available purchases
      const availablePurchases = await getAvailablePurchases();

      if (availablePurchases.length === 0) {
        Alert.alert('No Purchases Found', 'No previous purchases found to restore.');
        setPurchaseState('idle');
        return { success: true, purchases: [] };
      }

      // Map to PurchaseResult
      const purchases = availablePurchases.map((purchase) => {
        const receipt =
          ((purchase as unknown as Record<string, unknown>).transactionReceipt as string) ??
          ((purchase as unknown as Record<string, unknown>).originalTransactionDate as string) ??
          purchase.transactionId ??
          '';
        const productId = ((purchase as unknown as Record<string, unknown>).productId ??
          '') as ProductId;
        const purchaseToken =
          'purchaseToken' in purchase
            ? String((purchase as unknown as Record<string, unknown>).purchaseToken || '')
            : undefined;

        return {
          receipt,
          productId,
          platform: Platform.OS as 'ios' | 'android',
          purchaseToken,
        };
      });

      // Sync with backend using mutation
      restoreMutation({ purchases });

      setPurchaseState('idle');

      Alert.alert('Success', `Restored ${availablePurchases.length} purchase(s)`, [{ text: 'OK' }]);

      return { success: true, purchases };
    } catch (err: unknown) {
      logger.error('Failed to restore purchases', err);
      const error = err as Error;
      setError({
        code: 'RESTORE_ERROR',
        message: 'Failed to restore purchases',
      });
      setPurchaseState('error');
      return { success: false, purchases: [], error: getErrorMessage(error) };
    }
  }, [setPurchaseState, setError, restoreMutation]);

  return {
    products,
    subscriptionStatus,
    purchaseState,
    error,
    loadProducts,
    purchaseProduct,
    restorePurchases,
    clearError,
  };
}

// Helper function
function getSubscriptionPeriod(productId: ProductId): 'monthly' | 'yearly' | undefined {
  const mapping = PRODUCT_TO_PLAN_MAP[productId as keyof typeof PRODUCT_TO_PLAN_MAP];
  if (!mapping) return undefined;
  if (mapping.cycle === 'monthly') return 'monthly';
  if (mapping.cycle === 'yearly') return 'yearly';
  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
