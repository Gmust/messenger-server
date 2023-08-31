import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module';
import { Chat, ChatSchema } from '../schemas/chat.schema';
import { Message, MessageSchema } from '../schemas/message.schema';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { schema: MessageSchema, name: Message.name },
      { schema: ChatSchema, name: Chat.name }
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule)
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService]
})
export class ChatModule {
}
