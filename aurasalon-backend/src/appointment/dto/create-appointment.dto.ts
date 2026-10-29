import { ArrayMinSize, IsArray, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  salonId: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one serviceId must be selected for booking' })
  @IsString({ each: true })
  serviceIds: string[];

  @IsOptional()
  @IsString()
  staffId?: string;

  @IsNotEmpty()
  @IsISO8601({}, { message: 'startTime must be a valid ISO 8601 date string' })
  startTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
