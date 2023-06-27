import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import * as  bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class LoginGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private userService: UsersService
  ) {
  }

  async canActivate(
    context: ExecutionContext
    //@ts-ignore
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { email, password } = request.body;
    const user = await this.userService.findOneUser(email);

    if (!user) {
      throw  new UnauthorizedException(`Invalid email or password!`);
    }

    const dbPassword = user.password;

    const match = await bcrypt.compare(password, dbPassword);

    if (!match) {
      throw  new UnauthorizedException(`Invalid email or password!`);
    }

    return true;
  }
}