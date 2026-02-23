/**
 * Chat Store
 *
 * Zustand store per gestione centralizzata della chat.
 * Funge da SSOT (Single Source of Truth) per:
 * - Lista conversazioni
 * - Conversazione corrente
 * - Messaggi (sincronizzati con AI SDK)
 * - Stati UI (loading, deleting, etc.)
 *
 * PRINCIPI:
 * - KISS: Stato semplice e prevedibile
 * - SOLID: Single Responsibility - solo stato chat
 * - DRY: Azioni riutilizzabili
 */

'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import { logger } from '@giulio-leone/lib-core';
// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatConversation {
  id: string;
  title: string;
  preview: string;
  updatedAt: Date;
  domain?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// State & Actions
// ============================================================================

export interface ChatState {
  /** Lista delle conversazioni dell'utente */
  conversations: ChatConversation[];
  /** ID della conversazione corrente */
  currentConversationId: string | null;
  /** Messaggi della conversazione corrente (managed by AI SDK, synced here) */
  messages: ChatMessage[];
  /** Input corrente dell'utente */
  input: string;
  /** Se sta inviando un messaggio */
  isLoading: boolean;
  /** Se sta eliminando conversazioni */
  isDeleting: boolean;
  /** Ultimo errore */
  lastError: string | null;
  /** User ID corrente */
  userId: string | null;
}

export interface ChatActions {
  /** Inizializza lo store con userId */
  initialize: (userId: string) => void;

  /** Reset dello store (logout) */
  reset: () => void;

  // === Conversations ===
  /** Imposta la lista conversazioni */
  setConversations: (conversations: ChatConversation[]) => void;

  /** Aggiunge una conversazione alla lista */
  addConversation: (conversation: ChatConversation) => void;

  /** Aggiorna una conversazione esistente */
  updateConversation: (id: string, updates: Partial<ChatConversation>) => void;

  /** Rimuove una conversazione dalla lista */
  removeConversation: (id: string) => void;

  /** Rimuove più conversazioni */
  removeConversations: (ids: string[]) => void;

  /** Svuota tutte le conversazioni */
  clearConversations: () => void;

  /** Imposta la conversazione corrente */
  setCurrentConversation: (id: string | null) => void;

  // === Messages ===
  /** Imposta i messaggi (chiamato da AI SDK sync) */
  setMessages: (messages: ChatMessage[]) => void;

  /** Aggiunge un messaggio */
  addMessage: (message: ChatMessage) => void;

  /** Aggiorna un messaggio esistente */
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;

  /** Rimuove un messaggio */
  removeMessage: (id: string) => void;

  /** Svuota i messaggi */
  clearMessages: () => void;

  // === Input ===
  /** Imposta l'input dell'utente */
  setInput: (input: string) => void;

  // === Loading States ===
  /** Imposta stato loading */
  setIsLoading: (loading: boolean) => void;

  /** Imposta stato deleting */
  setIsDeleting: (deleting: boolean) => void;

  /** Imposta errore */
  setError: (error: string | null) => void;

  // === API Actions ===
  /** Fetch delle conversazioni dal server */
  fetchConversations: () => Promise<void>;

  /** Carica una conversazione specifica con i suoi messaggi */
  loadConversation: (conversationId: string) => Promise<void>;

  /** Elimina una conversazione */
  deleteConversation: (id: string) => Promise<void>;

  /** Elimina più conversazioni */
  deleteConversations: (ids: string[]) => Promise<void>;

  /** Elimina tutte le conversazioni */
  deleteAllConversations: () => Promise<void>;

  /** Rinomina una conversazione */
  renameConversation: (id: string, title: string) => Promise<void>;

  /** Inizia una nuova conversazione */
  startNewConversation: () => void;
}

export type ChatStore = ChatState & ChatActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  messages: [],
  input: '',
  isLoading: false,
  isDeleting: false,
  lastError: null,
  userId: null,
};

// ============================================================================
// Store
// ============================================================================

