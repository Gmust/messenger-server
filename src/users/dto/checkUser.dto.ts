import { IsNotEmpty } from 'class-validator';


export class CheckUserDto {

  @IsNotEmpty()
  readonly receiverId: string;

  @IsNotEmpty()
  readonly senderId: string;
}