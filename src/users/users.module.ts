import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';

import { AuthModule } from '../auth/auth.module';
import { Friend_Requests, FriendRequestsSchema } from '../schemas/friendRequests.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const schema = UserSchema;
          schema.pre('save', async function (next) {
            if (!this.password) next();
            if (!this.friends) {
              this.friends = [];
            }
            this.password = await bcrypt.hash(this.password, 12);
            this.confirmPassword = undefined;
          });

          return schema;
        }
      },
      {
        name: Friend_Requests.name,
        useFactory: () => {
          const schema = FriendRequestsSchema;
          schema.pre('find', async function () {
            this.populate('senderId', '_id email name image');
            this.populate('receiverId', '_id email name image');
          });
          return schema;
        }
      }
    ]),
    MongooseModule.forFeature([
      { schema: UserSchema, name: User.name },
      { schema: FriendRequestsSchema, name: Friend_Requests.name }
    ]),
    forwardRef(() => AuthModule)
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
