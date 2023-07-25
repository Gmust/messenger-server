import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { ChatService } from '../chat/chat.service';
import { AddFriendDto } from './dto/addFriend.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService, private chatService: ChatService) {
  }

  @UseGuards(JwtGuard)
  @Post('/add')
  async sentFriendRequest(@Body() addFriendDto: { senderId: string; receiverEmail: string }) {
    await this.userService.checkIsUser(addFriendDto);
    await this.userService.checkIsUserExists(addFriendDto);
    await this.userService.checkUserInFriends(addFriendDto);
    await this.userService.checkUserIsAlreadyHasRequest(addFriendDto);
    await this.userService.addFriend(addFriendDto);

    return {
      Msg: 'Friend request sent!'
    };
  }

  @UseGuards(JwtGuard)
  @Delete('/remove')
  async removeFromFriends(@Body() removeFriendDto: { senderId: string; receiverId: string }) {
    try {
      await this.userService.deleteFromFriends(removeFriendDto.senderId, removeFriendDto.receiverId);
      await this.chatService.deleteChat(removeFriendDto.senderId, removeFriendDto.receiverId);

      return {
        Msg: 'Successfully deleted!'
      };
    } catch (e) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: e.message
        },
        HttpStatus.BAD_REQUEST,
        { cause: e }
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get('incoming-friend-requests')
  async getIncomingFriendRequests(@Body() body) {
    try {
      const incomingFriendRequests = await this.userService.getAllIncomingFriendsRequests(body.userId);
      return incomingFriendRequests;
    } catch (e) {
      return {
        Msg: e.message
      };
    }
  }

  @UseGuards(JwtGuard)
  @Get('out-coming-friend-requests')
  async getOutComingFriendRequests(@Body() body) {
    try {
      const friendRequests = await this.userService.getAllOutComingFriendsRequests(body.userId);
      return friendRequests;
    } catch (e) {
      return {
        Msg: e.message
      };
    }
  }

  @UseGuards(JwtGuard)
  @Post('/accept-friend')
  async acceptFriend(@Body() body: AddFriendDto) {
    try {
      await this.userService.acceptFriend(body.senderId, body.receiverId);
      await this.chatService.createChat([body.senderId, body.receiverId]);
      return {
        Msg: 'Successfully added!'
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
  @Delete('/decline-friend')
  async declineFriend(@Body() body: AddFriendDto) {
    await this.userService.declineFriendRequest(body.senderId, body.receiverId);
    return {
      Msg: 'User friend request declined'
    };
  }

  @UseGuards(JwtGuard)
  @Delete('/decline-request')
  async declineRequest(@Body() body: AddFriendDto) {
    await this.userService.declineFriendRequest(body.receiverId, body.senderId);
  }

  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('newPhoto', {
      storage: diskStorage({
        destination: './uploads/userimages',
        filename: (req, file, callback) => {
          const filename = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
          const extension = path.parse(file.originalname).ext;
          callback(null, `${filename}${extension}`);
        }
      })
    })
  )
  @Patch('/photo')
  async setNewPhoto(@UploadedFile() newPhoto, @Body() { email }: { email: string }) {
    try {
      const user = await this.userService.findOneUserByEmail(email);
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

  @UseGuards(JwtGuard)
  @Patch('/update-bio')
  async setNewBio(@Body() { userId, newBio }: { userId: string; newBio: string }) {
    try {
      const bio = await this.userService.changeBio(userId, newBio);
      return bio;
    } catch (e) {
      console.log(e);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: e.response.error
        },
        HttpStatus.BAD_REQUEST,
        { cause: e }
      );
    }
  }


  @UseGuards(JwtGuard)
  @Patch('/update-name')
  async setNewName(@Body() { userId, newName }: { userId: string; newName: string }) {
    try {
      const name = await this.userService.changeName(userId, newName);
      return name;
    } catch (e) {
      console.log(e);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: e.response.error
        },
        HttpStatus.BAD_REQUEST,
        { cause: e }
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get()
  async getUsersByEmailOrName(@Query('email') email: string, @Query('name') name: string) {
    try {
      const results = await this.userService.searchForUsers(email, name);

      return results;
    } catch (e) {
      console.log(e);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: e.response.error
        },
        HttpStatus.BAD_REQUEST,
        { cause: e }
      );
    }
  }
}
