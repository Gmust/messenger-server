import { IsNotEmpty } from 'class-validator';


export class ForgotPasswordDto {
  @IsNotEmpty()
  readonly userEmail: string;


}