export const useChatStore = create<ChatStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // === Initialization ===
      initialize: (userId) => {
        set({ userId, lastError: null });
        // Auto-fetch conversations on init
        get().fetchConversations();
      },

      reset: () => {
        set(initialState);
      },

      // === Conversations ===
      setConversations: (conversations) => {
        set({ conversations });
      },

      addConversation: (conversation) => {
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        }));
      },

      updateConversation: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      removeConversation: (id) => {
        const { currentConversationId } = get();
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          // Se stiamo cancellando la conversazione corrente, resetta
          ...(currentConversationId === id && {
            currentConversationId: null,
            messages: [],
          }),
        }));
      },

      removeConversations: (ids) => {
        const { currentConversationId } = get();
        set((state) => ({
          conversations: state.conversations.filter((c) => !ids.includes(c.id)),
          // Se stiamo cancellando la conversazione corrente, resetta
          ...(currentConversationId &&
            ids.includes(currentConversationId) && {
              currentConversationId: null,
              messages: [],
            }),
        }));
      },

      clearConversations: () => {
        set({
          conversations: [],
          currentConversationId: null,
          messages: [],
        });
      },

      setCurrentConversation: (id) => {
        set({ currentConversationId: id });
      },

      // === Messages ===
      setMessages: (messages) => {
        set({ messages });
      },

      addMessage: (message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      removeMessage: (id) => {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== id),
        }));
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      // === Input ===
      setInput: (input) => {
        set({ input });
      },

      // === Loading States ===
      setIsLoading: (isLoading) => {
        set({ isLoading });
      },

      setIsDeleting: (isDeleting) => {
        set({ isDeleting });
      },

      setError: (lastError) => {
        set({ lastError });
      },

      // === API Actions ===
      fetchConversations: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
          const response = await fetch(`/api/copilot/conversations?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            const conversations: ChatConversation[] = (data.conversations || []).map(
              (c: Record<string, unknown>) => ({
                id: c.id as string,
                title: (c.title as string) || 'Nuova conversazione',
                preview: (c.preview as string) || '',
                updatedAt: new Date(c.updatedAt as string),
                domain: c.domain as string | undefined,
              })
            );
            set({ conversations });
          }
        } catch (error) {
          logger.error('[ChatStore] Error fetching conversations:', error);
          set({ lastError: 'Errore nel caricamento delle conversazioni' });
        }
      },

      loadConversation: async (conversationId) => {
        try {
          const response = await fetch(`/api/copilot/conversations/${conversationId}`);
          if (response.ok) {
            const data = await response.json();
            const messages: ChatMessage[] = (data.messages || []).map(
              (m: Record<string, unknown>) => ({
                id: m.id as string,
                role: ((m.role as string) || 'user').toLowerCase() as ChatMessage['role'],
                content: (m.content as string) || '',
                createdAt: m.timestamp ? new Date(m.timestamp as string) : new Date(),
              })
            );
            set({
              currentConversationId: conversationId,
              messages,
            });
          }
        } catch (error) {
          logger.error('[ChatStore] Error loading conversation:', error);
          set({ lastError: 'Errore nel caricamento della conversazione' });
        }
      },

      deleteConversation: async (id) => {
        set({ isDeleting: true });
        try {
          const response = await fetch(`/api/copilot/conversations/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            get().removeConversation(id);
          } else {
            set({ lastError: 'Errore nella cancellazione della conversazione' });
          }
        } catch (error) {
          logger.error('[ChatStore] Error deleting conversation:', error);
          set({ lastError: 'Errore nella cancellazione della conversazione' });
        } finally {
          set({ isDeleting: false });
        }
      },

      deleteConversations: async (ids) => {
        if (ids.length === 0) return;

        set({ isDeleting: true });
        try {
          const response = await fetch('/api/copilot/conversations', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          });
          if (response.ok) {
            get().removeConversations(ids);
          } else {
            set({ lastError: 'Errore nella cancellazione delle conversazioni' });
          }
        } catch (error) {
          logger.error('[ChatStore] Error deleting conversations:', error);
          set({ lastError: 'Errore nella cancellazione delle conversazioni' });
        } finally {
          set({ isDeleting: false });
        }
      },

      deleteAllConversations: async () => {
        set({ isDeleting: true });
        try {
          const response = await fetch('/api/copilot/conversations', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ all: true }),
          });
          if (response.ok) {
            get().clearConversations();
          } else {
            set({ lastError: 'Errore nella cancellazione di tutte le conversazioni' });
          }
        } catch (error) {
          logger.error('[ChatStore] Error deleting all conversations:', error);
          set({ lastError: 'Errore nella cancellazione di tutte le conversazioni' });
        } finally {
          set({ isDeleting: false });
        }
      },

      renameConversation: async (id, title) => {
        if (!id || !title.trim()) return;
        set({ isLoading: true });
        try {
          const response = await fetch(`/api/copilot/conversations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
          });
          if (response.ok) {
            const data = await response.json();
            const updated = data.conversation || { title };
            get().updateConversation(id, {
              title: updated.title || title,
              updatedAt: updated.updatedAt ? new Date(updated.updatedAt) : new Date(),
            });
          } else {
            set({ lastError: 'Errore nel rinominare la conversazione' });
          }
        } catch (error) {
          logger.error('[ChatStore] Error renaming conversation:', error);
          set({ lastError: 'Errore nel rinominare la conversazione' });
        } finally {
          set({ isLoading: false });
        }
      },

      startNewConversation: () => {
        set({
          currentConversationId: null,
          messages: [],
          input: '',
        });
      },
    })),
    {
      name: 'ChatStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selectors (per ottimizzare re-render)
// ============================================================================

/** Selettore per le conversazioni */
export const selectConversations = (state: ChatStore) => state.conversations;

/** Selettore per la conversazione corrente */
export const selectCurrentConversationId = (state: ChatStore) => state.currentConversationId;

/** Selettore per i messaggi */
export const selectMessages = (state: ChatStore) => state.messages;

/** Selettore per l'input */
export const selectInput = (state: ChatStore) => state.input;

/** Selettore per loading state */
export const selectIsLoading = (state: ChatStore) => state.isLoading;

/** Selettore per deleting state */
export const selectIsDeleting = (state: ChatStore) => state.isDeleting;

/** Selettore per l'ultimo errore */
export const selectLastError = (state: ChatStore) => state.lastError;

/** Selettore per verificare se c'è una conversazione attiva */
export const selectHasActiveConversation = (state: ChatStore) =>
  state.currentConversationId !== null;

/** Selettore per la conversazione corrente (oggetto completo) */
export const selectCurrentConversation = (state: ChatStore) =>
  state.currentConversationId
    ? state.conversations.find((c) => c.id === state.currentConversationId)
    : null;

/** Selettore per verificare se ci sono conversazioni */
export const selectHasConversations = (state: ChatStore) => state.conversations.length > 0;

/** Selettore per il conteggio delle conversazioni */
export const selectConversationsCount = (state: ChatStore) => state.conversations.length;

/** Selettore per il conteggio dei messaggi nella conversazione corrente */
export const selectMessageCount = (state: ChatStore) => state.messages.length;

// ============================================================================
// Debug helper (esposto su window in development)
// ============================================================================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { __ChatStore: typeof useChatStore }).__ChatStore = useChatStore;
}
