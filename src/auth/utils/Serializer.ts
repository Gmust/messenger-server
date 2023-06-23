import { PassportSerializer } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../schemas/user.schema';

@Injectable()
export class SessionSerializer extends PassportSerializer {

  constructor(
    @Inject(AuthService) private readonly authService: AuthService
  ) {
    super();
  }

  serializeUser(user: User, done: Function): any {
    done(null, user);
  }

  async deserializeUser(payload: any, done: Function): Promise<any> {
    const user = await this.authService.validateUserForGoogle(
      {
        name: payload.user.name,
        email: payload.user.email,
        image: payload.user.image
      }
    );
    return user ? done(null, user) : done(null, null);
  }
}