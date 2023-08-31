import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateUserDto } from '../auth/dto/create-user.dto';
import { LoginUserDto } from '../auth/dto/login-user.dto';
import { pusherServer } from '../config/pusher';
import { Friend_Requests, FriendRequestsDocument } from '../schemas/friendRequests.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { UserDetails } from '../types/user';
import { AppError } from '../utils/appError';
import { toPusherKey } from '../utils/toPusherKey';
import { CheckUserDto } from './dto/checkUser.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Friend_Requests.name) private friendRequest: Model<FriendRequestsDocument>,
  ) {
  }

  private pusher = pusherServer;

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
    return new this.userModel({ name: name, email: email, image: image, friends: [] }).save({
      validateBeforeSave: false
    });
  }

  async addFriend(addFriendDto: { senderId: string; receiverEmail: string }): Promise<Friend_Requests> {
    if (!addFriendDto.senderId || !addFriendDto.receiverEmail) {
      throw new AppError('Both sender and receiver must be registered', 400);
    }
    const receiver = await this.userModel.findOne({ email: addFriendDto.receiverEmail });
    const sender = await this.userModel.findOne({ _id: addFriendDto.senderId });
    if (!receiver) {
      throw new AppError('There is no user with such email', 400);
    }

    const newFriendRequest = new this.friendRequest({ senderId: addFriendDto.senderId, receiverId: receiver._id });

    await pusherServer.trigger(
      toPusherKey(`user:${receiver._id}:incoming-friend-requests`),
      'incoming-friend-requests',
      {
        _id: newFriendRequest._id,
        senderId: sender,
        receiverId: receiver
      }
    );
    return newFriendRequest.save();
  }

  async checkIsUserExists(checkUserDto: CheckUserDto) {
    const receiver = await this.userModel.findOne({ email: checkUserDto.receiverEmail });
    if (!receiver) {
      throw new HttpException('This email is not using that service', HttpStatus.FORBIDDEN);
    }
    return true;
  }

  async checkIsUser(checkUserDto: CheckUserDto) {
    const user = await this.userModel.findOne({ _id: checkUserDto.senderId });
    if (user.email === checkUserDto.receiverEmail) {
      throw new HttpException('You can`t add yourself', HttpStatus.FORBIDDEN);
    }
    return true;
  }

  async checkUserInFriends(checkUserDto: CheckUserDto) {
    const sender = await this.userModel.findOne({ _id: checkUserDto.senderId });
    const receiver = await this.userModel.findOne({ email: checkUserDto.receiverEmail });

    if (!sender.friends.length || !receiver.friends.length) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (sender.friends.includes(receiver._id) || receiver.friends.includes(checkUserDto.senderId)) {
      await this.friendRequest.findOneAndDelete({
        receiverId: receiver._id,
        senderId: checkUserDto.senderId
      });
      throw new HttpException('You are already friends!', HttpStatus.FORBIDDEN);
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
      throw new HttpException('User already has friend request', HttpStatus.FORBIDDEN);
      return false;
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

    await Promise.all([
      pusherServer.trigger(toPusherKey(`user:${receiverId}:friends`), 'new-friend', user),
      pusherServer.trigger(toPusherKey(`user:${senderId}:friends`), 'new-friend', friend)
    ]);

    await this.friendRequest.findOneAndDelete({ receiverId: receiverId, senderId: senderId });
  }

  async declineFriendRequest(senderId: string, receiverId: string) {
    const sender = await this.userModel.findById(senderId);
    const req = await this.friendRequest.findOneAndDelete({ receiverId: receiverId, senderId: senderId });
    await pusherServer.trigger(toPusherKey(`user:${senderId}:requests`), 'deny-request', sender);
  }

  async deleteFromFriends(senderId: string, receiverId: string) {
    if (!senderId || !receiverId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Please provide all data'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    if (senderId === receiverId) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Please provide all data'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const sender = await this.userModel
      .findOneAndUpdate(
        { _id: senderId },
        { $pull: { friends: receiverId } },
        { new: true } // To return the updated document
      )
      .exec();

    const receiver = await this.userModel
      .findOneAndUpdate(
        { _id: receiverId },
        { $pull: { friends: senderId } },
        { new: true } // To return the updated document
      )
      .exec();

    await pusherServer.trigger(toPusherKey(`user:${senderId}`), 'delete-from-friends', {
      status: 'success'
    });

    return null;
  }

  async searchForUsers(email?: string, name?: string) {
    const emailRegex = email ? new RegExp(email, 'i') : undefined;
    const nameRegex = name ? new RegExp(name, 'i') : undefined;

    if (email) {
    }
    const filterEmail = {};
    const filterName = {};
    if (emailRegex) {
      filterEmail['email'] = emailRegex;
    }
    if (nameRegex) {
      filterName['name'] = nameRegex;
    }
    const resultsEmail = await this.userModel.find(filterEmail);
    const resultsName = await this.userModel.find(filterName);

    function mergeAndRemoveDuplicateObjects(arr1, arr2) {
      const mergedArray = arr1.concat(arr2);
      const uniqueArray = mergedArray.filter((obj, index, self) => index === self.findIndex((o) => o.id === obj.id));
      return uniqueArray;
    }

    return mergeAndRemoveDuplicateObjects(resultsEmail, resultsName);
  }

  async changeBio(userId: string, newBio: string) {
    const user = await this.userModel.findOneAndUpdate({ _id: userId }, { bio: newBio }, { new: true });
    return user.bio;
  }

  async changeName(userId: string, newName: string) {
    const user = await this.userModel.findOneAndUpdate({ _id: userId }, { name: newName }, { new: true });
    return user.name;
  }

  async getAllUsersFiles(userId) {
    const user = this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('There is no user with that id', HttpStatus.BAD_REQUEST);
    }
  }
}
