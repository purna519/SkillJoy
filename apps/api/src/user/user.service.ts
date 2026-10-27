import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async findByUsername(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isPrivate: true,
        createdAt: true,
        userProfile: {
          select: {
            avatarUrl: true,
            bio: true,
            displayName: true,
          },
        },
        creatorProfile: {
          select: {
            creatorTitle: true,
            totalViews: true,
            subscribersCount: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
    }

    // Check for active blocks mutually
    let isBlockedByViewer = false;
    let isViewerBlockedByTarget = false;

    if (viewerId) {
      const activeBlock = await this.prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: user.id },
            { blockerId: user.id, blockedId: viewerId },
          ],
        },
      });
      if (activeBlock) {
        isBlockedByViewer = activeBlock.blockerId === viewerId;
        isViewerBlockedByTarget = activeBlock.blockerId === user.id;
      }
    }

    if (isBlockedByViewer || isViewerBlockedByTarget) {
      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isBlocked: true,
        isBlockedByViewer,
        isViewerBlockedByTarget,
        userProfile: user.userProfile
          ? {
              avatarUrl: user.userProfile.avatarUrl,
              displayName: user.userProfile.displayName,
            }
          : null,
        followersCount: 0,
        followingCount: 0,
        isRestricted: true,
        videos: [],
      };
    }

    // Check if viewer can see full profile
    const isOwner = viewerId === user.id;
    let canSeeFull = !user.isPrivate || isOwner;

    if (user.isPrivate && !isOwner && viewerId) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
      });
      if (follow?.status === 'ACCEPTED') canSeeFull = true;
    }

    const followersCount = await this.prisma.follow.count({
      where: { followingId: user.id, status: 'ACCEPTED' },
    });
    const followingCount = await this.prisma.follow.count({
      where: { followerId: user.id, status: 'ACCEPTED' },
    });

    if (!canSeeFull) {
      return {
        ...user,
        followersCount,
        followingCount,
        isRestricted: true,
        // Hide specific data
        creatorProfile: { creatorTitle: user.creatorProfile?.creatorTitle },
        videos: [],
      };
    }

    return { ...user, followersCount, followingCount, isRestricted: false };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProfile: true,
        creatorProfile: true,
        settings: true,
      },
    });
  }

  async searchUsers(query: string, excludeUserId: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
        ],
        id: { not: excludeUserId },
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        userProfile: {
          select: { avatarUrl: true, displayName: true },
        },
        followers: {
          where: { followerId: excludeUserId },
          select: { status: true },
        },
      },
      take: 20,
    });
  }

  async followUser(followerId: string, followingId: string) {
    const followingUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });
    if (!followingUser) throw new NotFoundException('User not found');

    // Auto-accept if profile is public
    const status = followingUser.isPrivate ? 'PENDING' : 'ACCEPTED';

    return this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: { status },
      create: { followerId, followingId, status },
    });
  }

  async unfollowUser(followerId: string, followingId: string) {
    return this.prisma.follow.deleteMany({
      where: { followerId, followingId },
    });
  }

  async acceptFollow(userId: string, followerId: string) {
    return this.prisma.follow.update({
      where: { followerId_followingId: { followerId, followingId: userId } },
      data: { status: 'ACCEPTED' },
    });
  }

  async rejectFollow(userId: string, followerId: string) {
    return this.prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId: userId } },
    });
  }

  async getFollowingStatus(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return follow || { status: 'NONE' };
  }

  async getFollowRequests(userId: string) {
    return this.prisma.follow.findMany({
      where: { followingId: userId, status: 'PENDING' },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            userProfile: { select: { avatarUrl: true, displayName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async togglePrivacy(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isPrivate: !user.isPrivate },
      select: { id: true, isPrivate: true },
    });
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; bio?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { ...(data.fullName && { fullName: data.fullName }) },
    });

    return this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.fullName && { displayName: data.fullName }),
      },
      create: {
        userId,
        bio: data.bio,
        displayName: data.fullName || user.username,
      },
    });
  }

  async uploadProfileImage(
    userId: string,
    buffer: Buffer,
    type: 'avatar' | 'banner',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `skilljoy/users/${userId}`,
          public_id: `${type}_${Date.now()}`,
          resource_type: 'image',
          access_mode: 'public',
          type: 'upload',
        },
        async (error, result) => {
          if (error) {
            reject(new BadRequestException(error.message));
          } else {
            const url = result!.secure_url;
            await this.prisma.userProfile.upsert({
              where: { userId },
              update: { [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: url },
              create: {
                userId,
                [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: url,
              },
            });
            resolve(url);
          }
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async getFollowers(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const follows = await this.prisma.follow.findMany({
      where: { followingId: user.id, status: 'ACCEPTED' },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            userProfile: { select: { avatarUrl: true, displayName: true } },
          },
        },
      },
    });
    return follows.map((f) => f.follower);
  }

  async getFollowing(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const follows = await this.prisma.follow.findMany({
      where: { followerId: user.id, status: 'ACCEPTED' },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            userProfile: { select: { avatarUrl: true, displayName: true } },
          },
        },
      },
    });
    return follows.map((f) => f.following);
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });
    if (!targetUser) throw new NotFoundException('User to block not found');

    // Remove any mutual follow relationships or follow requests
    await this.prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    });

    // Create the block connection
    return this.prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (!block) throw new BadRequestException('User is not blocked');

    return this.prisma.userBlock.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
  }

  async getBlockedUsers(blockerId: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            userProfile: {
              select: { avatarUrl: true, displayName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map((b) => b.blocked);
  }

  // ── Create a Learning Take ──
  async createLearningTake(
    userId: string,
    videoId: string | null,
    content: string,
  ) {
    if (content.length > 280)
      throw new BadRequestException('Content exceeds 280 characters');

    const take = await this.prisma.learningTake.create({
      data: {
        userId,
        videoId: videoId || null,
        content,
      },
      include: {
        video: {
          select: { title: true, creatorId: true },
        },
      },
    });

    // Reward the user with XP
    await this.addXp(userId, 20);

    return take;
  }

  // ── Get all Learning Takes for a user ──
  async getLearningTakes(userId: string) {
    return this.prisma.learningTake.findMany({
      where: { userId },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            creator: {
              select: { username: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Get Skill Radar chart data dynamically ──
  async getSkillProgress(userId: string) {
    const history = await this.prisma.watchHistory.findMany({
      where: { userId },
      include: {
        video: {
          select: { category: true },
        },
      },
    });

    // Count watched videos by category
    const categories: Record<string, number> = {
      'AI & ML': 0,
      Coding: 0,
      'UI/UX Design': 0,
      Marketing: 0,
      Product: 0,
      'Soft Skills': 0,
    };

    history.forEach((h) => {
      const cat = h.video?.category || 'Coding';
      if (categories[cat] !== undefined) {
        categories[cat] += 1;
      } else {
        categories['Coding'] += 1;
      }
    });

    // Format as array of key-value pairs
    return Object.keys(categories).map((subject) => ({
      subject,
      A: Math.min(100, categories[subject] * 20 + 15), // Base 15 to make graph look nice, max 100
      fullMark: 100,
    }));
  }

  // ── Get Daily Quests ──
  async getDailyQuests(userId: string) {
    // Check how many takes user created today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const takesToday = await this.prisma.learningTake.count({
      where: { userId, createdAt: { gte: startOfToday } },
    });

    const watchesToday = await this.prisma.watchHistory.count({
      where: { userId, watchedAt: { gte: startOfToday } },
    });

    return [
      {
        id: 'q1',
        title: 'Deep Thinker',
        description: 'Watch 3 learning reels today',
        progress: watchesToday,
        target: 3,
        xpReward: 15,
        completed: watchesToday >= 3,
      },
      {
        id: 'q2',
        title: 'Sharer',
        description: 'Publish 1 Learning Take summarizing a reel',
        progress: takesToday,
        target: 1,
        xpReward: 20,
        completed: takesToday >= 1,
      },
      {
        id: 'q3',
        title: 'Streak Saver',
        description:
          'Keep your active streak running by watching at least 1 video',
        progress: watchesToday >= 1 ? 1 : 0,
        target: 1,
        xpReward: 10,
        completed: watchesToday >= 1,
      },
    ];
  }

  // ── Helper to add XP and handle Level Up ──
  private async addXp(userId: string, amount: number) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!profile) return;

    let newXp = profile.xpPoints + amount;
    let newLevel = profile.level;

    // Duolingo/RPG formula: level up every (level * 120) XP points
    const xpNeeded = newLevel * 120;
    if (newXp >= xpNeeded) {
      newXp = newXp - xpNeeded;
      newLevel += 1;
    }

    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        xpPoints: newXp,
        level: newLevel,
        streakCount: { increment: 1 },
      },
    });
  }
}
