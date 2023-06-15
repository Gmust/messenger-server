import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { LoginUserDto } from '../auth/dto/login-user.dto';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {
  }

  async login(loginUserDto: LoginUserDto): Promise<User | null> {

    if (!loginUserDto.email || !loginUserDto.email) {
      return null;
    }

    const user = this.userModel.findOne({
      email: loginUserDto.email
    });

    if (!user) {
      return null;
    }

    return user as unknown as User;
  }

  async registartion(createUserDto: CreateUserDto): Promise<User | null> {

    const existingUser = this.userModel.findOne({ email: createUserDto.email });

    if (existingUser) {
      return null;
    }

    if (createUserDto.password !== createUserDto.confirmPassword) {
      return null;
    }

    const salt = await bcrypt.genSalt(12);
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    const createdUser = new this.userModel(createUserDto);

    return createdUser.save();
  }

  async findOneUser(email: string): Promise<User> {
    return this.userModel.findOne({ email });
  }
}
