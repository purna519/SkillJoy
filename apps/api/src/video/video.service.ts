import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

export type ResourceKind = 'reel' | 'pdf' | 'image' | 'thumbnail';

@Injectable()
export class VideoService {
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

  /**
   * getPdfDeliveryUrl — returns a clean, fetchable URL for a stored PDF.
   *
   * PDFs are uploaded as `resource_type: 'raw'` and `type: 'upload'` (public).
   * Cloudinary public raw assets are directly accessible via their secure_url
   * with NO signing needed. We just ensure we use the exact secure_url that
   * Cloudinary returned at upload time.
   *
   * For `authenticated` type assets we generate a signed URL.
   */
  getPdfDeliveryUrl(storedUrl: string): string {
    if (!storedUrl) return '';
    if (!storedUrl.includes('cloudinary.com')) return storedUrl;

    // If it's an authenticated (private) asset — generate a signed URL
    if (storedUrl.includes('/authenticated/')) {
      return this.getSignedAuthenticatedUrl(storedUrl);
    }

    // For public raw uploads — the stored secure_url IS the correct URL.
    // Just ensure it uses https.
    return storedUrl.replace('http://', 'https://');
  }

  /**
   * getSignedAuthenticatedUrl — only for authenticated (private) Cloudinary assets.
   */
  private getSignedAuthenticatedUrl(url: string): string {
    try {
      const parts = url.split('/authenticated/');
      if (parts.length < 2) return url;

      let segments = parts[1].split('/');

      // Remove existing signature if present (s--...--)
      if (segments[0].startsWith('s--')) segments = segments.slice(1);

      // Extract version
      let version: string | undefined;
      if (segments[0].match(/^v\d+$/)) {
        version = segments[0].substring(1);
        segments = segments.slice(1);
      }

      const fullPath = decodeURIComponent(segments.join('/'));
      const isRaw = url.includes('/raw/');
      const publicId = isRaw ? fullPath : fullPath.replace(/\.[^/.]+$/, '');

      return cloudinary.url(publicId, {
        resource_type: isRaw ? 'raw' : 'image',
        type: 'authenticated',
        sign_url: true,
        secure: true,
        ...(version ? { version } : {}),
        ...(isRaw ? {} : { format: 'pdf' }),
      });
    } catch (err) {
      console.error(
        '[VideoService] Failed to sign authenticated URL:',
        err.message,
      );
      return url;
    }
  }

  /**
   * Legacy getSignedUrl kept for backward compatibility (used nowhere now).
   */
  getSignedUrl(url: string): string {
    return this.getPdfDeliveryUrl(url);
  }

