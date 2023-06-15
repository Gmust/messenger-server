import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RefreshJwtGuard implements CanActivate {

  constructor(private usersService: UsersService) {
  }

  async canActivate(
    context: ExecutionContext
    //@ts-ignore
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { request_token, email } = request.body;

    if (!request_token) {
      throw new UnauthorizedException('Field refresh_token is required!');
    }

    if (!email) {
      throw  new UnauthorizedException('Field email is required');
    }

    const user = await this.usersService.findOneUser(email);

    if (!user) {
      throw  new UnauthorizedException('User is not exist');
    }

    return true;
  }
}