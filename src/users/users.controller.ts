import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
    await this.userService.getAllFriendsRequests(body.userId);
    return;
  }
}

