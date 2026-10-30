import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CampaignPrizeDto {
  @ApiProperty({ example: 'Grand Prize' })
  @IsString()
  @IsNotEmpty()
  tierName!: string;

  @ApiProperty({ example: 'iPhone 15', required: false })
  @IsOptional()
  @IsString()
  prizeDescription?: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @IsOptional()
  prizeValue?: number;

  @ApiProperty({ example: 0.01 })
  @IsNumber()
  @IsNotEmpty()
  winProbability!: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @IsNotEmpty()
  maxWinners!: number;
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Promo 2026' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'instant_win' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: '2026-06-01T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-08-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsOptional()
  totalBudget?: number;

  @ApiProperty({ type: [CampaignPrizeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignPrizeDto)
  prizes!: CampaignPrizeDto[];
}
