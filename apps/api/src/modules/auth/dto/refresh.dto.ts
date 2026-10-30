import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Refresh token string if not transmitted via HttpOnly cookie',
    example: 'd9f8e4b7c2a1...',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
