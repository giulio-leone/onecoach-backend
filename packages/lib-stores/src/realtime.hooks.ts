/**
 * Realtime Hooks
 *
 * Hook React per interagire con lo store Realtime in modo pulito e type-safe.
 * Seguono i principi KISS e DRY, wrappando la logica comune.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRealtimeStore, selectIsRealtimeReady, type RealtimeListener } from './realtime.store';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { logger } from '@giulio-leone/lib-core';
export type MagicAnimationType = 'glow' | 'shimmer' | 'pulse' | 'border' | 'ripple' | 'update';

export interface UseMagicAnimationOptions {
  /** Durata dell'animazione in ms (default: 1500) */
  duration?: number;
  /** Tipo di animazione (default: 'update') */
  type?: MagicAnimationType;
  /** Callback quando l'animazione inizia */
  onStart?: () => void;
  /** Callback quando l'animazione finisce */
  onEnd?: () => void;
}

export interface UseMagicAnimationResult {
  /** Se l'animazione è attiva */
  isAnimating: boolean;
  /** Classe CSS da applicare all'elemento */
  animationClass: string;
  /** Trigger manuale dell'animazione */
  trigger: () => void;
  /** Resetta l'animazione */
  reset: () => void;
}

/**
 * Hook per applicare animazioni "magiche" quando arrivano aggiornamenti Realtime.
 *
 * Le animazioni CSS sono definite in globals.css e includono:
 * - `glow`: effetto glow pulsante viola
 * - `shimmer`: shimmer che attraversa l'elemento
 * - `pulse`: scala leggermente l'elemento
 * - `border`: bordo gradient animato
 * - `ripple`: effetto ripple dal centro
 * - `update`: combinazione di glow + pulse (default)
 *
 * @example
 * ```tsx
 * // Uso base - trigger su cambio di data
 * const { animationClass, trigger } = useMagicAnimation();
 *
 * useEffect(() => {
 *   if (dataChanged) trigger();
 * }, [data, trigger]);
 *
 * return <div className={cn('card', animationClass)}>...</div>;
 * ```
 *
 * @example
 * ```tsx
 * // Con Realtime subscription
 * const { animationClass, trigger } = useMagicAnimation({ type: 'shimmer' });
 *
 * useRealtimeSubscription({
 *   table: 'workout_programs',
 *   filter: `id=eq.${programId}`,
 *   onUpdate: (data) => {
 *     updateLocalData(data);
 *     trigger(); // Mostra l'animazione magic
 *   },
 * });
 *
 * return <div className={cn('workout-card', animationClass)}>...</div>;
 * ```
 *
 * @example
 * ```tsx
 * // Con callback
 * const { animationClass, trigger } = useMagicAnimation({
 *   type: 'glow',
 *   duration: 2000,
 *   onStart: () => logger.warn('Animation started'),
 *   onEnd: () => logger.warn('Animation ended'),
 * });
 * ```
 */
export function useMagicAnimation(options: UseMagicAnimationOptions = {}): UseMagicAnimationResult {
  const { duration = 1500, type = 'update', onStart, onEnd } = options;
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Classe CSS basata sul tipo
  const getAnimationClass = (animationType: MagicAnimationType): string => {
    switch (animationType) {
      case 'glow':
        return 'magic-glow';
      case 'shimmer':
        return 'magic-shimmer';
      case 'pulse':
        return 'magic-pulse';
      case 'border':
        return 'magic-border active';
      case 'ripple':
        return 'magic-ripple';
      case 'update':
      default:
        return 'magic-update';
    }
  };

  const trigger = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsAnimating(true);
    onStart?.();

    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      onEnd?.();
    }, duration);
  }, [duration, onStart, onEnd]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isAnimating,
    animationClass: isAnimating ? getAnimationClass(type) : '',
    trigger,
    reset,
  };
}

// ============================================================================
// useRealtimeWithMagic - Combinazione di Realtime + Magic Animation
// ============================================================================

export interface UseRealtimeWithMagicOptions<
  T = Record<string, unknown>,
> extends UseRealtimeSubscriptionOptions<T> {
  /** Tipo di animazione magic */
  animationType?: MagicAnimationType;
  /** Durata animazione */
  animationDuration?: number;
}

