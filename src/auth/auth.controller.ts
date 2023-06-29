import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { AppError } from '../utils/appError';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { GoogleAuthGuard } from './guards/googleAuth.guard';
import { LoginGuard } from './guards/login.guard';
import { RefreshJwtGuard } from './guards/refreshJwt.guard';
import { RegistrationGuard } from './guards/registration.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  async handleGoogleLogin() {}

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  async handleGoogleRedirect() {}

  @UseGuards(LoginGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    const user = await this.usersService.login(loginUserDto);
    const access = await this.authService.generateAccessToken(user);
    const refresh = await this.authService.generateRefreshToken(user._id as unknown as string);

    return {
      ...access,
      ...refresh,
      user: {
        name: user.name,
        id: user._id,
        email: user.email,
        image: user.image
      }
    };
  }

  @UseGuards(RegistrationGuard)
  @Post('registration')
  async registerUser(@Body() createUserDto: CreateUserDto) {
    try {
      await this.usersService.registration(createUserDto);

      return {
        Msg: 'User successfully created!'
      };
    } catch (e) {
      return {
        Msg: e.message
      };
    }
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const validToken = await this.authService.verifyToken(refreshTokenDto.refresh_token);
    const user = await this.usersService.findOneUserByEmail(refreshTokenDto.email);
    const access = await this.authService.generateAccessToken(user);
    if (validToken.error) {
      if (validToken.error === 'jwt expired') {
        const refresh = this.authService.generateRefreshToken(user._id as unknown as string);
        return { ...access, ...refresh };
      } else {
        return { error: validToken.error };
      }
    } else {
      return { ...access, refresh_token: refreshTokenDto.refresh_token };
    }
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      Msg: 'Reset url sent to your email!'
    };
  }

  @Post('/reset')
  async resetUserPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      await this.authService.resetPassword(resetPasswordDto);
      return {
        Msg: 'Password reset!'
      };
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: e.message
        },
        HttpStatus.FORBIDDEN,
        { cause: e }
      );
    }
  }

  @Post('/user')
  async getUserByToken(@Body() { email }: { email: string }) {
    try {
      const user = await this.usersService.findOneUserByEmail(email);
      const { access_token } = await this.authService.generateAccessToken(user);
      const { refresh_token } = await this.authService.generateRefreshToken(String(user._id));
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        friends: user.friends,
        access_token: access_token,
        refresh_token: refresh_token
      };
    } catch (e) {
      throw new AppError(e.message, '400');
    }
  }
}
