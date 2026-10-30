import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyProductAiDto {
  @ApiProperty({
    description: 'Base64 encoded image of the product for visual packaging inspection',
    example: 'data:image/jpeg;base64,...',
  })
  @IsString()
  @IsNotEmpty()
  imageBase64!: string;

  @ApiPropertyOptional({ description: 'Optional location context', example: 'Lagos, Nigeria' })
  @IsOptional()
  @IsString()
  location?: string;
}

export class ScanProductDto {
  @ApiProperty({
    description: 'Public serial identifier from QR code (e.g. KW1A2B3C4D5E)',
    example: 'KW1A2B3C4D5E',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({
    description: 'Single-use scratch-off PIN revealed by the consumer',
    example: '849201',
  })
  @IsOptional()
  @IsString()
  scratchPin?: string;

  @ApiPropertyOptional({ description: 'User IP address (client-side override if behind proxy)' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User Agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
