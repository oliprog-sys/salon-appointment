import { ArrayMinSize, IsArray, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
  @IsNumber()
  @Min(0)
  discountETB?: number;

  @IsOptional()
  @IsString()
  appliedPromoCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}
