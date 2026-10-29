import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+251[79]\d{8}$/, {
    message: 'phoneNumber must be a valid Ethiopian E.164 phone number (e.g., +251912345678 or +251712345678)',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address format' })
  email?: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'role must be one of: CUSTOMER, SALON_OWNER, STAFF',
  })
  role?: UserRole;
}
