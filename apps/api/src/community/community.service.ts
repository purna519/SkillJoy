import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityRole } from '@skilljoy/database';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: { name: string; description?: string; skillId?: string },
  ) {
    const slug = data.name.toLowerCase().replace(/ /g, '-') + '-' + Date.now();

    return this.prisma.community.create({
      data: {
        ...data,
        slug,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: CommunityRole.OWNER,
          },
        },
      },
    });
  }

  async findAll(creatorUsername?: string, viewerId?: string) {
    const where = creatorUsername
      ? { owner: { username: creatorUsername } }
      : {};

    const communities = await this.prisma.community.findMany({
      where,
      include: {
        skill: true,
        _count: {
          select: { members: true },
        },
        members: viewerId
          ? {
              where: { userId: viewerId },
              select: { userId: true },
            }
          : false,
      },
    });

    return communities.map((c) => {
      const isJoined = viewerId ? (c.members as any[])?.length > 0 : false;
      const isOwner = viewerId ? c.ownerId === viewerId : false;

      const { members, ...rest } = c as any;
      return {
        ...rest,
        isJoined,
        isOwner,
      };
    });
  }

  async update(
    userId: string,
    id: string,
    data: { name?: string; description?: string },
  ) {
    const community = await this.prisma.community.findUnique({ where: { id } });
    if (!community || community.ownerId !== userId) {
      throw new Error('Unauthorized or community not found');
    }
    return this.prisma.community.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    const community = await this.prisma.community.findUnique({ where: { id } });
    if (!community || community.ownerId !== userId) {
      throw new Error('Unauthorized or community not found');
    }
    return this.prisma.community.delete({
      where: { id },
    });
  }

  async join(userId: string, communityId: string) {
    // Check if already a member — prevents unique constraint crash
    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (existing) {
      return existing; // Already joined — return silently
    }
    return this.prisma.communityMember.create({
      data: {
        userId,
        communityId,
        role: CommunityRole.MEMBER,
      },
    });
  }

  async createPost(
    userId: string,
    communityId: string,
    content: string,
    attachments?: string[],
  ) {
    return this.prisma.communityPost.create({
      data: {
        userId,
        communityId,
        content,
        attachments: attachments ? (attachments as any) : undefined,
      },
    });
  }

  async getPosts(communityId: string) {
    return this.prisma.communityPost.findMany({
      where: { communityId },
      include: {
        user: {
          select: {
            username: true,
            userProfile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
