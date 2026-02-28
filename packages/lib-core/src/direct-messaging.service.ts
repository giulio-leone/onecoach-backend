/**
 * Direct Messaging Service
 *
 * CRUD operations for direct messaging between coach and athlete
 * Implements SOLID principles (SRP, DIP)
 */

import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';
import type {
  direct_conversations,
  direct_messages,
  message_reads,
  ConversationPriority,
} from '@prisma/client';

/**
 * Interface for Direct Messaging Service
 */
export interface IDirectMessagingService {
  // Conversations
  createConversation(
    coachId: string,
    athleteId: string,
    title?: string
  ): Promise<direct_conversations>;
  getConversation(conversationId: string): Promise<direct_conversations | null>;
  getConversationByParticipants(
    coachId: string,
    athleteId: string
  ): Promise<direct_conversations | null>;
  getConversations(userId: string, role: 'COACH' | 'USER'): Promise<DirectConversationWithUser[]>;
  updateConversationSettings(
    conversationId: string,
    data: { isMuted?: boolean; priority?: ConversationPriority }
  ): Promise<direct_conversations>;
  deleteConversation(conversationId: string): Promise<void>;

  // Messages
  sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    isImportant?: boolean
  ): Promise<direct_messages>;
  getMessages(
    conversationId: string,
    page?: number,
    limit?: number
  ): Promise<DirectMessageWithSender[]>;
  getMessage(messageId: string): Promise<direct_messages | null>;
  markMessageImportant(messageId: string, isImportant: boolean): Promise<direct_messages>;
  reportMessage(messageId: string, reason: string): Promise<direct_messages>;
  deleteMessage(messageId: string): Promise<void>;

  // Message Reads
  markAsRead(messageId: string, userId: string): Promise<message_reads>;
  getUnreadCount(conversationId: string, userId: string): Promise<number>;
  getUnreadCountForUser(userId: string): Promise<number>;
}

/**
 * Extended types with user information
 */
export interface DirectConversationWithUser extends direct_conversations {
  coach: {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
  };
  athlete: {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
  };
  unreadCount?: number;
  lastMessage?: direct_messages | null;
}

export interface DirectMessageWithSender extends direct_messages {
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  isRead?: boolean;
}

/**
 * Implementation Direct Messaging Service
 */
