import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production Factory Scanner', description: 'Friendly name for the API key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
