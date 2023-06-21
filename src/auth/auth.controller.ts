import { Body, Controller, HttpCode, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginGuard } from './guards/login.guard';
import { RegistrationGuard } from './guards/registration.guard';
import { RefreshJwtGuard } from './guards/refreshJwt.guard';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';

@Controller('auth')
export class AuthController {

  constructor(private authService: AuthService, private usersService: UsersService) {
  }

  @UseGuards(LoginGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(
    @Body() loginUserDto: LoginUserDto
  ) {
    const user = await this.usersService.login(loginUserDto);
    const access = await this.authService.generateAccessToken(user);
    const refresh = await this.authService.generateRefreshToken(user._id as unknown as string);

    return {
      ...access, ...refresh, user: {
        name: user.name,
        _id: user._id,
        email: user.email,
        image: user.image
      }
    };
  }

  @UseGuards(RegistrationGuard)
  @Post('registration')
  async registerUser(
    @Body() createUserDto: CreateUserDto
  ) {
    await this.usersService.registration(createUserDto);

    return {
      msg: 'User successfully created!'
    };
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto
  ) {
    const validToken = await this.authService.verifyToken(refreshTokenDto.refresh_token);
    const user = await this.usersService.findOneUser(refreshTokenDto.email);
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

  @Post('/reset-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto
  ) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      Msg: 'Reset url sent to your email!'
    };
  }

  @Post('/reset')
  async resetUserPassword(
    @Body() resetPasswordDto: ResetPasswordDto
  ) {
    try {
      await this.authService.resetPassword(resetPasswordDto);
      return {
        Msg: 'Password reset!'
      };
    } catch (e) {
      throw  new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: e.message
        },
        HttpStatus.FORBIDDEN,
        { cause: e });
    }
  }
}