  // ── Upload any file to Cloudinary ──
  async uploadToCloud(
    buffer: Buffer,
    originalName: string,
    kind: ResourceKind,
  ): Promise<UploadApiResponse> {
    const folder = kind === 'pdf' ? `skilljoy/documents` : `skilljoy/${kind}s`;
    // 'raw' preserves PDFs exactly; 'image'/'video' for media
    const resourceType =
      kind === 'pdf'
        ? 'raw'
        : kind === 'image' || kind === 'thumbnail'
          ? 'image'
          : 'video';

    // Give PDFs a unique, clean filename that includes the extension
    const cleanName = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId =
      kind === 'pdf' ? `${cleanName}_${Date.now()}.pdf` : undefined;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: publicId,
          use_filename: kind !== 'pdf',
          unique_filename: true,
          // Public access — no signing needed for delivery
          access_mode: 'public',
          type: 'upload',
          // Auto quality + format for videos
          ...(resourceType === 'video' && {
            eager: [{ quality: 'auto', format: 'mp4' }],
            eager_async: true,
          }),
          // Auto thumbnail for reels
          ...(kind === 'reel' && {
            eager: [{ width: 400, height: 700, crop: 'fill', format: 'jpg' }],
          }),
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary Upload Error:', error);
            reject(new BadRequestException(error.message));
          } else {
            console.log('✅ Cloudinary Upload Success:', result?.secure_url);
            resolve(result!);
          }
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  // ── Create video record in DB after upload ──
  async createVideo(
    creatorId: string,
    data: {
      title: string;
      description?: string;
      skillId?: string;
      subskillId?: string;
      category?: string;
      subcategory?: string;
      videoUrl: string;
      thumbnailUrl?: string;
      cloudinaryPublicId?: string;
      durationSeconds?: number;
      pdfUrl?: string;
      visibility?: string;
      certificationUrl?: string;
    },
  ) {
    let skillId = data.skillId;
    let subskillId = data.subskillId;

    if (!skillId && data.category) {
      const skillName = data.category;
      const skillSlug = skillName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let skill = await this.prisma.skill.findFirst({
        where: { OR: [{ slug: skillSlug }, { name: skillName }] },
      });

      if (!skill) {
        skill = await this.prisma.skill.create({
          data: { name: skillName, slug: skillSlug },
        });
      }
      skillId = skill.id;
    }

    if (!subskillId && data.subcategory && skillId) {
      const subName = data.subcategory;
      const subSlug = subName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let subskill = await this.prisma.subskill.findFirst({
        where: { OR: [{ slug: subSlug }, { name: subName }] },
      });

      if (!subskill) {
        subskill = await this.prisma.subskill.create({
          data: { name: subName, slug: subSlug, skillId },
        });
      }
      subskillId = subskill.id;
    }

    try {
      const video = await this.prisma.video.create({
        data: {
          creatorId,
          title: data.title,
          description: data.description,
          skillId: skillId ?? null,
          subskillId: subskillId ?? null,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl ?? null,
          cloudinaryPublicId: data.cloudinaryPublicId ?? null,
          pdfUrl: data.pdfUrl ?? null,
          durationSeconds: data.durationSeconds ?? 0,
          processingStatus: 'COMPLETED',
          visibility: (data.visibility as any) ?? 'PUBLIC',
          certificationUrl: data.certificationUrl ?? null,
          category: data.category ?? 'General',
          subCategory: data.subcategory ?? 'General',
        },
      });
      console.log('✅ Video Created in DB:', video.id);
      return video;
    } catch (err) {
      console.error('❌ Prisma Video Create Error:', err);
      throw err;
    }
  }

  // ── Get feed (latest reels) ──
  async getFeed(page = 1, limit = 20, viewerId?: string) {
    const skip = (page - 1) * limit;
    const videos = await this.prisma.video.findMany({
      where: { visibility: 'PUBLIC', processingStatus: 'COMPLETED' },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            userProfile: { select: { avatarUrl: true, displayName: true } },
          },
        },
        skill: { select: { name: true, slug: true } },
        _count: {
          select: { likes: true, comments: true, saves: true, shares: true },
        },
        likes: viewerId ? { where: { userId: viewerId }, take: 1 } : false,
        saves: viewerId ? { where: { userId: viewerId }, take: 1 } : false,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return videos.map((v) => ({
      ...v,
      isLiked: (v.likes as any[])?.length > 0,
      isSaved: (v.saves as any[])?.length > 0,
      likes: undefined, // Clean up response
      saves: undefined,
    }));
  }

