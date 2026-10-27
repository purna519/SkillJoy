import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async trackWatchTime(videoId: string, userId: string, duration: number) {
    // Update total watch time in DB
    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        watchTime: {
          increment: duration,
        },
        viewsCount: {
          increment: 1,
        },
      },
    });

    // Cache trending data in Redis
    await this.redis.zincrby('trending_videos', 1, videoId);
  }

  async getTrending() {
    const trendingIds = await this.redis.zrevrange('trending_videos', 0, 9);
    return this.prisma.video.findMany({
      where: {
        id: { in: trendingIds },
      },
      include: {
        creator: true,
      },
    });
  }
}
