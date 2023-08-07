import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema()
export class Account {
  @Prop({
    type: String
  })
  provider;

  @Prop({
    type: String
  })
  type;

  @Prop({
    type: String
  })
  providerAccountId;

  @Prop({
    type: String
  })
  access_token;

  @Prop({
    type: Number
  })
  expires_at;

  @Prop({
    type: String
  })
  scope;

  @Prop({
    type: String
  })
  token_type;

  @Prop({
    type: String
  })
  id_token;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
