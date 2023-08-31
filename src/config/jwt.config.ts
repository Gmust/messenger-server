import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import * as process from 'process';

export const jwtConfig: JwtModuleAsyncOptions = {
  useFactory: () => {
    return {
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN }
    };
  }
};
