import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class PartnerRegisterDto {
  @IsNotEmpty()
  @IsString()
  ownerFullName: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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

  @IsOptional()
  @IsString()
  kebeleIdUrl?: string;

  @IsOptional()
  @IsString()
  payoutBank?: string;

  @IsOptional()
  @IsString()
  payoutAccount?: string;
}
