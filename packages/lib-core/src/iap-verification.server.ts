/**
 * In-App Purchase Receipt Verification
 * Handles verification for both iOS (Apple) and Android (Google Play)
 */ import { logger } from '@giulio-leone/lib-shared';

interface AppleVerificationResponse {
  status: number;
  latest_receipt_info?: Array<{
    original_transaction_id: string;
    product_id: string;
    purchase_date_ms: string;
    expires_date_ms: string;
    is_trial_period: string;
    cancellation_date_ms?: string;
  }>;
  pending_renewal_info?: Array<{
    auto_renew_status: string;
    product_id: string;
  }>;
}

interface GoogleVerificationResponse {
  kind: string;
  purchaseTimeMillis: string;
  purchaseState: number;
  consumptionState: number;
  developerPayload: string;
  orderId: string;
  purchaseType: number;
  acknowledgementState: number;
  expiryTimeMillis?: string;
  autoRenewing?: boolean;
  paymentState?: number;
}

export interface VerificationResult {
  valid: boolean;
  subscription?: {
    productId: string;
    originalTransactionId: string;
    purchaseDate: number;
    expirationDate: number;
    isInTrial: boolean;
    willAutoRenew: boolean;
    isCancelled: boolean;
  };
  error?: string;
}

/**
 * Verify Apple App Store receipt
 * Uses Apple's verifyReceipt API
 */
export async function verifyAppleReceipt(receiptData: string): Promise<VerificationResult> {
  try {
    const sharedSecret = process.env.APPLE_SHARED_SECRET;
    if (!sharedSecret) {
      throw new Error('Apple shared secret not configured');
    }

    // Try production first, then sandbox
    let response = await verifyWithApple(receiptData, sharedSecret, false);

    // If production returns 21007, use sandbox
    if (response.status === 21007) {
      response = await verifyWithApple(receiptData, sharedSecret, true);
    }

    // Status 0 = valid
    if (response.status !== 0) {
      return {
        valid: false,
        error: `Apple verification failed with status ${response.status}`,
      };
    }

    // Get latest receipt info
    const latestReceipt = response.latest_receipt_info?.[0];
    if (!latestReceipt) {
      return {
        valid: false,
        error: 'No receipt info found',
      };
    }

    const expirationDate = parseInt(latestReceipt.expires_date_ms);
    const now = Date.now();
    const isActive = expirationDate > now;
    const isCancelled = !!latestReceipt.cancellation_date_ms;

    // Get auto-renew status
    const renewalInfo = response.pending_renewal_info?.[0];
    const willAutoRenew = renewalInfo?.auto_renew_status === '1';

    return {
      valid: isActive && !isCancelled,
      subscription: {
        productId: latestReceipt.product_id,
        originalTransactionId: latestReceipt.original_transaction_id,
        purchaseDate: parseInt(latestReceipt.purchase_date_ms),
        expirationDate,
        isInTrial: latestReceipt.is_trial_period === 'true',
        willAutoRenew,
        isCancelled,
      },
    };
  } catch (error: unknown) {
    logger.error('IAP verification error', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function verifyWithApple(
  receiptData: string,
  sharedSecret: string,
  sandbox: boolean
): Promise<AppleVerificationResponse> {
  const url = sandbox
    ? 'https://sandbox.itunes.apple.com/verifyReceipt'
    : 'https://buy.itunes.apple.com/verifyReceipt';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'receipt-data': receiptData,
      password: sharedSecret,
      'exclude-old-transactions': true,
    }),
  });

  return response.json();
}

/**
 * Verify Google Play purchase
 * Uses Google Play Developer API
 */
export async function verifyGoogleReceipt(
  productId: string,
  purchaseToken: string
): Promise<VerificationResult> {
  try {
    const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
    if (!packageName) {
      throw new Error('Google Play package name not configured');
    }

    // Get access token
    const accessToken = await getGoogleAccessToken();

    // Verify purchase
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google verification failed: ${response.statusText}`);
    }

    const data: GoogleVerificationResponse = await response.json();

    const expirationDate = data.expiryTimeMillis ? parseInt(data.expiryTimeMillis) : 0;
    const purchaseDate = parseInt(data.purchaseTimeMillis);
    const now = Date.now();
    const isActive = expirationDate > now;
    const willAutoRenew = data.autoRenewing || false;

    // purchaseState: 0 = purchased, 1 = cancelled
    const isCancelled = data.purchaseState === 1;

    return {
      valid: isActive && !isCancelled,
      subscription: {
        productId,
        originalTransactionId: data.orderId,
        purchaseDate,
        expirationDate,
        isInTrial: false, // Google doesn't provide trial info in subscription API
        willAutoRenew,
        isCancelled,
      },
    };
  } catch (error: unknown) {
    logger.error('IAP verification error', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Google Play API access token using service account
 */
async function getGoogleAccessToken(): Promise<string> {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Google service account not properly configured');
    }

    // Create JWT for Google OAuth
    const { sign } = await import('jsonwebtoken');
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const token = sign(payload, serviceAccount.private_key, { algorithm: 'RS256' });

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token,
      }),
    });

    const data = await response.json();
    return data.access_token;
  } catch (error: unknown) {
    logger.error('IAP verification error', error);
    throw error;
  }
}
