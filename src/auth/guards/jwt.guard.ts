import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtGuard implements CanActivate {

  constructor(private authService: AuthService) {
  }

  async canActivate(
    context: ExecutionContext
    //@ts-ignore
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.headers.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Authorization error!');
    }

    const validToken = await this.authService.verifyToken(token);

    if(validToken.error){
      throw new UnauthorizedException(validToken.error);
    }

    return true;
  }
}