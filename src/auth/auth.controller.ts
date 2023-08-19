import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Res, UseGuards } from '@nestjs/common';

import { Account } from '../schemas/accounts.schema';
import { User } from '../schemas/user.schema';
import { UserDetails } from '../types/user';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { GoogleAuthGuard } from './guards/googleAuth.guard';
import { JwtGuard } from './guards/jwt.guard';
import { LoginGuard } from './guards/login.guard';
import { RefreshJwtGuard } from './guards/refreshJwt.guard';
import { RegistrationGuard } from './guards/registration.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  async handleGoogleLogin() {

  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  async handleGoogleRedirect(@Body() body: any, @Res() res: any) {
    const { user } = res.req;
    // Redirect or handle the user object as needed
    res.redirect(`http://localhost:3000/dashboard?email=${user.user.email}`);
  }

  @UseGuards(LoginGuard)
  @Post('login')
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    try {
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
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: e.message
        },
        HttpStatus.UNAUTHORIZED,
        { cause: e }
      );
    }
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
  async forgotPassword(@Body() { email }: { email: string }) {
    await this.authService.forgotPassword(email);
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

  @Get('/user')
  async getUserByEmail(@Body() { email }: { email: string }) {
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

  @UseGuards(JwtGuard)
  @Get('user/:id')
  async getUserById(
    @Param('id') id: string
  ): Promise<Pick<User, 'email' | 'name' | '_id' | 'image' | 'friends' | 'bio'>> {
    try {
      const user = await this.usersService.findOneUserById(id);
      const { access_token } = await this.authService.generateAccessToken(user);
      const { refresh_token } = await this.authService.generateRefreshToken(String(user._id));
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        friends: user.friends,
        bio: user.bio
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

  @Post('/login-google')
  async loginGoogle(@Body() body: UserDetails) {
    const user = await this.usersService.findOneUserByEmail(body.email);
    if (!user) {
      const newUser = await this.usersService.createUser({ email: body.email, name: body.name, image: body.image });
      const { access_token } = await this.authService.generateAccessToken(newUser);
      const { refresh_token } = await this.authService.generateRefreshToken(String(newUser._id));
      return {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        image: newUser.image,
        bio: newUser.bio,
        friends: newUser.friends,
        access_token: access_token,
        refresh_token: refresh_token
      };
    }
    const { access_token } = await this.authService.generateAccessToken(user);
    const { refresh_token } = await this.authService.generateRefreshToken(String(user._id));
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      friends: user.friends,
      access_token: access_token,
      refresh_token: refresh_token
    };
  }

  @Post('/account-google')
  async accountGoogle(@Body() { account }: { account: Account }) {
    try {
      return await this.authService.validateGoogleAccount(account);
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
}
