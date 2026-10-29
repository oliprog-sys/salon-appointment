import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('salon/:salonId')
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  async getSalonAnalytics(
    @Param('salonId') salonId: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getSalonAnalytics(salonId, user, query);
  }

  @Get('admin/overview')
  @Roles(UserRole.SUPER_ADMIN)
  async getAdminOverviewAnalytics(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getAdminOverviewAnalytics(query);
  }
}
