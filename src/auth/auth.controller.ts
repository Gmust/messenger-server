import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {

  constructor(private authService: AuthService, private usersService: UsersService) {
  }


  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(
    @Body() loginUserDto: LoginUserDto
  ) {
    const user = await this.usersService.login(loginUserDto);
    const access = await this.authService.generateAccessToken(user);
    const refresh = await this.authService.generateRefreshToken(user._id as string);

    return {
      ...access, ...refresh, user: {
        name: user.name,
        _id: user._id,
        email: user.email,
        image: user.image
      }
    };
  }

  @Post('registration')
  @HttpCode(HttpStatus.OK)
  async registerUser(
    @Body() createUserDto: CreateUserDto
  ) {
    await this.usersService.registartion(createUserDto);

    return {
      msg: 'User successfully created!'
    };
  }

  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res() res: Response
  ) {
    const validToken = await this.authService.verifyToken(refreshTokenDto.refresh_token);
    const user = await this.usersService.findOneUser(validToken.email);
    const access = await this.authService.generateAccessToken(user);

    if (validToken.error) {
      if (validToken.error === 'jwt expired') {
        const refresh = this.authService.generateRefreshToken(user._id as string);
        return { ...access, ...refresh };
      } else {
        return { error: validToken.error };
      }
    } else {
      return { ...access, refresh_token: refreshTokenDto.refresh_token };
    }
  }
}