/**
 * Hook che combina Realtime subscription con animazione magic.
 * Quando arriva un update, triggera automaticamente l'animazione.
 *
 * @example
 * ```tsx
 * const { animationClass } = useRealtimeWithMagic({
 *   table: 'nutrition_plans',
 *   filter: `id=eq.${planId}`,
 *   animationType: 'shimmer',
 *   onUpdate: (plan) => setLocalPlan(plan),
 * });
 *
 * return <div className={cn('plan-card', animationClass)}>...</div>;
 * ```
 */
export function useRealtimeWithMagic<T = Record<string, unknown>>({
  animationType = 'update',
  animationDuration = 1500,
  onInsert,
  onUpdate,
  onDelete,
  ...subscriptionOptions
}: UseRealtimeWithMagicOptions<T>): UseMagicAnimationResult & { isSubscribed: boolean } {
  const magic = useMagicAnimation({ type: animationType, duration: animationDuration });
  const isReady = useRealtimeStore(selectIsRealtimeReady);

  // Wrapper callbacks che triggerano l'animazione
  const handleInsert = useCallback(
    (record: T) => {
      onInsert?.(record);
      magic.trigger();
    },
    [onInsert, magic]
  );

  const handleUpdate = useCallback(
    (record: T) => {
      onUpdate?.(record);
      magic.trigger();
    },
    [onUpdate, magic]
  );

  const handleDelete = useCallback(
    (record: T) => {
      onDelete?.(record);
      magic.trigger();
    },
    [onDelete, magic]
  );

  useRealtimeSubscription<T>({
    ...subscriptionOptions,
    onInsert: onInsert ? handleInsert : undefined,
    onUpdate: onUpdate ? handleUpdate : undefined,
    onDelete: onDelete ? handleDelete : undefined,
  });

  return {
    ...magic,
    isSubscribed: isReady && subscriptionOptions.enabled !== false,
  };
}

// ============================================================================
// useRealtimeSubscription - Hook base per sottoscrizioni
// ============================================================================

export interface UseRealtimeSubscriptionOptions<T = Record<string, unknown>> {
  /** Nome della tabella da ascoltare */
  table: string;
  /** Filtro PostgREST (es: "id=eq.123") */
  filter?: string;
  /** Abilita/disabilita la sottoscrizione (default: true) */
  enabled?: boolean;
  /** Callback per INSERT */
  onInsert?: (record: T) => void;
  /** Callback per UPDATE */
  onUpdate?: (record: T) => void;
  /** Callback per DELETE */
  onDelete?: (record: T) => void;
  /** Callback per errori */
  onError?: (error: Error) => void;
}

/**
 * Hook per sottoscrivere a eventi Realtime su una tabella.
 *
 * @example
 * ```tsx
 * useRealtimeSubscription({
 *   table: 'users',
 *   filter: userId ? `id=eq.${userId}` : undefined,
 *   enabled: !!userId,
 *   onUpdate: (user) => logger.warn('User updated:', user),
 * });
 * ```
 */
export function useRealtimeSubscription<T = Record<string, unknown>>({
  table,
  filter,
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
  onError,
}: UseRealtimeSubscriptionOptions<T>) {
  const isReady = useRealtimeStore(selectIsRealtimeReady);
  const subscribe = useRealtimeStore((state) => state.subscribe);

  // Refs per callback stabili (evita re-sottoscrizioni)
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete, onError });

  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete, onError };
  }, [onInsert, onUpdate, onDelete, onError]);

  useEffect(() => {
    if (!isReady || !enabled) {
      return;
    }

    // Wrapper che usa sempre le callback più recenti
    const listener: Omit<RealtimeListener<T>, 'id'> = {
      onInsert: (record) => callbacksRef.current.onInsert?.(record),
      onUpdate: (record) => callbacksRef.current.onUpdate?.(record),
      onDelete: (record) => callbacksRef.current.onDelete?.(record),
      onError: (error) => callbacksRef.current.onError?.(error),
    };

    const unsubscribe = subscribe<T>(table, listener, { filter });

    return unsubscribe;
  }, [isReady, enabled, table, filter, subscribe]);
}

// ============================================================================
// useSyncField - Hook per sincronizzare un singolo campo
// ============================================================================

