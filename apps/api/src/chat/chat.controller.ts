import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  // GET /api/messages/conversations — all conversations for the logged-in user
  @Get('conversations')
  getConversations(@Req() req: Request & { user: { id: string } }) {
    return this.chatService.getConversations(req.user.id);
  }

  // GET /api/messages/:conversationId — message history
  @Get(':conversationId')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.chatService.getMessages(conversationId, req.user.id);
  }

  // POST /api/messages/start — start a new DM
  @Post('start')
  startConversation(
    @Body() body: { targetUserId: string },
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.chatService.startConversation(req.user.id, body.targetUserId);
  }
}
