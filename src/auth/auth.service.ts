import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../schemas/user.schema';
import * as process from 'process';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { AppError } from '../utils/appError';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService
  ) {
  }

  async validateUser(email: string): Promise<User | null> {
    const user = await this.usersService.findOneUser(email);
    if (!user) {
      return null;
    }
    return user;
  }

  async generateAccessToken(user: User) {
    return {
      access_token: this.jwtService.sign({ user })
    };
  }

  async generateRefreshToken(userId: string) {
    return {
      refresh_token: this.jwtService.sign({ userId }, {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d'
      })
    };
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      return { error: e.message };
    }
  }

  async parseJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  async getUserByTokenData(token: string): Promise<User> {
    const parsedTokenData = await this.parseJwt(token);
    return this.usersService.findOneUser(parsedTokenData.user.email);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    console.log(forgotPasswordDto.userEmail)
    const user = await this.usersService.findOneUser(forgotPasswordDto.userEmail);

    if (!user) {
      throw new AppError('There isn`t user with such email!', 404);
    }

    const resetToken = await user.createPasswordResetToken();
    user.save({ validateBeforeSave: false });

    try {

      const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;

      await this.emailService.sendEmail({
        emailFrom: process.env.EMAIL_FROM,
        emailTo: forgotPasswordDto.userEmail,
        html: `<h1>${resetUrl}</h1>`,
        text: 'test',
        subject: 'test',
        url: resetUrl
      });

    } catch (e) {
      console.log(e);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }



}
