/**
 * IAP Query Keys and Functions
 *
 * TanStack Query keys and functions for in-app purchases
 */

import { apiClient } from '../client';
import type { SubscriptionStatus, ProductId } from '@giulio-leone/lib-stores/iap.store';

/**
 * IAP query keys factory
 */
export const iapKeys = {
  all: ['iap'] as const,
  products: () => [...iapKeys.all, 'products'] as const,
  subscriptionStatus: () => [...iapKeys.all, 'subscription-status'] as const,
};

/**
 * Verify receipt request
 */
export interface VerifyReceiptRequest {
  receipt: string;
  productId: ProductId;
  platform: 'ios' | 'android';
  purchaseToken?: string;
}

/**
 * Verify receipt response
 */
export interface VerifyReceiptResponse {
  valid: boolean;
  subscription?: {
    productId: string;
    expirationDate: number;
    isActive: boolean;
    isInTrial: boolean;
    willAutoRenew: boolean;
  };
  error?: string;
}

/**
 * Restore purchases request
 */
export interface RestorePurchasesRequest {
  purchases: Array<{
    receipt: string;
    productId: ProductId;
    platform: 'ios' | 'android';
    purchaseToken?: string;
  }>;
}

/**
 * Restore purchases response
 */
export interface RestorePurchasesResponse {
  success: boolean;
  restoredPurchases: number;
}

/**
 * IAP query functions
 */
export const iapQueries = {
  /**
   * Get subscription status
   */
  getSubscriptionStatus: async (): Promise<{ subscription: SubscriptionStatus }> => {
    const response = await apiClient.get<{ subscription: SubscriptionStatus }>(
      '/api/iap/subscription-status'
    );
    return response;
  },

  /**
   * Verify receipt
   */
  verifyReceipt: async (request: VerifyReceiptRequest): Promise<VerifyReceiptResponse> => {
    const response = await apiClient.post<VerifyReceiptResponse>(
      '/api/iap/verify-receipt',
      request
    );
    return response;
  },

  /**
   * Restore purchases
   */
  restorePurchases: async (request: RestorePurchasesRequest): Promise<RestorePurchasesResponse> => {
    const response = await apiClient.post<RestorePurchasesResponse>(
      '/api/iap/restore-purchases',
      request
    );
    return response;
  },
};
