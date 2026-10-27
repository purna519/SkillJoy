import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { Request } from 'express';

@Controller('communities')
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: Request & { user: { id: string } },
    @Body() data: { name: string; description?: string; skillId?: string },
  ) {
    return this.communityService.create(req.user.id, data);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query('creator') creator?: string, @Req() req?: any) {
    return this.communityService.findAll(creator, req?.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() data: { name?: string; description?: string },
  ) {
    return this.communityService.update(req.user.id, id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.communityService.remove(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  join(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.communityService.join(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/posts')
  @HttpCode(HttpStatus.CREATED)
  createPost(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.communityService.createPost(
      req.user.id,
      id,
      dto.content,
      dto.mediaUrls,
    );
  }

  @Get(':id/posts')
  getPosts(@Param('id') id: string) {
    return this.communityService.getPosts(id);
  }
}
