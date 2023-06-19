import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AddFriendDto } from './dto/addFriend.dto';

@Controller('users')
export class UsersController {

  constructor(private userService: UsersService) {
  }

  @UseGuards(JwtGuard)
  @Post('/add')
  async sentFriendRequest(
    @Body() addFriendDto: AddFriendDto
  ) {

    await this.userService.checkUserInFriends(addFriendDto.receiverId, addFriendDto.senderId);

    await this.userService.addFriend(addFriendDto);

    return {
      Msg: 'Friend request sent!'
    };
  }

  @UseGuards(JwtGuard)
  @Get('friend-requests')
  async getFriendRequests(
    @Body() body
  ) {
    const friendRequests = await this.userService.getAllFriendsRequests(body.userId);
    return friendRequests;
  }

  @UseGuards(JwtGuard)
  @Post('/accept-friend')
  async acceptFriend(
    @Body() body: AddFriendDto
  ) {
    await this.userService.checkUserInFriends(body.receiverId, body.senderId);
    await this.userService.acceptFriend(body.senderId, body.receiverId);
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
}

