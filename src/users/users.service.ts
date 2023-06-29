import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateUserDto } from '../auth/dto/create-user.dto';
import { LoginUserDto } from '../auth/dto/login-user.dto';
import { Friend_Requests, FriendRequestsDocument } from '../schemas/friendRequests.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { UserDetails } from '../types/user';
import { AppError } from '../utils/appError';
import { CheckUserDto } from './dto/checkUser.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Friend_Requests.name) private friendRequest: Model<FriendRequestsDocument>
  ) {}

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
      throw new AppError('Provide all needed data', 400);
    }

    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new AppError(`User with this email:${createUserDto.email} exists`, 400);
    }

    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new AppError(`Password do not corresponds`, 400);
    }

    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findOneUserByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async findOneUserById(id: string) {
    return this.userModel.findOne({ _id: id });
  }

  async createUser({ name, email, image }: UserDetails) {
    return new this.userModel({ name: name, email: email, image: image });
  }

  async addFriend(addFriendDto: { senderId: string; receiverEmail: string }): Promise<Friend_Requests> {
    if (!addFriendDto.senderId || !addFriendDto.receiverEmail) {
      throw new AppError('Both sender and receiver must be registered', 400);
    }
    const receiver = await this.userModel.findOne({ email: addFriendDto.receiverEmail });

    if (!receiver) {
      throw new AppError('There is no user with such email', 400);
    }
    const newFriendRequest = new this.friendRequest({ senderId: addFriendDto.senderId, receiverId: receiver._id });
    return newFriendRequest.save();
  }

  async checkUserInFriends(checkUserDto: CheckUserDto) {
    const sender = await this.userModel.findOne({ _id: checkUserDto.senderId });
    const receiver = await this.userModel.findOne({ email: checkUserDto.receiverEmail });

    if (sender.friends.includes(receiver._id) || receiver.friends.includes(checkUserDto.senderId)) {
      const doc = await this.friendRequest.findOne({});
      await this.friendRequest.findOneAndDelete({
        receiverId: receiver._id,
        senderId: checkUserDto.senderId
      });
      throw new AppError('You are already friends!', 400);
    }
    return true;
  }

  async checkUserIsAlreadyHasRequest(checkUserDto: CheckUserDto) {
    const receiver = await this.userModel.findOne({
      email: checkUserDto.receiverEmail
    });

    const friendRequest = await this.friendRequest.findOne({
      receiverId: receiver._id,
      senderId: checkUserDto.senderId
    });

    if (friendRequest) {
      throw new AppError('User already has friend request', 400);
    }

    return true;
  }

  async getAllIncomingFriendsRequests(userId: string): Promise<Friend_Requests[]> {
    const allRequests = await this.friendRequest.find({
      receiverId: userId
    });
    return allRequests;
  }

  async getAllOutComingFriendsRequests(userId: string): Promise<Friend_Requests[]> {
    const allRequests = await this.friendRequest.find({
      senderId: userId
    });

    return allRequests;
  }

  async acceptFriend(senderId: string, receiverId: string) {
    const user = await this.userModel.findOneAndUpdate(
      {
        _id: receiverId
      },
      {
        $push: { friends: senderId }
      },
      {
        runValidators: true
      }
    );
    const friend = await this.userModel.findOneAndUpdate(
      {
        _id: senderId
      },
      {
        $push: { friends: receiverId }
      },
      {
        runValidators: true
      }
    );

    if (!user) {
      throw new AppError('User is not found!', 400);
    }

    if (!friend) {
      throw new AppError('Friend is not found!', 400);
    }

    await this.friendRequest.findOneAndDelete({ receiverId: receiverId, senderId: senderId });
  }

  async declineFriendRequest(senderId: string, receiverId: string) {
    await this.friendRequest.findOneAndDelete({ receiverId: receiverId, senderId: senderId });
  }
}
