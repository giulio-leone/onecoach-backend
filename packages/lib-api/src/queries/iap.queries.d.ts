/**
 * IAP Query Keys and Functions
 *
 * TanStack Query keys and functions for in-app purchases
 */
import type { SubscriptionStatus, ProductId } from '@giulio-leone/lib-stores/iap.store';
/**
 * IAP query keys factory
 */
export declare const iapKeys: {
    all: readonly ["iap"];
    products: () => readonly ["iap", "products"];
    subscriptionStatus: () => readonly ["iap", "subscription-status"];
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
export declare const iapQueries: {
    /**
     * Get subscription status
     */
    getSubscriptionStatus: () => Promise<{
        subscription: SubscriptionStatus;
    }>;
    /**
     * Verify receipt
     */
    verifyReceipt: (request: VerifyReceiptRequest) => Promise<VerifyReceiptResponse>;
    /**
     * Restore purchases
     */
    restorePurchases: (request: RestorePurchasesRequest) => Promise<RestorePurchasesResponse>;
};
//# sourceMappingURL=iap.queries.d.ts.map