import { IsEnum, IsOptional, Matches } from 'class-validator';

export enum AnalyticsRange {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export class QueryAnalyticsDto {
  @IsOptional()
  @IsEnum(AnalyticsRange, {
    message: 'range must be one of: daily, weekly, monthly, custom',
  })
  range?: AnalyticsRange = AnalyticsRange.MONTHLY;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  startDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  endDate?: string;
}
