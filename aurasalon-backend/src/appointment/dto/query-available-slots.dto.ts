import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class QueryAvailableSlotsDto {
  @IsNotEmpty()
  @IsString()
  salonId: string;

  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format (e.g. 2026-10-02)',
  })
  date: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one serviceId must be provided' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return value;
  })
  serviceIds: string[];

  @IsOptional()
  @IsString()
  staffId?: string;
}
