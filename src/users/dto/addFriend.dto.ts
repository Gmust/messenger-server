import { IsNotEmpty } from 'class-validator';
import { User } from '../../schemas/user.schema';


export class AddFriendDto {

  @IsNotEmpty()
  readonly receiver: User;

  @IsNotEmpty()
  readonly sender: User;
}