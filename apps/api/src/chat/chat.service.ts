import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // ── Get all conversations for a user ──
  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                userProfile: { select: { avatarUrl: true, displayName: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only latest message for preview
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ── Get messages in a conversation ──
  async getMessages(conversationId: string, userId: string) {
    // Verify user is a member
    const membership = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership) return [];

    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            userProfile: { select: { avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // Last 100 messages
    });
  }

  // ── Start a new direct conversation ──
  async startConversation(userId: string, targetUserId: string) {
    // Check active block status
    const blockCount = await this.prisma.userBlock.count({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: userId },
        ],
      },
    });
    if (blockCount > 0) {
      throw new ForbiddenException('Cannot message this user due to blocks');
    }

    // Check if sender follows the target user
    const followRecord = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });
    if (!followRecord || followRecord.status !== 'ACCEPTED') {
      throw new ForbiddenException(
        'You must follow this user to send them a message',
      );
    }

    // Check if DM already exists
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        members: { every: { userId: { in: [userId, targetUserId] } } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });
    if (existing) return existing;

    // Create new conversation
    return this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                userProfile: { select: { avatarUrl: true } },
              },
            },
          },
        },
      },
    });
  }
}
