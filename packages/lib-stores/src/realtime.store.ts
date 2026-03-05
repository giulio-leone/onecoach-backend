/**
 * Realtime Store
 *
 * Gestione centralizzata delle sottoscrizioni Supabase Realtime con Zustand.
 *
 * PRINCIPI:
 * - KISS: Una sola sottoscrizione per combinazione tabella/filtro
 * - SOLID: Single Responsibility - lo store gestisce solo stato Realtime
 * - DRY: I consumer registrano callback, lo store gestisce le sottoscrizioni
 *
 * ARCHITETTURA:
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    useRealtimeStore                         │
 * │  ┌─────────────────────────────────────────────────────┐   │
 * │  │  subscriptions: Map<channelKey, Subscription>       │   │
 * │  │  ┌───────────────┐  ┌───────────────┐               │   │
 * │  │  │users:id=eq.1  │  │tasks:*        │               │   │
 * │  │  │ listeners: 2  │  │ listeners: 1  │               │   │
 * │  │  └───────────────┘  └───────────────┘               │   │
 * │  └─────────────────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────────────────┘
 *           │                      │
 *    useSyncCredits         useRealtimeInvalidator
 *    (sidebar)              (components)
 * ```
 */

'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

import { logger } from '@giulio-leone/lib-core/logger.service';
// ============================================================================
// Types
// ============================================================================

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T = Record<string, unknown>> {
  eventType: RealtimeEventType;
  new: T;
  old: T;
}

export interface RealtimeListener<T = Record<string, unknown>> {
  id: string;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (record: T) => void;
  onError?: (error: Error) => void;
}

interface Subscription {
  channel: RealtimeChannel;
  table: string;
  filter?: string;
  listeners: Map<string, RealtimeListener>;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ============================================================================
// State & Actions
// ============================================================================

export interface RealtimeState {
  /** Client Supabase inizializzato */
  client: SupabaseClient | null;
  /** Stato della connessione */
  status: ConnectionStatus;
  /** Mappa delle sottoscrizioni attive */
  subscriptions: Map<string, Subscription>;
  /** Ultimo errore */
  lastError: Error | null;
}

export interface RealtimeActions {
  /** Inizializza lo store con il client Supabase autenticato */
  initialize: (client: SupabaseClient) => void;

  /** Resetta lo store (logout) */
  reset: () => void;

  /**
   * Sottoscrive a una tabella.
   * Se esiste già una sottoscrizione per la stessa tabella/filtro,
   * aggiunge solo il listener senza creare un nuovo canale.
   *
   * @returns Funzione di cleanup per rimuovere il listener
   */
  subscribe: <T = Record<string, unknown>>(
    table: string,
    listener: Omit<RealtimeListener<T>, 'id'>,
    options?: { filter?: string }
  ) => () => void;

  /** Ottiene info di debug sulle sottoscrizioni attive */
  getDebugInfo: () => {
    status: ConnectionStatus;
    subscriptionCount: number;
    subscriptions: Record<string, { listenerCount: number; filter?: string }>;
  };
}

export type RealtimeStore = RealtimeState & RealtimeActions;

// ============================================================================
// Helpers
// ============================================================================

let listenerId = 0;
const generateListenerId = () => `listener_${++listenerId}_${Date.now()}`;

const getChannelKey = (table: string, filter?: string): string => `${table}:${filter || '*'}`;

const getChannelName = (channelKey: string): string =>
  `realtime_${channelKey.replace(/[^a-zA-Z0-9]/g, '_')}`;

/**
 * Validates if a string is a valid UUID v4.
 * Supabase Realtime requires valid UUIDs for filtering.
 *
 * NOTE: Since 2024-12-02, all user IDs are native PostgreSQL UUIDs.
 * This validation is kept as a safety fallback for any legacy data.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (value: string): boolean => {
  return UUID_REGEX.test(value);
};

/**
 * Checks if a filter contains a valid value for Supabase Realtime.
 * Returns false for filters with non-UUID IDs (e.g., legacy user_123456_abc).
 *
 * NOTE: Since 2024-12-02, all new users have native UUID IDs.
 * This check handles any remaining legacy data gracefully.
 */
const isValidRealtimeFilter = (filter: string | undefined): boolean => {
  if (!filter) return true; // No filter is valid (subscribes to all)

  // Check for eq. filters with ID-like values
  const eqMatch = filter.match(/=eq\.(.+)$/);
  if (eqMatch && eqMatch[1]) {
    const value = eqMatch[1];
    // If it looks like a legacy ID (contains underscore prefix patterns), validate as UUID
    if (value.includes('_') && !isValidUUID(value)) {
      return false;
    }
  }

  return true;
};

// ============================================================================
// Store
// ============================================================================

const initialState: RealtimeState = {
  client: null,
  status: 'disconnected',
  subscriptions: new Map(),
  lastError: null,
};

export const useRealtimeStore = create<RealtimeStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      initialize: (client) => {
        const { status } = get();

        // Evita re-inizializzazioni
        if (status === 'connected' || status === 'connecting') {
          return;
        }

        set({
          client,
          status: 'connected',
          lastError: null,
        });

        if (process.env.NODE_ENV === 'development') {
          logger.warn('[RealtimeStore] Initialized');
        }
      },

