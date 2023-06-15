import { IsNotEmpty } from 'class-validator'

export class RefreshTokenDto {
  @IsNotEmpty()
  readonly username: string;
  @IsNotEmpty()
  readonly refresh_token: string;
}