import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as process from 'process';

import { EmailService } from '../email/email.service';
import { Account, AccountDocument } from '../schemas/accounts.schema';
import { User } from '../schemas/user.schema';
import { UserDetails } from '../types/user';
import { UsersService } from '../users/users.service';
import { AppError } from '../utils/appError';
import { ResetPasswordDto } from './dto/resetPassword.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>
  ) {
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

  async validateGoogleAccount(account: Account): Promise<Account | null> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const accountInDb = await this.accountModel.findOne({ _id: account._id });

    if (!accountInDb) {
      const newAccount = await new this.accountModel(account).save();
      return newAccount;
    }

    return accountInDb;
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

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneUserByEmail(email);

    if (!user) {
      throw new HttpException('There is no user with this email!!', HttpStatus.BAD_REQUEST);
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
        emailTo: email,
        html: `<b>Hello, <strong>${user.name}</strong>, Your recovery link is:\\n<b>${resetUrl}</b></p>`,
        text: 'Recover your password',
        subject: 'Recover your password',
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

    if (!user.resetPasswordToken) {
      throw new HttpException('Token is invalid or has expired!', 400);
    }
    if (user.resetPasswordExpires < new Date().getTime()) {
      throw new HttpException('Token is invalid or has expired!', 400);
    }
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new HttpException('Passwords must be same!', HttpStatus.FORBIDDEN);
    }

    user.password = resetPasswordDto.newPassword;
    user.confirmPassword = resetPasswordDto.confirmPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save({ validateBeforeSave: false });
  }
}
