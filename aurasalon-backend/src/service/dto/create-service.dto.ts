import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty()
  @IsString()
  salonId: string;

  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(5, { message: 'Service duration must be at least 5 minutes' })
  @Max(720, { message: 'Service duration cannot exceed 12 hours (720 minutes)' })
  durationMin: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Price must be a non-negative number' })
  priceETB: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  staffIds?: string[];
}
