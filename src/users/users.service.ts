import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { LoginUserDto } from '../auth/dto/login-user.dto';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { AppError } from '../utils/appError';
import { Friend_Requests, FriendRequestsDocument } from '../schemas/friendRequests.schema';
import { AddFriendDto } from './dto/addFriend.dto';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Friend_Requests.name) private friendRequest: Model<FriendRequestsDocument>
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

  async registration(createUserDto: CreateUserDto): Promise<User | null> {

    if (!createUserDto) {
      throw  new AppError('Provide all needed data', 400);
    }

    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw  new AppError(`User with this email:${createUserDto.email} exists`, 400);
    }

    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new AppError(`Password do not corresponds`, 400);
    }

    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findOneUser(email: string): Promise<User> {
    return this.userModel.findOne({ email });
  }

  async addFriend(addFriendDto: AddFriendDto) {

    if (!addFriendDto.sender || !addFriendDto.receiver) {
      throw new AppError('Both sender and receiver must be registered', 400);
    }

    const newFriendRequest = new this.friendRequest(addFriendDto);

    return newFriendRequest.save();
  }

  async getAllFriendsRequests(userId: string) {


    const allRequests = await this.friendRequest.find({
      receiver: userId
    });

    console.log(allRequests);
    return;
  }

}
