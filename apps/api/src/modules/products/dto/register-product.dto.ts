import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterProductDto {
  @ApiProperty({ example: 'PRD-123', required: false })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ example: 'Premium Paracetamol' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'BATCH-2026-A' })
  @IsString()
  @IsNotEmpty()
  batchNumber!: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  batchSize!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
