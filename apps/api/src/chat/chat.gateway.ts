import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

// ══════════════════════════════════════════════════════
// Production Socket.IO Gateway — WhatsApp-quality chat
// All 4 expert rules implemented:
//  1. Speed      — messages emitted instantly
//  2. Safety     — saved to DB before emitting
//  3. Acks       — client gets confirmation or retry signal
//  4. Auth       — JWT verified on every connection
// ══════════════════════════════════════════════════════

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId → socketId map (for online status)
  private onlineUsers = new Map<string, string>();

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
    private configService: ConfigService,
  ) {}

  // ── RULE 4: Auth — JWT "ID card" check on connection ──
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.emit('error', { message: 'Authentication required.' });
        client.disconnect();
        return;
      }

      const payload = await this.jwt.verifyAsync(token, {
        secret:
          this.configService.get('JWT_SECRET') ??
          'dev_secret_change_in_production',
      });

      // Attach user info to socket for later use
      (client as any).userId = payload.sub;
      (client as any).username = payload.username;

      // Track as online
      this.onlineUsers.set(payload.sub, client.id);
      await this.redis.set(`online:${payload.sub}`, '1', 'EX', 86400);

      // Auto-join the user's personal room (for DMs & notifications)
      client.join(`user:${payload.sub}`);

      // Notify others this user is online
      this.server.emit('userOnline', { userId: payload.sub });

      console.log(`✅ Socket connected: ${payload.username} (${client.id})`);
    } catch {
      client.emit('error', { message: 'Invalid token. Connection refused.' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.onlineUsers.delete(userId);
      await this.redis.del(`online:${userId}`);
      this.server.emit('userOffline', { userId });
      console.log(`❌ Socket disconnected: ${(client as any).username}`);
    }
  }

  // ── Join a conversation room ──
  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conv:${data.conversationId}`);
    client.emit('joinedConversation', { conversationId: data.conversationId });
  }

  // ── Leave a conversation room ──
  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conv:${data.conversationId}`);
  }

  // ── RULE 2 + 3: Send Message — Save to DB first, then emit ──
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
      type?: string;
      tempId?: string; // Client-side temp ID for ack matching
    },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = (client as any).userId;
    if (!senderId) {
      client.emit('messageFailed', {
        tempId: data.tempId,
        reason: 'Not authenticated',
      });
      return;
    }

    try {
      // Get conversation members and check block status
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: { members: true },
      });
      if (!conversation) {
        client.emit('messageFailed', {
          tempId: data.tempId,
          reason: 'Conversation not found',
        });
        return;
      }

      if (conversation.type === 'DIRECT') {
        const otherMember = conversation.members.find(
          (m) => m.userId !== senderId,
        );
        if (otherMember) {
          const blockCount = await this.prisma.userBlock.count({
            where: {
              OR: [
                { blockerId: senderId, blockedId: otherMember.userId },
                { blockerId: otherMember.userId, blockedId: senderId },
              ],
            },
          });
          if (blockCount > 0) {
            client.emit('messageFailed', {
              tempId: data.tempId,
              reason: 'Action denied due to active blocks.',
            });
            return;
          }

          // Check if sender follows the target user
          const followRecord = await this.prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: senderId,
                followingId: otherMember.userId,
              },
            },
          });
          if (!followRecord || followRecord.status !== 'ACCEPTED') {
            client.emit('messageFailed', {
              tempId: data.tempId,
              reason: 'You must follow this user to message them.',
            });
            return;
          }
        }
      }

      // RULE 2: Save to DB FIRST — message is never lost
      const message = await this.prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId,
          content: data.content,
          messageType: (data.type as any) ?? 'TEXT', // Schema field is messageType
        },
        include: {
          sender: {
            select: {
              username: true,
              userProfile: { select: { avatarUrl: true } },
            },
          },
        },
      });

      // RULE 1: Speed — emit immediately to ALL in the room
      this.server.to(`conv:${data.conversationId}`).emit('newMessage', {
        ...message,
        tempId: data.tempId, // So client can replace optimistic UI
      });

      // RULE 3: Acknowledgment — tell sender "Got it!"
      client.emit('messageAck', {
        tempId: data.tempId,
        messageId: message.id,
        status: 'delivered',
      });
    } catch (error) {
      // RULE 3: Failure signal — client should show ❗ and retry
      client.emit('messageFailed', {
        tempId: data.tempId,
        reason: 'Server error — please retry',
      });
    }
  }

  // ── Typing indicator ──
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { conversationId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const username = (client as any).username;
    client.to(`conv:${data.conversationId}`).emit('userTyping', {
      username,
      isTyping: data.isTyping,
    });
  }

  // ── Read receipts ──
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @MessageBody() data: { conversationId: string; messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).userId;
    // Emit read receipt to the conversation
    client.to(`conv:${data.conversationId}`).emit('messageRead', {
      messageId: data.messageId,
      readBy: userId,
    });
  }

  // ── Join community room ──
  @SubscribeMessage('joinCommunity')
  handleJoinCommunity(
    @MessageBody() data: { communityId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`community:${data.communityId}`);
    client.emit('joinedCommunity', { communityId: data.communityId });
  }

  // ── Community message ──
  @SubscribeMessage('communityMessage')
  async handleCommunityMessage(
    @MessageBody()
    data: { communityId: string; content: string; tempId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    try {
      const post = await this.prisma.communityPost.create({
        data: {
          communityId: data.communityId,
          userId,
          content: data.content,
        },
        include: {
          user: {
            select: {
              username: true,
              userProfile: { select: { avatarUrl: true } },
            },
          },
        },
      });

      this.server
        .to(`community:${data.communityId}`)
        .emit('newCommunityMessage', post);
      client.emit('communityMessageAck', {
        tempId: data.tempId,
        postId: post.id,
      });
    } catch {
      client.emit('communityMessageFailed', { tempId: data.tempId });
    }
  }

  // ── Notification push (from other services) ──
  sendNotification(userId: string, notification: object) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // ── Get online status ──
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}
