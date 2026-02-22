import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { logger } from '@giulio-leone/lib-shared';
/**
 * Session data stored securely
 */
export interface SessionData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
  userId: string;
}

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const EXPIRES_AT_KEY = 'auth_expires_at';
const USER_ID_KEY = 'auth_user_id';

/**
 * Securely store session data using expo-secure-store (encrypted)
 * Falls back to AsyncStorage if SecureStore is not available
 */
async function securelySetItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // On web, use AsyncStorage (localStorage)
      await AsyncStorage.setItem(key, value);
    } else {
      // On native, use SecureStore (encrypted)
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error: unknown) {
    logger.error('Error storing secure item', error);
    // Fallback to AsyncStorage
    await AsyncStorage.setItem(key, value);
  }
}

/**
 * Securely retrieve data from storage
 */
async function securelyGetItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error: unknown) {
    logger.error('Error retrieving secure item', error);
    // Fallback to AsyncStorage
    return await AsyncStorage.getItem(key);
  }
}

/**
 * Securely delete data from storage
 */
async function securelyDeleteItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error: unknown) {
    logger.error('Error deleting secure item', error);
    // Fallback to AsyncStorage
    await AsyncStorage.removeItem(key);
  }
}

/**
 * Save session data securely
 */
export async function saveSession(session: SessionData): Promise<void> {
  try {
    await Promise.all([
      securelySetItem(ACCESS_TOKEN_KEY, session.accessToken),
      session.refreshToken
        ? securelySetItem(REFRESH_TOKEN_KEY, session.refreshToken)
        : Promise.resolve(),
      securelySetItem(EXPIRES_AT_KEY, session.expiresAt.toString()),
      securelySetItem(USER_ID_KEY, session.userId),
    ]);
  } catch (error: unknown) {
    logger.error('Error saving session data', error);
    throw new Error('Failed to save session data');
  }
}

/**
 * Get current session data
 * Returns null if no session exists
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const [accessToken, refreshToken, expiresAtStr, userId] = await Promise.all([
      securelyGetItem(ACCESS_TOKEN_KEY),
      securelyGetItem(REFRESH_TOKEN_KEY),
      securelyGetItem(EXPIRES_AT_KEY),
      securelyGetItem(USER_ID_KEY),
    ]);

    if (!accessToken || !expiresAtStr || !userId) {
      return null;
    }

    const expiresAt = parseInt(expiresAtStr, 10);

    return {
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt,
      userId,
    };
  } catch (error: unknown) {
    logger.error('Error getting session', error);
    return null;
  }
}

/**
 * Clear session data (logout)
 */
export async function clearSession(): Promise<void> {
  try {
    await Promise.all([
      securelyDeleteItem(ACCESS_TOKEN_KEY),
      securelyDeleteItem(REFRESH_TOKEN_KEY),
      securelyDeleteItem(EXPIRES_AT_KEY),
      securelyDeleteItem(USER_ID_KEY),
    ]);
  } catch (error: unknown) {
    logger.error('Error clearing session', error);
    throw new Error('Failed to clear session data');
  }
}

/**
 * Check if current session is valid (not expired)
 * Returns true if valid, false if expired or no session
 */
export async function isSessionValid(): Promise<boolean> {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const now = Date.now();
  return session.expiresAt > now;
}

/**
 * Get access token if session is valid
 * Returns null if session is expired or doesn't exist
 */
export async function getAccessToken(): Promise<string | null> {
  const valid = await isSessionValid();
  if (!valid) {
    return null;
  }

  const session = await getSession();
  return session?.accessToken || null;
}

/**
 * Get refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  const session = await getSession();
  return session?.refreshToken || null;
}

/**
 * Update access token (after refresh)
 */
export async function updateAccessToken(accessToken: string, expiresAt: number): Promise<void> {
  try {
    await Promise.all([
      securelySetItem(ACCESS_TOKEN_KEY, accessToken),
      securelySetItem(EXPIRES_AT_KEY, expiresAt.toString()),
    ]);
  } catch (error: unknown) {
    logger.error('Error updating access token', error);
    throw new Error('Failed to update access token');
  }
}

/**
 * Check if session will expire soon (within 5 minutes)
 * Used to proactively refresh token
 */
export async function isSessionExpiringSoon(): Promise<boolean> {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return session.expiresAt - now < fiveMinutes;
}
