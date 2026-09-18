import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt.guard';
import { CurrentUser } from 'src/modules/auth/decorators/user.decorator';
import { User } from '../../core/database/schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller({ path: "message", version: "1" })
export class MessageController {
  constructor(private readonly messageService: MessageService) { }

  @UseGuards(JwtAuthGuard)
  @Get('/users')
  findAllUserForSidebar(@CurrentUser() user: User) {
    return this.messageService.findAllUserForSidebar(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/:id')
  getMessagesHistory(
    @CurrentUser() user: User,
    @Param('id') receiverId: string,
  ) {
    return this.messageService.getMessagesHistory(user.id, receiverId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('send/:id')
  async sendMessage(
    @CurrentUser() user: User,
    @Param('id') receiverId: string,
    @Body() body: CreateMessageDto,
  ) {
    return await this.messageService.sendMessage(body, user.id, receiverId);
  }
}