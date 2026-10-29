import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateStaffDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+251[79]\d{8}$/, {
    message: 'phoneNumber must be a valid Ethiopian E.164 phone number (e.g. +251912345678)',
  })
  phoneNumber?: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
