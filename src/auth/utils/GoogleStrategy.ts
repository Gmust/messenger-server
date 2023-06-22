import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import * as process from 'process';
import { Inject } from '@nestjs/common';
import { AuthService } from '../auth.service';

export class GoogleStrategy extends PassportStrategy(Strategy) {

  constructor(
    @Inject(AuthService) private readonly authService: AuthService
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:8080/auth/google/redirect',
      scope: ['email', 'profile']
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const user = await this.authService.validateUserForGoogle(
      {
        email: profile.emails[0].value,
        name: profile.displayName
      }
    );
    console.log(user);
    return user || null;
  }
}
