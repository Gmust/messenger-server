import { IsNotEmpty } from 'class-validator';


export class AddFriendDto {

  @IsNotEmpty()
  readonly receiverId: string;

  @IsNotEmpty()
  readonly senderId: string;
}