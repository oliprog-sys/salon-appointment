import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { SalonStatus } from '@prisma/client';

export class UpdateSalonDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  subCity?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsUrl({}, { message: 'coverImageUrl must be a valid URL' })
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  tradeLicenseUrl?: string;

  @IsOptional()
  @IsString()
  tinNumber?: string;

  @IsOptional()
  @IsString()
  kebeleIdUrl?: string;

  @IsOptional()
  @IsString()
  payoutBank?: string;

  @IsOptional()
  @IsString()
  payoutAccount?: string;

  @IsOptional()
  @IsEnum(SalonStatus)
  status?: SalonStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
