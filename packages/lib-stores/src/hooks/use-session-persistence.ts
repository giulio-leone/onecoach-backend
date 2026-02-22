/**
 * useSessionPersistence Hook
 *
 * Generic hook for persisting session state to localStorage with automatic recovery.
 * Supports TTL-based expiration and debounced writes.
 *
 * @module lib-stores/hooks
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { logger } from '@giulio-leone/lib-shared';

// ============================================================================
// Types
// ============================================================================

export interface SessionPersistenceOptions<T> {
  /** Unique key for localStorage */
  key: string;
  /** Time-to-live in milliseconds (default: 24 hours) */
  ttlMs?: number;
  /** Debounce delay for writes (default: 500ms) */
  debounceMs?: number;
  /** Callback when data is recovered from localStorage */
  onRecover?: (data: T) => void;
  /** Enabled state (default: true) */
  enabled?: boolean;
}

interface PersistedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_DEBOUNCE_MS = 500;
const STORAGE_PREFIX = 'onecoach_session_';

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for persisting session state to localStorage.
 *
 * @example
 * ```tsx
 * const { persist, clear, recover } = useSessionPersistence<WorkoutState>({
 *   key: 'workout-session-123',
 *   onRecover: (data) => restoreUIState(data),
 * });
 *
 * // Persist on every state change
 * useEffect(() => {
 *   persist(currentState);
 * }, [currentState, persist]);
 *
 * // Clear on session complete
 * const handleComplete = () => {
 *   clear();
 *   // ... complete session
 * };
 * ```
 */
export function useSessionPersistence<T>(options: SessionPersistenceOptions<T>) {
  const {
    key,
    ttlMs = DEFAULT_TTL_MS,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    onRecover,
    enabled = true,
  } = options;

  const storageKey = `${STORAGE_PREFIX}${key}`;
  const debounceTimeoutRef = useRef<number | null>(null);
  const lastPersistedRef = useRef<string | null>(null);
  const hasRecoveredRef = useRef(false);

  /**
   * Persist data to localStorage with debouncing
   */
  const persist = useCallback(
    (data: T) => {
      if (!enabled) return;

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = window.setTimeout(() => {
        try {
          const serialized = JSON.stringify(data);

          // Skip if data hasn't changed
          if (serialized === lastPersistedRef.current) {
            return;
          }

          const persisted: PersistedData<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlMs,
          };

          localStorage.setItem(storageKey, JSON.stringify(persisted));
          lastPersistedRef.current = serialized;

          logger.debug('[useSessionPersistence] Persisted session data', {
            key: storageKey,
            expiresAt: new Date(persisted.expiresAt).toISOString(),
          });
        } catch (error) {
          logger.error('[useSessionPersistence] Failed to persist data', { error, key: storageKey });
        }
      }, debounceMs);
    },
    [enabled, storageKey, ttlMs, debounceMs]
  );

  /**
   * Clear persisted data from localStorage
   */
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      lastPersistedRef.current = null;
      logger.debug('[useSessionPersistence] Cleared session data', { key: storageKey });
    } catch (error) {
      logger.error('[useSessionPersistence] Failed to clear data', { error, key: storageKey });
    }
  }, [storageKey]);

  /**
   * Manually recover data from localStorage
   */
  const recover = useCallback((): T | null => {
    if (!enabled) return null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const persisted: PersistedData<T> = JSON.parse(stored);

      // Check expiration
      if (Date.now() > persisted.expiresAt) {
        logger.debug('[useSessionPersistence] Session expired, clearing', { key: storageKey });
        clear();
        return null;
      }

      logger.debug('[useSessionPersistence] Recovered session data', {
        key: storageKey,
        age: Math.round((Date.now() - persisted.timestamp) / 1000) + 's',
      });

      return persisted.data;
    } catch (error) {
      logger.error('[useSessionPersistence] Failed to recover data', { error, key: storageKey });
      return null;
    }
  }, [enabled, storageKey, clear]);

  /**
   * Check if there is persisted data available
   */
  const hasPersisted = useCallback((): boolean => {
    if (!enabled) return false;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return false;

      const persisted: PersistedData<T> = JSON.parse(stored);
      return Date.now() <= persisted.expiresAt;
    } catch {
      return false;
    }
  }, [enabled, storageKey]);

  // Auto-recover on mount
  useEffect(() => {
    if (!enabled || hasRecoveredRef.current) return;

    const data = recover();
    if (data && onRecover) {
      hasRecoveredRef.current = true;
      onRecover(data);
    }
  }, [enabled, recover, onRecover]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    persist,
    clear,
    recover,
    hasPersisted,
  };
}

export default useSessionPersistence;
