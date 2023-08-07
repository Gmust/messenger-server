import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { pusherServer } from '../config/pusher';
import { Chat, ChatDocument } from '../schemas/chat.schema';
import { Message, MessageDocument } from '../schemas/message.schema';
import { UsersService } from '../users/users.service';
import { AppError } from '../utils/appError';
import { toPusherKey } from '../utils/toPusherKey';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    private usersService: UsersService
  ) {}

  private pusher = pusherServer;

  async createChat(participants: string[]): Promise<Chat> {
    const newChat = new this.chatModel({
      participants: participants
    });
    const savedChat = await newChat.save();

    await this.pusher.trigger('chat', 'new-chat', savedChat);
    return savedChat;
  }

  async createNewMessage(message: Message, chatId: string): Promise<Message> {
    const newMessage = new this.messageModel(message);
    newMessage.chat = chatId;
    const savedMessage = await newMessage.save();
    const sender = await this.usersService.findOneUserById(savedMessage.sender);
    await this.pusher.trigger(toPusherKey(`chat:${chatId}`), 'incoming-message', savedMessage);
    await this.pusher.trigger(toPusherKey(`user:${savedMessage.recipient}:chats`), 'new-message', {
      message: savedMessage,
      senderImage: sender.image,
      senderName: sender.name
    });
    const chat = await this.chatModel.findOneAndUpdate(
      { _id: chatId },
      { $push: { messages: newMessage._id } },
      { new: true }
    );

    return savedMessage;
  }

  async getAllUserChats(userId: string): Promise<Chat[]> {
    const chats = await this.chatModel.find({ participants: userId }).populate('participants');
    return chats;
  }

  async getAllChatMessage(chatId: string) {
    return this.messageModel.find({ chat: chatId }, {}, {});
  }

  async getChatInfo(chatId: string) {
    const chat = await this.chatModel.findOne({ _id: chatId }).populate('participants messages').exec();
    return chat;
  }

  async deleteChat(firstParticipantId: string, secondParticipantId: string) {
    if (!firstParticipantId || !secondParticipantId) {
      throw new UnauthorizedException('Please, provide all data', {});
    }

    const chat = await this.chatModel.findOneAndDelete({
      participants: {
        $all: [firstParticipantId, secondParticipantId]
      }
    });
    if (!chat) {
      throw new AppError('Invalid chat', 403);
    }

    await this.messageModel.deleteMany({ chat: chat._id });

    return true;
  }

  async getChatByParticipants(firstParticipant: string, secondParticipant: string) {
    const chat = await this.chatModel.findOne({
      participants: {
        $all: [firstParticipant, secondParticipant]
      }
    });
    if (!chat) {
      throw new AppError('You must be friends to chat with a user', 400);
    }
    return chat;
  }
}
