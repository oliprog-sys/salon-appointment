import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  dutyStatus?: string; // 'ON_SHIFT' | 'ON_BREAK' | 'OFF_DUTY'

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
