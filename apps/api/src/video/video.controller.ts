import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import * as express from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@skilljoy/database';
import type { Request } from 'express';

@Controller('videos')
export class VideoController {
  constructor(private videoService: VideoService) {}

  // ── GET /api/videos — Feed ──
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getFeed(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.videoService.getFeed(Number(page), Number(limit), req.user?.id);
  }

  // ── GET /api/videos/creator/:creatorId — MUST be before :id ──
  @Get('creator/:creatorId')
  getCreatorVideos(@Param('creatorId') creatorId: string) {
    return this.videoService.getCreatorVideos(creatorId);
  }

  // ── GET /api/videos/watch-later — MUST be before :id ──
  @Get('watch-later')
  @UseGuards(JwtAuthGuard)
  getWatchLater(@Req() req: Request & { user: { id: string } }) {
    return this.videoService.getWatchLater(req.user.id);
  }

  // ── GET /api/videos/watch-history — MUST be before :id ──
  @Get('watch-history')
  @UseGuards(JwtAuthGuard)
  getWatchHistory(@Req() req: Request & { user: { id: string } }) {
    return this.videoService.getWatchHistory(req.user.id);
  }

  // ── GET /api/videos/:id/pdf-proxy — MUST be before generic :id route ──
  @Get(':id/pdf-proxy')
  async getPdfProxy(@Param('id') id: string, @Res() res: express.Response) {
    // getVideoRaw does NOT track views or update watch history
    const video = await this.videoService.getVideoRaw(id);
    if (!video || !video.pdfUrl) {
      return res.status(404).json({ message: 'PDF not found for this reel' });
    }

    // Get a clean, usable URL for the PDF
    const targetUrl = this.videoService.getPdfDeliveryUrl(video.pdfUrl);
    console.log(`[PDF Proxy] Fetching: ${targetUrl}`);

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 SkillJoy-Server/1.0',
          Accept: 'application/pdf,*/*;q=0.8',
        },
        // Follow redirects (Cloudinary may redirect)
        redirect: 'follow',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[PDF Proxy] Upstream error (${response.status}):`,
          errorText.substring(0, 300),
        );
        return res
          .status(502)
          .json({
            message: `Failed to fetch PDF from storage: ${response.status}`,
          });
      }

      const buffer = await response.arrayBuffer();
      console.log(`[PDF Proxy] Success. Bytes: ${buffer.byteLength}`);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="resource.pdf"`,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        // Allow embedding in iframes from the frontend origin
        'Access-Control-Allow-Origin':
          process.env.FRONTEND_URL || 'http://localhost:3000',
      });

      return res.send(Buffer.from(buffer));
    } catch (err) {
      console.error(`[PDF Proxy] Network error:`, (err as Error).message);
      return res
        .status(500)
        .json({ message: 'Server error while fetching PDF' });
    }
  }

  // ── GET /api/videos/:id — Single video (with optional auth for view tracking) ──
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getVideo(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.videoService.getVideo(id, req.user?.id);
  }

  // ── POST /api/videos/upload — Creator uploads reel + optional PDF ──
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CREATOR, Role.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 3))
  async uploadReel(
    @UploadedFiles() files: Express.Multer.File[],
    @Body()
    body: {
      title: string;
      description?: string;
      skillId?: string;
      subskillId?: string;
      category?: string;
      subcategory?: string;
      visibility?: string;
      certificationUrl?: string;
    },
    @Req() req: Request & { user: { id: string } },
  ) {
    let videoUrl = '';
    let thumbnailUrl: string | undefined;
    let pdfUrl: string | undefined;
    let cloudinaryPublicId: string | undefined;

    for (const file of files) {
      const mime = file.mimetype;

      if (mime.startsWith('video/')) {
        const result = await this.videoService.uploadToCloud(
          file.buffer,
          file.originalname,
          'reel',
        );
        videoUrl = result.secure_url;
        cloudinaryPublicId = result.public_id;
        // Auto-generated thumbnail from first frame
        thumbnailUrl = videoUrl.replace(
          '/upload/',
          '/upload/so_1,w_400,h_700,c_fill,f_jpg/',
        );
      } else if (mime === 'application/pdf') {
        const result = await this.videoService.uploadToCloud(
          file.buffer,
          file.originalname,
          'pdf',
        );
        pdfUrl = result.secure_url;
        console.log(`[Upload] PDF stored at: ${pdfUrl}`);
      } else if (mime.startsWith('image/')) {
        const result = await this.videoService.uploadToCloud(
          file.buffer,
          file.originalname,
          'thumbnail',
        );
        thumbnailUrl = result.secure_url;
      }
    }

    if (!videoUrl) {
      throw new BadRequestException(
        'No video file found in upload. Please include a video file.',
      );
    }

    return this.videoService.createVideo(req.user.id, {
      ...body,
      videoUrl,
      thumbnailUrl,
      pdfUrl,
      cloudinaryPublicId,
      certificationUrl: body.certificationUrl,
    });
  }

  // ── POST /api/videos/:id/watch-later ──
  @Post(':id/watch-later')
  @UseGuards(JwtAuthGuard)
  toggleWatchLater(
    @Param('id') videoId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.videoService.toggleWatchLater(req.user.id, videoId);
  }

  // ── POST /api/videos/:id/like ──
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleLike(
    @Param('id') videoId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.videoService.toggleLike(req.user.id, videoId);
  }

  // ── POST /api/videos/:id/save ──
  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleSave(
    @Param('id') videoId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.videoService.toggleSave(req.user.id, videoId);
  }

  // ── POST /api/videos/:id/comment ──
  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  addComment(
    @Param('id') videoId: string,
    @Body() body: { content: string; parentCommentId?: string },
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.videoService.addComment(
      req.user.id,
      videoId,
      body.content,
      body.parentCommentId,
    );
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.videoService.getComments(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateVideo(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      visibility?: string;
      certificationUrl?: string;
    },
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.videoService.updateVideo(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteVideo(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.videoService.deleteVideo(id, req.user.id);
  }
}
