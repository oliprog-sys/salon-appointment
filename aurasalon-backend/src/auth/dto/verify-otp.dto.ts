import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { UserRole } from '@prisma/client';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+251[79]\d{8}$/, {
    message: 'phoneNumber must be a valid Ethiopian E.164 phone number (e.g., +251912345678 or +251712345678)',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'otp must be a 6-digit numeric string',
  })
  otp: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'role must be one of: CUSTOMER, SALON_OWNER, STAFF',
  })
  role?: UserRole;
}
