/**
 * Direct Messaging Query Keys and Functions
 *
 * Standardized query keys and query functions for direct messaging queries
 */

import type { direct_conversations, direct_messages, ConversationPriority } from '@prisma/client';
import type { DirectConversationWithUser, DirectMessageWithSender } from '@giulio-leone/lib-core';

// ============================================================================
// Query Keys
// ============================================================================

export const directMessagingKeys = {
  all: ['direct-messaging'] as const,
  conversations: (userId: string, role: 'COACH' | 'USER') =>
    [...directMessagingKeys.all, 'conversations', userId, role] as const,
  conversation: (id: string) => [...directMessagingKeys.all, 'conversation', id] as const,
  messages: (conversationId: string, page?: number, limit?: number) =>
    [...directMessagingKeys.all, 'messages', conversationId, page, limit] as const,
  unreadCount: (userId: string) => [...directMessagingKeys.all, 'unread-count', userId] as const,
} as const;

// ============================================================================
// Types
// ============================================================================

export interface DirectConversationsResponse {
  conversations: DirectConversationWithUser[];
}

export interface DirectMessagesResponse {
  messages: DirectMessageWithSender[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

// ============================================================================
// Query Functions
// ============================================================================

export const directMessagingQueries = {
  /**
   * Get user's conversations
   */
  getConversations: async (
    _userId: string,
    _role: 'COACH' | 'USER'
  ): Promise<DirectConversationsResponse> => {
    const response = await fetch(`/api/direct-messaging/conversations`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch conversations');
    }

    return response.json();
  },

  /**
   * Get conversation details
   */
  getConversation: async (id: string): Promise<DirectConversationWithUser> => {
    const response = await fetch(`/api/direct-messaging/conversations/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch conversation');
    }

    return response.json();
  },

  /**
   * Get messages for a conversation
   */
  getMessages: async (
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<DirectMessagesResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(
      `/api/direct-messaging/conversations/${conversationId}/messages?${params.toString()}`,
      {
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch messages');
    }

    return response.json();
  },

  /**
   * Get unread count for user
   */
  getUnreadCount: async (_userId: string): Promise<UnreadCountResponse> => {
    // This would need a dedicated endpoint, for now return 0
    // TODO: Create /api/direct-messaging/unread-count endpoint
    return { count: 0 };
  },
};

// ============================================================================
// Mutation Functions
// ============================================================================

export const directMessagingMutations = {
  /**
   * Create new conversation
   */
  createConversation: async (data: {
    athleteId: string;
    title?: string;
  }): Promise<direct_conversations> => {
    const response = await fetch(`/api/direct-messaging/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create conversation');
    }

    return response.json();
  },

  /**
   * Update conversation settings
   */
  updateConversationSettings: async (
    conversationId: string,
    data: { isMuted?: boolean; priority?: ConversationPriority }
  ): Promise<direct_conversations> => {
    const response = await fetch(`/api/direct-messaging/conversations/${conversationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update conversation');
    }

    return response.json();
  },

  /**
   * Delete conversation
   */
  deleteConversation: async (conversationId: string): Promise<void> => {
    const response = await fetch(`/api/direct-messaging/conversations/${conversationId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete conversation');
    }
  },

  /**
   * Send message
   */
  sendMessage: async (
    conversationId: string,
    data: { content: string; isImportant?: boolean }
  ): Promise<direct_messages> => {
    const response = await fetch(`/api/direct-messaging/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  },

  /**
   * Mark message as important
   */
  markMessageImportant: async (
    messageId: string,
    isImportant: boolean
  ): Promise<direct_messages> => {
    const response = await fetch(`/api/direct-messaging/messages/${messageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isImportant }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update message');
    }

    return response.json();
  },

  /**
   * Report message
   */
  reportMessage: async (messageId: string, reason: string): Promise<direct_messages> => {
    const response = await fetch(`/api/direct-messaging/messages/${messageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ report: true, reason }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to report message');
    }

    return response.json();
  },

  /**
   * Delete message
   */
  deleteMessage: async (messageId: string): Promise<void> => {
    const response = await fetch(`/api/direct-messaging/messages/${messageId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete message');
    }
  },

  /**
   * Mark message as read
   */
  markAsRead: async (messageId: string): Promise<void> => {
    const response = await fetch(`/api/direct-messaging/messages/${messageId}/read`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to mark message as read');
    }
  },
};