export interface UseSyncFieldOptions<T, K extends keyof T> {
  /** Nome della tabella */
  table: string;
  /** Filtro PostgREST */
  filter?: string;
  /** Abilita/disabilita */
  enabled?: boolean;
  /** Campo da sincronizzare */
  field: K;
  /** Valore corrente (per evitare update inutili) */
  currentValue?: T[K];
  /** Callback quando il campo cambia */
  onSync: (value: T[K]) => void;
  /** Callback per errori */
  onError?: (error: Error) => void;
}

/**
 * Hook specializzato per sincronizzare un singolo campo di una tabella.
 *
 * @example
 * ```tsx
 * useSyncField({
 *   table: 'users',
 *   filter: `id=eq.${userId}`,
 *   enabled: !!userId,
 *   field: 'credits',
 *   currentValue: user?.credits,
 *   onSync: (credits) => updateUser({ credits }),
 * });
 * ```
 */
export function useSyncField<T extends Record<string, unknown>, K extends keyof T>({
  table,
  filter,
  enabled = true,
  field,
  currentValue,
  onSync,
  onError,
}: UseSyncFieldOptions<T, K>) {
  const currentValueRef = useRef(currentValue);

  useEffect(() => {
    currentValueRef.current = currentValue;
  }, [currentValue]);

  const handleUpdate = useCallback(
    (record: T) => {
      const newValue = record[field];
      if (newValue !== currentValueRef.current) {
        onSync(newValue);
      }
    },
    [field, onSync]
  );

  useRealtimeSubscription<T>({
    table,
    filter,
    enabled,
    onUpdate: handleUpdate,
    onError,
  });
}

// ============================================================================
// useRealtimeSync - Hook per TRUE realtime sync con React Query
// ============================================================================

export interface UseRealtimeSyncOptions<T extends { id: string | number }> {
  /** Nome della tabella da sincronizzare */
  table: string;
  /** Query key React Query per il cache */
  queryKey: readonly unknown[];
  /** Filtro PostgREST opzionale (es: "user_id=eq.123") */
  filter?: string;
  /** Abilita/disabilita la sottoscrizione (default: true) */
  enabled?: boolean;
  /** Trasforma il record dal DB prima di salvarlo nel cache (opzionale) */
  transform?: (record: Record<string, unknown>) => T;
  /** Callback per errori */
  onError?: (error: Error) => void;
  /** Callback post-sync (opzionale, per logging o side effects) */
  onSynced?: (event: 'INSERT' | 'UPDATE' | 'DELETE', record: T) => void;
}

/**
 * Hook per sincronizzazione VERA in tempo reale con React Query.
 *
 * A differenza di invalidation-based approaches, questo hook aggiorna
 * DIRETTAMENTE il cache di React Query, garantendo UI update istantanei.
 *
 * Supporta:
 * - INSERT: aggiunge il nuovo record alla lista nel cache
 * - UPDATE: sostituisce il record esistente con i dati aggiornati
 * - DELETE: rimuove il record dalla lista nel cache
 *
 * @example
 * ```tsx
 * // Lista di workout programs
 * const { data: programs } = useQuery({
 *   queryKey: ['workout-programs', userId],
 *   queryFn: () => fetchWorkoutPrograms(userId),
 * });
 *
 * // Sincronizzazione realtime
 * useRealtimeSync<WorkoutProgram>({
 *   table: 'workout_programs',
 *   queryKey: ['workout-programs', userId],
 *   filter: `user_id=eq.${userId}`,
 *   enabled: !!userId,
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Con transform per mappare campi
 * useRealtimeSync<NutritionPlan>({
 *   table: 'nutrition_plans',
 *   queryKey: ['nutrition-plans', date],
 *   transform: (record) => ({
 *     ...record,
 *     createdAt: new Date(record.created_at as string),
 *   }),
 * });
 * ```
 */
