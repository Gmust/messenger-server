import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import { Message, MessageSchema } from './message.schema';

export type ChatDocument = Chat & Document;

@Schema({
  toObject: {
    virtuals: true
  }
})
export class Chat {
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    default: []
  })
  participants: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Message' }],
    default: []
  })
  messages: MongooseSchema.Types.ObjectId[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
