import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as process from 'process';


@Module({
  imports: [
    UsersService,
    JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: '20m'
        }
      }
    )
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {
}
