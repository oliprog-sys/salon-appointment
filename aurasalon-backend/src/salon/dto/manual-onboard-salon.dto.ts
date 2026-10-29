import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ManualOnboardSalonDto {
  @IsNotEmpty()
  @IsString()
  ownerFullName: string;

  @IsNotEmpty()
  @IsString()
  ownerPhoneNumber: string;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @IsNotEmpty()
  @IsString()
  salonName: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  subCity: string;

  @IsOptional()
  @IsString()
  tradeLicenseUrl?: string;

  @IsOptional()
  @IsString()
  tinNumber?: string;
}