      reset: () => {
        const { client, subscriptions } = get();

        // Chiudi tutti i canali
        subscriptions.forEach((sub: any) => {
          client?.removeChannel(sub.channel);
        });

        set({
          ...initialState,
          subscriptions: new Map(),
        });

        if (process.env.NODE_ENV === 'development') {
          logger.warn('[RealtimeStore] Reset');
        }
      },

      subscribe: <T = Record<string, unknown>>(
        table: string,
        listener: Omit<RealtimeListener<T>, 'id'>,
        options?: { filter?: string }
      ) => {
        const { client, subscriptions } = get();
        const filter = options?.filter;
        const channelKey = getChannelKey(table, filter);
        const id = generateListenerId();

        // Validate filter - skip subscription if filter contains invalid IDs
        // Supabase Realtime requires valid UUIDs for filtering
        if (!isValidRealtimeFilter(filter)) {
          if (process.env.NODE_ENV === 'development') {
            logger.warn(
              `[RealtimeStore] Skipping subscription for ${channelKey} - filter contains non-UUID value. ` +
                'Realtime subscriptions require valid Supabase UUIDs.'
            );
          }
          // Return empty cleanup function - subscription is silently skipped
          return () => {};
        }

        // Crea listener con ID
        const listenerWithId: RealtimeListener<T> = { id, ...listener };

        const existingSub = subscriptions.get(channelKey);

        if (existingSub) {
          // Aggiungi listener a sottoscrizione esistente
          existingSub.listeners.set(id, listenerWithId as RealtimeListener);

          if (process.env.NODE_ENV === 'development') {
            logger.warn(
              `[RealtimeStore] Added listener to ${channelKey} (total: ${existingSub.listeners.size})`
            );
          }
        } else if (client) {
          // Crea nuova sottoscrizione
          const channelName = getChannelName(channelKey);
          const listeners = new Map<string, RealtimeListener>();
          listeners.set(id, listenerWithId as RealtimeListener);

          const channel = client
            .channel(channelName)
            .on(
              'postgres_changes' as const,
              {
                event: '*' as const,
                schema: 'public' as const,
                table,
                filter,
              },
              (payload) => {
                // Propaga evento a tutti i listener
                const sub = get().subscriptions.get(channelKey);
                if (!sub) return;

                sub.listeners.forEach((l: any) => {
                  try {
                    const typedPayload = payload as unknown as RealtimePayload<T>;
                    switch (typedPayload.eventType) {
                      case 'INSERT':
                        (l as RealtimeListener<T>).onInsert?.(typedPayload.new);
                        break;
                      case 'UPDATE':
                        (l as RealtimeListener<T>).onUpdate?.(typedPayload.new);
                        break;
                      case 'DELETE':
                        (l as RealtimeListener<T>).onDelete?.(typedPayload.old);
                        break;
                    }
                  } catch (error) {
                    logger.error('[RealtimeStore] Listener error:', error);
                    (l as RealtimeListener<T>).onError?.(error as Error);
                  }
                });
              }
            )
            .subscribe((status, err) => {
              if (status === 'SUBSCRIBED') {
                if (process.env.NODE_ENV === 'development') {
                  logger.warn(`[RealtimeStore] Subscribed to ${channelKey}`);
                }
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                // Build informative error message
                // Empty {} error typically means Realtime not enabled on table or RLS blocking access
                let errorDetails = '';
                if (err instanceof Error) {
                  errorDetails = err.message;
                } else if (err && typeof err === 'object' && Object.keys(err).length > 0) {
                  errorDetails = JSON.stringify(err);
                } else if (err) {
                  errorDetails = String(err);
                }

                const errorMessage = errorDetails
                  ? `Realtime ${status} on ${channelKey}: ${errorDetails}`
                  : `Realtime ${status} on ${channelKey} - Check if Realtime is enabled on table "${table}" in Supabase Dashboard`;

                const error = err instanceof Error ? err : new Error(errorMessage);

                // Log solo in development per evitare spam nella console
                if (process.env.NODE_ENV === 'development') {
                  logger.warn(`[RealtimeStore] ${status} on ${channelKey}`, {
                    message: error.message,
                  });
                }

                // Aggiorna lo stato con l'errore
                set({ lastError: error });

                // Notifica errore a tutti i listener senza propagare eccezioni
                const sub = get().subscriptions.get(channelKey);
                sub?.listeners.forEach((l: any) => {
                  try {
                    l.onError?.(error);
                  } catch (listenerError) {
                    // Log solo in development per evitare spam
                    if (process.env.NODE_ENV === 'development') {
                      logger.error('[RealtimeStore] Listener onError threw:', listenerError);
                    }
                  }
                });

                // Auto-cleanup failed subscription to prevent retries
                if (status === 'CHANNEL_ERROR') {
                  const { client: c, subscriptions: subs } = get();
                  const failedSub = subs.get(channelKey);
                  if (failedSub) {
                    c?.removeChannel(failedSub.channel);
                    const newSubs = new Map(subs);
                    newSubs.delete(channelKey);
                    set({ subscriptions: newSubs });
                  }
                }
              }
            });

          // Aggiungi alla mappa
          const newSubscriptions = new Map(subscriptions);
          newSubscriptions.set(channelKey, {
            channel,
            table,
            filter,
            listeners,
          });

          set({ subscriptions: newSubscriptions });

          if (process.env.NODE_ENV === 'development') {
            logger.warn(`[RealtimeStore] Created subscription: ${channelKey}`);
          }
        }

        // Cleanup function
        return () => {
          const { client, subscriptions } = get();
          const sub = subscriptions.get(channelKey);

          if (!sub) return;

          sub.listeners.delete(id);

          if (sub.listeners.size === 0) {
            // Nessun listener rimasto, chiudi canale
            client?.removeChannel(sub.channel);

            const newSubscriptions = new Map(subscriptions);
            newSubscriptions.delete(channelKey);
            set({ subscriptions: newSubscriptions });

            if (process.env.NODE_ENV === 'development') {
              logger.warn(`[RealtimeStore] Removed subscription: ${channelKey}`);
            }
          } else if (process.env.NODE_ENV === 'development') {
            logger.warn(
              `[RealtimeStore] Removed listener from ${channelKey} (remaining: ${sub.listeners.size})`
            );
          }
        };
      },

      getDebugInfo: () => {
        const { status, subscriptions } = get();
        const subsInfo: Record<string, { listenerCount: number; filter?: string }> = {};

        subscriptions.forEach((sub, key) => {
          subsInfo[key] = {
            listenerCount: sub.listeners.size,
            filter: sub.filter,
          };
        });

        return {
          status,
          subscriptionCount: subscriptions.size,
          subscriptions: subsInfo,
        };
      },
    })),
    {
      name: 'RealtimeStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selectors (per ottimizzare re-render)
// ============================================================================

/** Selettore per lo stato di connessione */
export const selectRealtimeStatus = (state: RealtimeStore) => state.status;

/** Selettore per verificare se è connesso */
export const selectIsRealtimeReady = (state: RealtimeStore) => state.status === 'connected';

/** Selettore per l'ultimo errore */
export const selectRealtimeError = (state: RealtimeStore) => state.lastError;

// ============================================================================
// Debug helper (esposto su window in development)
// ============================================================================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { __RealtimeStore: typeof useRealtimeStore }).__RealtimeStore =
    useRealtimeStore;
}
