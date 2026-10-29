import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+251[79]\d{8}$/, {
    message: 'phoneNumber must be a valid Ethiopian E.164 phone number (e.g., +251912345678 or +251712345678)',
  })
  phoneNumber: string;
}
