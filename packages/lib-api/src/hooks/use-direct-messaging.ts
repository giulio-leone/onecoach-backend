/**
 * Direct Messaging React Query Hooks
 *
 * Custom hooks for direct messaging queries and mutations
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  directMessagingKeys,
  directMessagingQueries,
  directMessagingMutations,
} from '../queries/direct-messaging.queries';
import type {
  DirectConversationsResponse,
  DirectMessagesResponse,
} from '../queries/direct-messaging.queries';
import type { ConversationPriority } from '@prisma/client';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to get user's conversations
 *
 * @param userId - User ID
 * @param role - User role ('COACH' or 'USER')
 * @returns Query result with conversations
 */
export function useDirectConversations(userId: string | null, role: 'COACH' | 'USER' | null) {
  return useQuery<DirectConversationsResponse>({
    queryKey: directMessagingKeys.conversations(userId || '', role || 'USER'),
    queryFn: () => directMessagingQueries.getConversations(userId!, role!),
    enabled: !!userId && !!role,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get conversation details
 *
 * @param conversationId - Conversation ID
 * @returns Query result with conversation
 */
export function useDirectConversation(conversationId: string | null) {
  return useQuery({
    queryKey: directMessagingKeys.conversation(conversationId || ''),
    queryFn: () => directMessagingQueries.getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get messages for a conversation
 *
 * @param conversationId - Conversation ID
 * @param page - Page number (default: 1)
 * @param limit - Messages per page (default: 50)
 * @returns Query result with messages
 */
export function useDirectMessages(conversationId: string | null, page = 1, limit = 50) {
  return useQuery<DirectMessagesResponse>({
    queryKey: directMessagingKeys.messages(conversationId || '', page, limit),
    queryFn: () => directMessagingQueries.getMessages(conversationId!, page, limit),
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to create a new conversation
 *
 * @returns Mutation function
 */
export function useCreateDirectConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: directMessagingMutations.createConversation,
    onSuccess: () => {
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: directMessagingKeys.all,
      });
    },
  });
}

/**
 * Hook to update conversation settings
 *
 * @returns Mutation function
 */
export function useUpdateConversationSettings() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    { conversationId: string; data: { isMuted?: boolean; priority?: ConversationPriority } }
  >({
    mutationFn: ({ conversationId, data }) =>
      directMessagingMutations.updateConversationSettings(conversationId, data),
    onSuccess: (_, variables) => {
      // Invalidate conversation and list
      queryClient.invalidateQueries({
        queryKey: directMessagingKeys.conversation(variables.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: directMessagingKeys.all,
      });
    },
  });
}

/**
 * Hook to delete a conversation
 *
 * @returns Mutation function
 */
export function useDeleteDirectConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: directMessagingMutations.deleteConversation,
    onSuccess: () => {
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: directMessagingKeys.all,
      });
    },
  });
}

/**
 * Hook to send a message
 *
 * @returns Mutation function
 */
export function useSendDirectMessage() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    { conversationId: string; content: string; isImportant?: boolean }
  >({
    mutationFn: ({ conversationId, content, isImportant }) =>
      directMessagingMutations.sendMessage(conversationId, { content, isImportant }),
    onSuccess: (_, variables) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: directMessagingKeys.messages(variables.conversationId),
      });
      // Invalidate conversations list to update lastMessageAt
      queryClient.invalidateQueries({
        queryKey: directMessagingKeys.all,
      });
    },
  });
}

/**
 * Hook to mark message as important
 *
 * @returns Mutation function
 */
export function useMarkMessageImportant() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    { messageId: string; conversationId: string; isImportant: boolean }
  >({
    mutationFn: ({ messageId, isImportant }) =>
      directMessagingMutations.markMessageImportant(messageId, isImportant),
    onSuccess: (_, variables) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: directMessagingKeys.messages(variables.conversationId),
      });
    },
  });
}

/**
 * Hook to report a message
 *
 * @returns Mutation function
 */
export function useReportMessage() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { messageId: string; conversationId: string; reason: string }>(
    {
      mutationFn: ({ messageId, reason }) =>
        directMessagingMutations.reportMessage(messageId, reason),
      onSuccess: (_, variables) => {
        // Invalidate messages for this conversation
        queryClient.invalidateQueries({
          queryKey: directMessagingKeys.messages(variables.conversationId),
        });
      },
    }
  );
}

/**
 * Hook to delete a message
 *
 * @returns Mutation function
 */
export function useDeleteDirectMessage() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { messageId: string; conversationId: string }>({
    mutationFn: ({ messageId }) => directMessagingMutations.deleteMessage(messageId),
    onSuccess: (_, variables) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: directMessagingKeys.messages(variables.conversationId),
      });
    },
  });
}

/**
 * Hook to mark message as read
 *
 * @returns Mutation function
 */
export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { messageId: string; conversationId: string }>({
    mutationFn: ({ messageId }) => directMessagingMutations.markAsRead(messageId),
    onSuccess: (_, variables) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: directMessagingKeys.messages(variables.conversationId),
      });
      // Invalidate conversations list to update unread count
      queryClient.invalidateQueries({
        queryKey: directMessagingKeys.all,
      });
    },
  });
}
