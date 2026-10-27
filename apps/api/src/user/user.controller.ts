import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  Query,
  Post,
  Delete,
  Patch,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { Request } from 'express';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: Request & { user: { id: string } }) {
    return this.userService.getMe(req.user.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('profile/:username')
  getProfile(@Param('username') username: string, @Req() req: any) {
    return this.userService.findByUsername(username, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(
    @Query('q') q: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.searchUsers(q || '', req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow/:id')
  follow(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.followUser(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('follow/:id')
  unfollow(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.unfollowUser(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow/:id/accept')
  accept(
    @Param('id') followerId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.acceptFollow(req.user.id, followerId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('follow/:id/reject')
  reject(
    @Param('id') followerId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.rejectFollow(req.user.id, followerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('follow/requests')
  getRequests(@Req() req: Request & { user: { id: string } }) {
    return this.userService.getFollowRequests(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('privacy/toggle')
  togglePrivacy(@Req() req: Request & { user: { id: string } }) {
    return this.userService.togglePrivacy(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('follow/:id/status')
  getStatus(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.getFollowingStatus(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Req() req: Request & { user: { id: string } },
    @Body() body: { fullName?: string; bio?: string },
  ) {
    return this.userService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @Req() req: Request & { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: 'avatar' | 'banner',
  ) {
    if (!file) throw new BadRequestException('No image file provided');
    if (type !== 'avatar' && type !== 'banner')
      throw new BadRequestException('Invalid image type');

    const url = await this.userService.uploadProfileImage(
      req.user.id,
      file.buffer,
      type,
    );
    return { url };
  }

  @Get(':username/followers')
  getFollowers(@Param('username') username: string) {
    return this.userService.getFollowers(username);
  }

  @Get(':username/following')
  getFollowing(@Param('username') username: string) {
    return this.userService.getFollowing(username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('block/:id')
  block(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.blockUser(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('block/:id')
  unblock(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.userService.unblockUser(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocked/list')
  getBlocked(@Req() req: Request & { user: { id: string } }) {
    return this.userService.getBlockedUsers(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('takes')
  createTake(
    @Req() req: Request & { user: { id: string } },
    @Body() body: { videoId?: string; content: string },
  ) {
    return this.userService.createLearningTake(
      req.user.id,
      body.videoId || null,
      body.content,
    );
  }

  @Get('takes/:userId')
  getTakes(@Param('userId') userId: string) {
    return this.userService.getLearningTakes(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('quests/daily')
  getQuests(@Req() req: Request & { user: { id: string } }) {
    return this.userService.getDailyQuests(req.user.id);
  }

  @Get(':userId/skills/progress')
  getSkillsProgress(@Param('userId') userId: string) {
    return this.userService.getSkillProgress(userId);
  }
}
