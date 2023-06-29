import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { AppError } from '../../utils/appError';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RegistrationGuard implements CanActivate {

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
    const { email, name, password, confirmPassword } = request.body;

    if (!email || !name || !password || !confirmPassword) {
      throw new AppError('Provide all data', 400);
    }

    const user = await this.userService.findOneUserByEmail(email);

    if (user) {
      throw  new UnauthorizedException(`User with this email:${email} exists`);
    }
    return true;
  }
}