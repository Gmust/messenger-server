import { Inject, Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';

import { User } from '../../schemas/user.schema';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    super();
  }

  serializeUser(user: User, done: Function): any {
    done(null, user);
  }

  async deserializeUser(payload: any, done: Function): Promise<any> {
    const user = await this.authService.validateUserForGoogle({
      name: payload.name,
      email: payload.email,
      image: payload.image
    });
    return user ? done(null, user) : done(null, null);
  }
}
