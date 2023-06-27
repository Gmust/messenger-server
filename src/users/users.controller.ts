import { Body, Controller, Delete, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import { diskStorage } from 'multer';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AddFriendDto } from './dto/addFriend.dto';
import * as path from 'path';
import { CheckUserDto } from './dto/checkUser.dto';

export const storage = {};

@Controller('users')
export class UsersController {

  constructor(private userService: UsersService) {
  }

  @UseGuards(JwtGuard)
  @Post('/add')
  async sentFriendRequest(
    @Body() addFriendDto: { senderId: string, receiverEmail: string }
  ) {

    await this.userService.checkUserInFriends(addFriendDto);
    await this.userService.checkUserIsAlreadyHasRequest(addFriendDto);
    await this.userService.addFriend(addFriendDto);

    return {
      Msg: 'Friend request sent!'
    };
  }

  @UseGuards(JwtGuard)
  @Get('incoming-friend-requests')
  async getIncomingFriendRequests(
    @Body() body
  ) {
    try {
      const incomigFriendRequests = await this.userService.getAllIncomingFriendsRequests(body.userId);
      return incomigFriendRequests;
    }catch (e){
      return  {
        Msg: e.message
      }
    }

  }

  @UseGuards(JwtGuard)
  @Get('out-coming-friend-requests')
  async getOutComingFriendRequests(
    @Body() body
  ) {
    try{
      const friendRequests = await this.userService.getAllOutComingFriendsRequests(body.userId);
      return friendRequests;
    }catch (e){
      return {
        Msg: e.message
      }
    }
  }


  @UseGuards(JwtGuard)
  @Post('/accept-friend')
  async acceptFriend(
    @Body() body: CheckUserDto
  ) {
    await this.userService.checkUserInFriends(body);
    await this.userService.acceptFriend(body.senderId, body.receiverEmail);
    return {
      Msg: 'Successfully added!'
    };
  }


  @UseGuards(JwtGuard)
  @Delete('/decline-friend')
  async declineFriend(
    @Body() body: AddFriendDto
  ) {
    await this.userService.declineFriendRequest(body.senderId, body.receiverId);
    return {
      Msg: 'User friend request declined'
    };
  }

  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('newPhoto', {
    storage: diskStorage({
      destination: './uploads/userimages',
      filename: (req, file, callback) => {
        const filename = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
        const extension = path.parse(file.originalname).ext;
        callback(null, `${filename}${extension}`);
      }
    })
  }))
  @Patch('/photo')
  async setNewPhoto(
    @UploadedFile() newPhoto,
    @Body() { email }: { email: string }
  ) {
    try {
      const user = await this.userService.findOneUser(email);
      user.image = newPhoto.filename;
      user.save({ validateBeforeSave: false });

      return {
        Msg: 'New image successfully uploaded!'
      };
    } catch (e) {
      console.log('Error in set new photo');
      console.log(e);
    }

  }
}

