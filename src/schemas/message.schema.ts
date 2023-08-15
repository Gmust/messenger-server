import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import { Chat } from './chat.schema';

enum MessageType {
  Text = 'text',
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  GeoLocation = 'geolocation',
  File = 'file',
  Voice = 'voice'
}

export type MessageDocument = Message & Document;

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class Message {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true
  })
  sender: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true
  })
  recipient: string;

  @Prop({ type: String, enum: MessageType, default: MessageType.Text })
  messageType: MessageType;

  @Prop()
  content: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ type: String, ref: 'Chat', required: true })
  chat: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number]
  })
  geoLocation: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export const MessageSchema = SchemaFactory.createForClass(Message);