export function useRealtimeSync<T extends { id: string | number }>({
  table,
  queryKey,
  filter,
  enabled = true,
  transform,
  onError,
  onSynced,
}: UseRealtimeSyncOptions<T>) {
  const handleInsert = useCallback(
    (rawRecord: Record<string, unknown>) => {
      const record = (transform ? transform(rawRecord) : rawRecord) as T;

      // Usa global queryClient (deve essere impostato in _app o providers)
      const globalQueryClient = (
        globalThis as { queryClient?: import('@tanstack/react-query').QueryClient }
      ).queryClient;

      if (globalQueryClient) {
        globalQueryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
          if (!oldData) return [record];
          // Evita duplicati
          if (oldData.some((item) => item.id === record.id)) return oldData;
          return [...oldData, record];
        });
        onSynced?.('INSERT', record);
      }
    },
    [queryKey, transform, onSynced]
  );

  const handleUpdate = useCallback(
    (rawRecord: Record<string, unknown>) => {
      const record = (transform ? transform(rawRecord) : rawRecord) as T;

      const globalQueryClient = (
        globalThis as { queryClient?: import('@tanstack/react-query').QueryClient }
      ).queryClient;

      if (globalQueryClient) {
        globalQueryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
          if (!oldData) return [record];
          return oldData.map((item: { id: unknown; [key: string]: unknown }) =>
            item.id === record.id ? record : item
          );
        });
        onSynced?.('UPDATE', record);
      }
    },
    [queryKey, transform, onSynced]
  );

  const handleDelete = useCallback(
    (rawRecord: Record<string, unknown>) => {
      const record = (transform ? transform(rawRecord) : rawRecord) as T;

      const globalQueryClient = (
        globalThis as { queryClient?: import('@tanstack/react-query').QueryClient }
      ).queryClient;

      if (globalQueryClient) {
        globalQueryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter(
            (item: { id: unknown; [key: string]: unknown }) => item.id !== record.id
          );
        });
        onSynced?.('DELETE', record);
      }
    },
    [queryKey, transform, onSynced]
  );

  useRealtimeSubscription<Record<string, unknown>>({
    table,
    filter,
    enabled,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    onError,
  });
}

