import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({
    example: 'Augmentin 625mg',
    description: 'Name of the suspected counterfeit product',
  })
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @ApiPropertyOptional({
    example: 'GSK',
    description: 'Brand or manufacturer name if visible on packaging',
  })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiProperty({
    example:
      'Chalky texture, unusual spelling on the foil blister pack, no seal.',
    description: 'Detailed description of the defect or suspicion',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    example: 'Open market pharmacy, Idumota, Lagos',
    description: 'Physical store, vendor name, or street market location',
  })
  @IsOptional()
  @IsString()
  purchaseLocation?: string;

  @ApiPropertyOptional({
    description: 'Public serial code from the item if visible',
    example: 'KW9F2A1C',
  })
  @IsOptional()
  @IsString()
  publicSerial?: string;
}
