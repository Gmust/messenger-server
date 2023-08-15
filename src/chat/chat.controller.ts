import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { Chat } from '../schemas/chat.schema';
import { Message } from '../schemas/message.schema';
import { UsersService } from '../users/users.service';
import { AppError } from '../utils/appError';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService, private userService: UsersService) {
  }

  @UseGuards(JwtGuard)
  @Post()
  async createChat(@Body() { participants }: { participants: string[] }): Promise<Chat> {
    try {
      return this.chatService.createChat(participants);
    } catch (e) {
      throw new AppError(e.message, 400);
    }
  }

  @UseGuards(JwtGuard)
  @Get('messages/:chatId')
  async getChatMessages(@Param('chatId') chatId: string): Promise<Message[]> {
    try {
      return this.chatService.getAllChatMessage(chatId);
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: e.message
        },
        HttpStatus.BAD_REQUEST,
        { cause: e }
      );
    }
  }

  @UseGuards(JwtGuard)
  @Post('message/:chatId')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './uploads/chatfiles',
        filename: (req, file, callback) => {
          const filename = Buffer.from(file.originalname, 'latin1').toString('utf8');
          const extension = path.parse(file.originalname).ext;
          callback(null, `${filename}`);
        }
      })
    })
  )
  async createMessage(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() message: Message,
    @Param('chatId') chatId: string
  ): Promise<Message> {
    try {
      if (
        message.messageType === 'image' ||
        message.messageType === 'video' ||
        message.messageType === 'audio' ||
        message.messageType === 'file' ||
        message.messageType === 'voice'
      ) {
        message.content = files[0].filename;
        const lastMessage = await this.chatService.createNewMessage(message, chatId);
        return lastMessage;
      }
      if (message.messageType === 'text' || message.messageType === 'geolocation') {
        const lastMessage = await this.chatService.createNewMessage(message, chatId);
        return lastMessage;
      }
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: e.message
        },
        HttpStatus.BAD_REQUEST,
        { cause: e }
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get()
  async getAllUserChats(@Body() { userId }: { userId: string }): Promise<Chat[]> {
    try {
      return this.chatService.getAllUserChats(userId);
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: e.message
        },
        HttpStatus.BAD_REQUEST,
        { cause: e }
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get('info')
  async geChatInfo(@Body() { chatId }: { chatId: string }): Promise<Chat> {
    try {
      return this.chatService.getChatInfo(chatId);
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: e.message
        },
        HttpStatus.BAD_REQUEST,
        { cause: e }
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get('by-participants')
  async getChatByParticipants(
    @Query('firstParticipant') firstParticipant: string,
    @Query('secondParticipant') secondParticipant: string
  ) {
    try {
      const chat = await this.chatService.getChatByParticipants(firstParticipant, secondParticipant);
      return chat;
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: e.message
        },
        HttpStatus.BAD_REQUEST,
        { cause: e }
      );
    }
  }
}