  // ── Get raw video record WITHOUT any side effects (for PDF proxy) ──
  async getVideoRaw(id: string) {
    return this.prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        pdfUrl: true,
        title: true,
        videoUrl: true,
      },
    });
  }

  // ── Get single video WITH side effects (view tracking) ──
  async getVideo(id: string, viewerId?: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            userProfile: { select: { avatarUrl: true, displayName: true } },
            creatorProfile: { select: { creatorTitle: true } },
          },
        },
        skill: true,
        comments: {
          include: {
            user: {
              select: {
                username: true,
                userProfile: { select: { avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { likes: true, comments: true, saves: true, shares: true },
        },
        likes: viewerId ? { where: { userId: viewerId }, take: 1 } : false,
        saves: viewerId ? { where: { userId: viewerId }, take: 1 } : false,
      },
    });

    if (!video) return null;

    // Track view in watch history
    if (viewerId) {
      await this.prisma.watchHistory.upsert({
        where: { userId_videoId: { userId: viewerId, videoId: id } },
        update: { watchedAt: new Date() },
        create: { userId: viewerId, videoId: id },
      });
      // Increment view count
      await this.prisma.video.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      });
    }

    return {
      ...video,
      isLiked: viewerId ? (video.likes as any[])?.length > 0 : false,
      isSaved: viewerId ? (video.saves as any[])?.length > 0 : false,
      likes: undefined,
      saves: undefined,
    };
  }

  // ── Like / Unlike ──
  async toggleLike(userId: string, videoId: string) {
    const existing = await this.prisma.videoLike.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      await this.prisma.videoLike.delete({
        where: { userId_videoId: { userId, videoId } },
      });
      return { liked: false };
    } else {
      await this.prisma.videoLike.create({ data: { userId, videoId } });
      return { liked: true };
    }
  }

  // ── Save / Unsave ──
  async toggleSave(userId: string, videoId: string) {
    const existing = await this.prisma.videoSave.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      await this.prisma.videoSave.delete({
        where: { userId_videoId: { userId, videoId } },
      });
      return { saved: false };
    } else {
      await this.prisma.videoSave.create({ data: { userId, videoId } });
      return { saved: true };
    }
  }

  // ── Add comment ──
  async addComment(
    userId: string,
    videoId: string,
    content: string,
    parentCommentId?: string,
  ) {
    return this.prisma.videoComment.create({
      data: {
        userId,
        videoId,
        content,
        parentCommentId: parentCommentId ?? null,
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
  }

  // ── Get creator's videos ──
  async getCreatorVideos(creatorId: string) {
    return this.prisma.video.findMany({
      where: { creatorId },
      include: {
        skill: { select: { name: true } },
        _count: { select: { likes: true, comments: true, saves: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getComments(videoId: string) {
    return this.prisma.videoComment.findMany({
      where: { videoId },
      include: {
        user: {
          select: {
            username: true,
            userProfile: { select: { avatarUrl: true, displayName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Update video details ──
  async updateVideo(
    videoId: string,
    creatorId: string,
    data: {
      title?: string;
      description?: string;
      visibility?: string;
      certificationUrl?: string;
    },
  ) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video || video.creatorId !== creatorId) {
      throw new BadRequestException('Video not found or access denied');
    }

    return this.prisma.video.update({
      where: { id: videoId },
      data: {
        ...data,
        visibility: (data.visibility as any) || video.visibility,
      },
    });
  }

  // ── Delete video ──
  async deleteVideo(videoId: string, creatorId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video || video.creatorId !== creatorId) {
      throw new BadRequestException('Video not found or access denied');
    }

    return this.prisma.video.delete({ where: { id: videoId } });
  }

  // ── Watch Later ──
  async toggleWatchLater(userId: string, videoId: string) {
    const existing = await this.prisma.watchLater.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      await this.prisma.watchLater.delete({
        where: { userId_videoId: { userId, videoId } },
      });
      return { saved: false };
    }

    await this.prisma.watchLater.create({ data: { userId, videoId } });
    return { saved: true };
  }

  async getWatchLater(userId: string) {
    return this.prisma.watchLater.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            creator: {
              select: {
                username: true,
                userProfile: { select: { avatarUrl: true, displayName: true } },
              },
            },
            skill: { select: { name: true } },
            _count: { select: { likes: true, comments: true, saves: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWatchHistory(userId: string) {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            creator: {
              select: {
                username: true,
                userProfile: { select: { avatarUrl: true, displayName: true } },
              },
            },
            skill: { select: { name: true } },
          },
        },
      },
      orderBy: { watchedAt: 'desc' },
      take: 20,
    });
  }
}
