import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsRange, QueryAnalyticsDto } from './dto/query-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalonAnalytics(
    salonId: string,
    user: { id: string; role: UserRole },
    query: QueryAnalyticsDto,
  ): Promise<any> {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    if (user.role !== UserRole.SUPER_ADMIN && salon.ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to view analytics for this salon');
    }

    const { startDate, endDate } = this.parseDateRange(query);

    const whereCompleted = {
      salonId,
      status: AppointmentStatus.COMPLETED,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [aggregate, completedAppointments] = await Promise.all([
      this.prisma.appointment.aggregate({
        where: whereCompleted,
        _sum: {
          totalPriceETB: true,
          subtotalETB: true,
          serviceFeeETB: true,
        },
        _count: {
          id: true,
        },
      }),
      this.prisma.appointment.findMany({
        where: whereCompleted,
        include: {
          services: {
            include: {
              service: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
    ]);

    const totalRevenueETB = aggregate._sum.totalPriceETB ? Number(aggregate._sum.totalPriceETB) : 0;
    const completedAppointmentsCount = aggregate._count.id;

    // Aggregating Top Services
    const serviceStatsMap = new Map<string, { serviceId: string; name: string; bookingsCount: number; revenueETB: number }>();

    completedAppointments.forEach((appt) => {
      appt.services.forEach((item) => {
        const key = item.serviceId;
        const price = Number(item.priceAtBooking);
        const existing = serviceStatsMap.get(key) || {
          serviceId: key,
          name: item.service?.name || 'Unknown Service',
          bookingsCount: 0,
          revenueETB: 0,
        };
        existing.bookingsCount += 1;
        existing.revenueETB += price;
        serviceStatsMap.set(key, existing);
      });
    });

    const topServices = Array.from(serviceStatsMap.values())
      .sort((a, b) => b.bookingsCount - a.bookingsCount)
      .slice(0, 5);

    // Aggregating Peak Booking Hours (00:00 to 23:00)
    const hourlyDistribution: Record<string, number> = {};
    for (let h = 0; h < 24; h++) {
      const hourStr = String(h).padStart(2, '0') + ':00';
      hourlyDistribution[hourStr] = 0;
    }

    completedAppointments.forEach((appt) => {
      const hour = new Date(appt.startTime).getUTCHours();
      const hourStr = String(hour).padStart(2, '0') + ':00';
      if (hourlyDistribution[hourStr] !== undefined) {
        hourlyDistribution[hourStr] += 1;
      }
    });

    return {
      salonId,
      salonName: salon.name,
      dateRange: {
        range: query.range || AnalyticsRange.MONTHLY,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalRevenueETB,
        completedAppointmentsCount,
      },
      topServices,
      peakBookingHours: hourlyDistribution,
    };
  }

  async getAdminOverviewAnalytics(query: QueryAnalyticsDto): Promise<any> {
    const { startDate, endDate } = this.parseDateRange(query);

    const whereCompleted = {
      status: AppointmentStatus.COMPLETED,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [
      gmvAggregate,
      activeSalonsCount,
      totalSalonsCount,
      usersGrouped,
      completedAppointments,
    ] = await Promise.all([
      this.prisma.appointment.aggregate({
        where: whereCompleted,
        _sum: {
          totalPriceETB: true,
          subtotalETB: true,
          serviceFeeETB: true,
        },
        _count: {
          id: true,
        },
      }),
      this.prisma.salon.count({ where: { isActive: true } }),
      this.prisma.salon.count(),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      this.prisma.appointment.findMany({
        where: whereCompleted,
        select: {
          salonId: true,
          totalPriceETB: true,
          salon: { select: { id: true, name: true, subCity: true } },
        },
      }),
    ]);

    const gmvETB = gmvAggregate._sum.totalPriceETB ? Number(gmvAggregate._sum.totalPriceETB) : 0;
    const salonEarningsETB = gmvAggregate._sum.subtotalETB ? Number(gmvAggregate._sum.subtotalETB) : 0;
    const platformServiceFeesETB = gmvAggregate._sum.serviceFeeETB ? Number(gmvAggregate._sum.serviceFeeETB) : 0;
    const completedAppointmentsCount = gmvAggregate._count.id;

    // User Role Breakdown
    const userRoleBreakdown: Record<string, number> = {
      CUSTOMER: 0,
      SALON_OWNER: 0,
      STAFF: 0,
      SUPER_ADMIN: 0,
    };

    usersGrouped.forEach((group) => {
      userRoleBreakdown[group.role] = group._count.id;
    });

    // Top Performing Salons
    const salonStatsMap = new Map<string, { salonId: string; name: string; subCity: string; revenueETB: number; bookingsCount: number }>();

    completedAppointments.forEach((appt) => {
      const key = appt.salonId;
      const price = Number(appt.totalPriceETB);
      const existing = salonStatsMap.get(key) || {
        salonId: key,
        name: appt.salon?.name || 'Unknown Salon',
        subCity: appt.salon?.subCity || 'Addis Ababa',
        revenueETB: 0,
        bookingsCount: 0,
      };
      existing.revenueETB += price;
      existing.bookingsCount += 1;
      salonStatsMap.set(key, existing);
    });

    const topSalons = Array.from(salonStatsMap.values())
      .sort((a, b) => b.revenueETB - a.revenueETB)
      .slice(0, 5);

    return {
      dateRange: {
        range: query.range || AnalyticsRange.MONTHLY,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      financialOverview: {
        gmvETB,
        salonEarningsETB,
        platformServiceFeesETB,
        completedAppointmentsCount,
      },
      salonMetrics: {
        activeSalonsCount,
        totalSalonsCount,
      },
      userMetrics: {
        totalUsers: Object.values(userRoleBreakdown).reduce((a, b) => a + b, 0),
        roleBreakdown: userRoleBreakdown,
      },
      topPerformingSalons: topSalons,
    };
  }

  private parseDateRange(query: QueryAnalyticsDto): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    if (query.range === AnalyticsRange.DAILY) {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    } else if (query.range === AnalyticsRange.WEEKLY) {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(0, 0, 0, 0);
    } else if (query.range === AnalyticsRange.CUSTOM && query.startDate && query.endDate) {
      const [startYear, startMonth, startDay] = query.startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = query.endDate.split('-').map(Number);
      startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));
    } else {
      // Default MONTHLY: Last 30 days
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }
}
