import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as process from 'process';

import { EmailService } from '../email/email.service';
import { User } from '../schemas/user.schema';
import { UserDetails } from '../types/user';
import { UsersService } from '../users/users.service';
import { AppError } from '../utils/appError';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService, private emailService: EmailService) {
  }

  async validateUser(email: string): Promise<User | null> {
    const user = await this.usersService.findOneUserByEmail(email);
    if (!user) {
      throw new AppError('There is  no user with such email', 400);
    }
    return user;
  }

  async validateUserForGoogle({ name, email, image }: UserDetails): Promise<User | null> {
    const user = await this.usersService.findOneUserByEmail(email);
    if (user) return user;
    const newUser = await this.usersService.createUser({ email, name, image });
    return newUser.save({ validateBeforeSave: false });
  }

  async generateAccessToken(user: User) {
    return {
      access_token: this.jwtService.sign({ user })
    };
  }

  async generateRefreshToken(userId: string) {
    return {
      refresh_token: this.jwtService.sign(
        { userId },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '7d'
        }
      )
    };
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      return { error: e.message };
    }
  }

  async parseJwt(token) {
    const t = String(token);
    return JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());
  }

  async getUserByTokenData(token: string) {
    const parsedTokenData = await this.parseJwt(token);
    return this.usersService.findOneUserByEmail(parsedTokenData.user.email);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findOneUserByEmail(forgotPasswordDto.userEmail);

    if (!user) {
      throw new AppError('There isn`t user with such email!', 404);
    }

    const token = await this.generateAccessToken(user);
    const resetToken = token.access_token;
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date().getTime() + 10 * 60 * 1000;
    user.save({ validateBeforeSave: false });

    try {
      const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

      await this.emailService.sendEmail({
        emailFrom: process.env.EMAIL_FROM,
        emailTo: forgotPasswordDto.userEmail,
        html: `<h1>${resetUrl}</h1>`,
        text: 'test',
        subject: 'test',
        url: resetUrl
      });
    } catch (e) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.getUserByTokenData(resetPasswordDto.token);

    if (!user) {
      return new AppError('Token is invalid or has expired!', 400);
    }

    user.password = resetPasswordDto.newPassword;
    user.confirmPassword = resetPasswordDto.confirmNewPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
  }
}
