import { IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty()
  readonly email: string;
  @IsNotEmpty()
  readonly refresh_token: string;
}
