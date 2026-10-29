import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class WorkingHourItemDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'openTime must be in HH:mm 24-hour format (e.g. 08:30)',
  })
  openTime: string;

  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'closeTime must be in HH:mm 24-hour format (e.g. 20:00)',
  })
  closeTime: string;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean = false;
}

export class SetWorkingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourItemDto)
  schedules: WorkingHourItemDto[];
}
