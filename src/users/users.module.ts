import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { Friend_Requests, FriendRequestsSchema } from '../schemas/friendRequests.schema';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import * as bcrypt from 'bcrypt';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const schema = UserSchema;
          schema.pre('save', async function() {
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
          schema.pre('find', async function() {
            this.populate('sender', '_id email name image');
          });
          return schema;
        }
      }
    ]),
    MongooseModule.forFeature([
      { schema: UserSchema, name: User.name },
      { schema: FriendRequestsSchema, name: Friend_Requests.name }
    ]),
    AuthModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {
}
