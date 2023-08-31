import { IsEmail, IsNotEmpty, IsUrl } from 'class-validator';

export class SentResetUrlDto {
  @IsNotEmpty()
  @IsEmail()
  emailTo: string;

  @IsNotEmpty()
  @IsEmail()
  emailFrom: string;

  @IsNotEmpty()
  subject: string;

  @IsNotEmpty()
  text: string;

  @IsNotEmpty()
  html: string;

  @IsNotEmpty()
  @IsUrl()
  url: string;
}
