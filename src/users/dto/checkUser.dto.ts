import { IsNotEmpty } from 'class-validator';


export class CheckUserDto {

  @IsNotEmpty()
  readonly receiverEmail: string;

  @IsNotEmpty()
  readonly senderId: string;
}