import { IsEmail, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterBrandDto {
  @ApiProperty({ example: 'admin@acmepharma.com', description: 'Brand representative work email' })
  @IsEmail({}, { message: 'Please provide a valid business email address' })
  email!: string;

  @ApiProperty({ example: 'SecureP@ss1234!', description: 'Password (minimum 8 characters)' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'Chidi', description: 'First name' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Eze', description: 'Last name' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'Acme Pharmaceuticals Ltd', description: 'Official registered company name' })
  @IsString()
  @MinLength(2, { message: 'Company name must be at least 2 characters' })
  companyName!: string;

  @ApiPropertyOptional({ example: 'RC-1234567', description: 'Corporate Affairs Commission (CAC) / business registration number' })
  @IsOptional()
  @IsString()
  registrationNum?: string;

  @ApiPropertyOptional({ example: '+2348098765432', description: 'Company official phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://acmepharma.com', description: 'Company official website' })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid website URL' })
  websiteUrl?: string;
}
