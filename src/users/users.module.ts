import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ schema: UserSchema, name: User.name }])],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {
}