class DirectMessagingService implements IDirectMessagingService {
  /**
   * Create or get existing conversation
   */
  async createConversation(
    coachId: string,
    athleteId: string,
    title?: string
  ): Promise<direct_conversations> {
    // Check if conversation already exists
    const existing = await prisma.direct_conversations.findUnique({
      where: {
        coachId_athleteId: {
          coachId,
          athleteId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create new conversation
    return await prisma.direct_conversations.create({
      data: {
        id: createId(),
        coachId,
        athleteId,
        title: title || null,
        priority: 'MEDIUM',
        isMuted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<direct_conversations | null> {
    return await prisma.direct_conversations.findUnique({
      where: { id: conversationId },
    });
  }

  /**
   * Get conversation by participants
   */
  async getConversationByParticipants(
    coachId: string,
    athleteId: string
  ): Promise<direct_conversations | null> {
    return await prisma.direct_conversations.findUnique({
      where: {
        coachId_athleteId: {
          coachId,
          athleteId,
        },
      },
    });
  }

  /**
   * Get conversations for user (coach or athlete)
   */
  async getConversations(
    userId: string,
    role: 'COACH' | 'USER'
  ): Promise<DirectConversationWithUser[]> {
    const where = role === 'COACH' ? { coachId: userId } : { athleteId: userId };

    const conversations = await prisma.direct_conversations.findMany({
      where,
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        athlete: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });

    // Batch calculate unread counts in a single query
    const conversationIds = conversations.map((c: any) => c.id);
    const unreadCounts = await this.batchGetUnreadCounts(conversationIds, userId);

    // Map unread counts to conversations
    return conversations.map((conv: any) => ({
      ...conv,
      unreadCount: unreadCounts.get(conv.id) ?? 0,
      lastMessage: conv.messages[0] || null,
    })) as DirectConversationWithUser[];
  }

  /**
   * Batch get unread counts for multiple conversations (optimized)
   */
  private async batchGetUnreadCounts(
    conversationIds: string[],
    userId: string
  ): Promise<Map<string, number>> {
    if (conversationIds.length === 0) {
      return new Map();
    }

    // Single optimized query with LEFT JOIN to count unread messages
    const results = await prisma.$queryRaw<Array<{ conversationId: string; unreadCount: bigint }>>`
      SELECT 
        dm."conversationId",
        COUNT(dm.id) as "unreadCount"
      FROM direct_messages dm
      LEFT JOIN message_reads mr ON dm.id = mr."messageId" AND mr."userId" = ${userId}::uuid
      WHERE 
        dm."conversationId" IN (${Prisma.join(conversationIds)})
        AND dm."senderId" != ${userId}::uuid
        AND mr.id IS NULL
      GROUP BY dm."conversationId"
    `;

    const countMap = new Map<string, number>();
    for (const row of results) {
      countMap.set(row.conversationId, Number(row.unreadCount));
    }
    return countMap;
  }

  /**
   * Update conversation settings (mute, priority)
   */
  async updateConversationSettings(
    conversationId: string,
    data: { isMuted?: boolean; priority?: ConversationPriority }
  ): Promise<direct_conversations> {
    return await prisma.direct_conversations.update({
      where: { id: conversationId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await prisma.direct_conversations.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Send message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    isImportant = false
  ): Promise<direct_messages> {
    // Create message and update conversation in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create message
      const message = await tx.direct_messages.create({
        data: {
          id: createId(),
          conversationId,
          senderId,
          content,
          isImportant,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update conversation lastMessageAt
      await tx.direct_conversations.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return message;
    });

    return result;
  }

  /**
   * Get messages with pagination
   */
  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<DirectMessageWithSender[]> {
    const skip = (page - 1) * limit;

    const messages = await prisma.direct_messages.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reads: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Map to include isRead flag
    return messages.map((msg: any) => ({
      ...msg,
      isRead: msg.reads.length > 0,
    })) as DirectMessageWithSender[];
  }

  /**
   * Get single message
   */
  async getMessage(messageId: string): Promise<direct_messages | null> {
    return await prisma.direct_messages.findUnique({
      where: { id: messageId },
    });
  }

  /**
   * Mark message as important
   */
  async markMessageImportant(messageId: string, isImportant: boolean): Promise<direct_messages> {
    return await prisma.direct_messages.update({
      where: { id: messageId },
      data: {
        isImportant,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Report message
   */
  async reportMessage(messageId: string, reason: string): Promise<direct_messages> {
    return await prisma.direct_messages.update({
      where: { id: messageId },
      data: {
        isReported: true,
        reportedReason: reason,
        reportedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await prisma.direct_messages.delete({
      where: { id: messageId },
    });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, userId: string): Promise<message_reads> {
    // Check if already read
    const existing = await prisma.message_reads.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create read record
    return await prisma.message_reads.create({
      data: {
        id: createId(),
        messageId,
        userId,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get unread count for a conversation (optimized with single query)
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    // Single optimized query: count messages not sent by user and not read
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(dm.id) as count
      FROM direct_messages dm
      LEFT JOIN message_reads mr ON dm.id = mr."messageId" AND mr."userId" = ${userId}::uuid
      WHERE 
        dm."conversationId" = ${conversationId}
        AND dm."senderId" != ${userId}::uuid
        AND mr.id IS NULL
    `;

    return Number(result[0]?.count ?? 0);
  }

  /**
   * Get total unread count for user across all conversations (optimized)
   */
  async getUnreadCountForUser(userId: string): Promise<number> {
    // Single optimized query: count all unread messages across all user's conversations
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(dm.id) as count
      FROM direct_messages dm
      INNER JOIN direct_conversations dc ON dm."conversationId" = dc.id
      LEFT JOIN message_reads mr ON dm.id = mr."messageId" AND mr."userId" = ${userId}::uuid
      WHERE 
        (dc."coachId" = ${userId}::uuid OR dc."athleteId" = ${userId}::uuid)
        AND dm."senderId" != ${userId}::uuid
        AND mr.id IS NULL
    `;

    return Number(result[0]?.count ?? 0);
  }
}

/**
 * Export singleton instance
 */
export const directMessagingService = new DirectMessagingService();
