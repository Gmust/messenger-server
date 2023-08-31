import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { jwtConfig } from '../config/jwt.config';
import { EmailModule } from '../email/email.module';
import { Account, AccountSchema } from '../schemas/accounts.schema';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './utils/GoogleStrategy';
import { SessionSerializer } from './utils/Serializer';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.registerAsync(jwtConfig),
    EmailModule,
    PassportModule.register({ session: true }),
    MongooseModule.forFeature([{ schema: AccountSchema, name: Account.name }])
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, SessionSerializer],
  exports: [AuthService]
})
export class AuthModule {}