// --- Logger Factory ---
const createRealtimeLogger = (context: string) => {
  return {
    log: (message: string, data?: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[Realtime][${context}] ${message}`, data !== undefined ? { data } : undefined);
      }
    },
    warn: (message: string, data?: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`[Realtime][${context}] ${message}`, data !== undefined ? { data } : undefined);
      }
    },
    error: (message: string, error?: unknown) => {
      logger.error(`[Realtime][${context}] ${message}`, error);
    },
  };
};

export interface UseRealtimeListSyncOptions<T> extends UseRealtimeSubscriptionOptions<T> {
  queryKey: QueryKey;
  queryClient: QueryClient;
  transform?: (record: Record<string, unknown>) => T;
  onSynced?: (event: 'INSERT' | 'UPDATE' | 'DELETE', record: T) => void;
}

/**
 * Hook standardizzato per sincronizzare liste di record.
 * Gestisce automaticamente INSERT (append), UPDATE (replace), DELETE (remove).
 */
export function useRealtimeListSync<T extends { id: string | number }>({
  table,
  queryKey,
  queryClient,
  filter,
  enabled = true,
  transform,
  onError,
  onSynced,
}: UseRealtimeListSyncOptions<T>) {
  const logger = createRealtimeLogger(`ListSync:${table}`);

  const handleInsert = useCallback(
    (rawRecord: Record<string, unknown>) => {
      const record = (transform ? transform(rawRecord) : rawRecord) as T;

      queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
        if (!oldData) return [record];
        // Evita duplicati
        if (oldData.some((item) => item.id === record.id)) return oldData;
        return [...oldData, record];
      });

      logger.log('Synced INSERT', record.id);
      onSynced?.('INSERT', record);
    },
    [queryClient, queryKey, transform, onSynced, logger]
  );

  const handleUpdate = useCallback(
    (rawRecord: Record<string, unknown>) => {
      const record = (transform ? transform(rawRecord) : rawRecord) as T;

      queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
        if (!oldData) return [record];
        return oldData.map((item: any) => (item.id === record.id ? record : item));
      });

      logger.log('Synced UPDATE', record.id);
      onSynced?.('UPDATE', record);
    },
    [queryClient, queryKey, transform, onSynced, logger]
  );

  const handleDelete = useCallback(
    (rawRecord: Record<string, unknown>) => {
      const record = (transform ? transform(rawRecord) : rawRecord) as T;

      queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter((item: any) => item.id !== record.id);
      });

      logger.log('Synced DELETE', record.id);
      onSynced?.('DELETE', record);
    },
    [queryClient, queryKey, transform, onSynced, logger]
  );

  useRealtimeSubscription({
    table,
    filter,
    enabled,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    onError: (err) => {
      logger.error('Subscription error', err);
      onError?.(err);
    },
  });
}

// ============================================================================
// useRealtimeSyncSingle - Hook per singolo record (non lista)
// ============================================================================

export interface UseRealtimeSyncSingleOptions<T extends { id: string | number }> {
  /** Nome della tabella */
  table: string;
  /** ID del record da osservare */
  recordId: string | number;
  /** Query key React Query */
  queryKey: readonly unknown[];
  /** QueryClient */
  queryClient: import('@tanstack/react-query').QueryClient;
  /** Abilita/disabilita */
  enabled?: boolean;
  /** Trasforma record */
  transform?: (record: Record<string, unknown>) => T;
  /** Callback errori */
  onError?: (error: Error) => void;
  /** Callback post-sync */
  onSynced?: (event: 'UPDATE' | 'DELETE', record: T) => void;
}

/**
 * Hook per sincronizzare un SINGOLO record (non una lista).
 * Ideale per pagine di dettaglio.
 *
 * @example
 * ```tsx
 * const { data: workout } = useQuery({
 *   queryKey: ['workout', workoutId],
 *   queryFn: () => fetchWorkout(workoutId),
 * });
 *
 * const queryClient = useQueryClient();
 *
 * useRealtimeSyncSingle<WorkoutProgram>({
 *   table: 'workout_programs',
 *   recordId: workoutId,
 *   queryKey: ['workout', workoutId],
 *   queryClient,
 *   enabled: !!workoutId,
 * });
 * ```
 */
export function useRealtimeSyncSingle<T extends { id: string | number }>({
  table,
  recordId,
  queryKey,
  queryClient,
  enabled = true,
  transform,
  onError,
  onSynced,
}: UseRealtimeSyncSingleOptions<T>) {
  const filter = `id=eq.${recordId}`;

  const handleUpdate = useCallback(
    (rawRecord: Record<string, unknown>) => {
      const record = (transform ? transform(rawRecord) : rawRecord) as T;
      queryClient.setQueryData(queryKey, record);
      onSynced?.('UPDATE', record);
    },
    [queryClient, queryKey, transform, onSynced]
  );

  const handleDelete = useCallback(
    (rawRecord: Record<string, unknown>) => {
      const record = (transform ? transform(rawRecord) : rawRecord) as T;
      queryClient.setQueryData(queryKey, null);
      onSynced?.('DELETE', record);
    },
    [queryClient, queryKey, transform, onSynced]
  );

  useRealtimeSubscription<Record<string, unknown>>({
    table,
    filter,
    enabled: enabled && !!recordId,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    onError,
  });
}

// ============================================================================
// useRealtimeStatus - Hook per lo stato della connessione
// ============================================================================

/**
 * Hook per ottenere lo stato della connessione Realtime.
 *
 * @example
 * ```tsx
 * const { isReady, status } = useRealtimeStatus();
 * if (!isReady) return <LoadingSpinner />;
 * ```
 */
export function useRealtimeStatus() {
  const status = useRealtimeStore((state) => state.status);
  const lastError = useRealtimeStore((state) => state.lastError);
  const reset = useRealtimeStore((state) => state.reset);

  return {
    status,
    isReady: status === 'connected',
    lastError,
    /** Forza reset della connessione */
    reconnect: reset,
  };
}

// ============================================================================
// useRealtimeDebug - Hook per debugging
// ============================================================================

/**
 * Hook per debugging delle sottoscrizioni Realtime.
 * Usa solo in development.
 *
 * @example
 * ```tsx
 * const debug = useRealtimeDebug();
 * logger.warn(debug);
 * // { status: 'connected', subscriptionCount: 2, subscriptions: {...} }
 * ```
 */
export function useRealtimeDebug() {
  const getDebugInfo = useRealtimeStore((state) => state.getDebugInfo);
  return getDebugInfo();
}
