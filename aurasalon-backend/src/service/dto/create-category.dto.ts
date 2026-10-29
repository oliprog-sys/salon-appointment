import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  salonId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
