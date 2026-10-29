import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SalonStatus } from '@prisma/client';

export class VerifySalonDto {
  @IsNotEmpty()
  @IsEnum(SalonStatus)
  status: SalonStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
