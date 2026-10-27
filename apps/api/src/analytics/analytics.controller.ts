import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('watch')
  async trackWatch(
    @Req() req,
    @Body() data: { videoId: string; duration: number },
  ) {
    return this.analyticsService.trackWatchTime(
      data.videoId,
      req.user.id,
      data.duration,
    );
  }

  @Get('trending')
  async getTrending() {
    return this.analyticsService.getTrending();
  }
}
