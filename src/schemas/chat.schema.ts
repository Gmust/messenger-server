import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import { Message, MessageSchema } from './message.schema';

export type ChatDocument = Chat & Document;

@Schema()
export class Chat {
  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'User'
    }
  ])
  participants: string[];

  @Prop({
    type: [MessageSchema],
    default: []
  })
  messages: Message[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
