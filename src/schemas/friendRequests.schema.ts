import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FriendRequestsDocument = Friend_Requests & Document

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class Friend_Requests {

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Field senderId is required']
  })
  sender;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Field receiverId is required']
  })
  receiver;
}

export const FriendRequestsSchema = SchemaFactory.createForClass(Friend_Requests);