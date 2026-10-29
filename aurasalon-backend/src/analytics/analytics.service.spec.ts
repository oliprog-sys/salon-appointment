import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRange } from './dto/query-analytics.dto';

type MockSalonDelegate = {
  findUnique: jest.Mock;
  count: jest.Mock;
};

type MockAppointmentDelegate = {
  aggregate: jest.Mock;
  findMany: jest.Mock;
};

type MockUserDelegate = {
  groupBy: jest.Mock;
};

type MockPrismaService = {
  salon: MockSalonDelegate;
  appointment: MockAppointmentDelegate;
  user: MockUserDelegate;
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockPrisma: MockPrismaService;

  const mockSalon = {
    id: 'salon-1',
    ownerId: 'owner-1',
    name: 'Aura Salon Bole',
  };

  beforeEach(async () => {
    mockPrisma = {
      salon: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      appointment: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSalonAnalytics', () => {
    it('should return salon revenue and completed appointment metrics', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(mockSalon);
      mockPrisma.appointment.aggregate.mockResolvedValue({
        _sum: { totalPriceETB: 4500, subtotalETB: 4500, serviceFeeETB: 0 },
        _count: { id: 10 },
      });
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          startTime: new Date('2026-10-01T10:00:00Z'),
          services: [{ serviceId: 'svc-1', priceAtBooking: 450, service: { name: 'Box Braids' } }],
        },
      ]);

      const result = await service.getSalonAnalytics('salon-1', { id: 'owner-1', role: UserRole.SALON_OWNER }, { range: AnalyticsRange.MONTHLY });
      expect(result.summary.totalRevenueETB).toBe(4500);
      expect(result.summary.completedAppointmentsCount).toBe(10);
      expect(result.topServices).toHaveLength(1);
    });

    it('should throw ForbiddenException if non-owner user requests salon analytics', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(mockSalon);
      await expect(
        service.getSalonAnalytics('salon-1', { id: 'other-user', role: UserRole.SALON_OWNER }, {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if salon does not exist', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(null);
      await expect(
        service.getSalonAnalytics('non-existent', { id: 'admin-1', role: UserRole.SUPER_ADMIN }, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAdminOverviewAnalytics', () => {
    it('should return platform GMV and active salon metrics', async () => {
      mockPrisma.appointment.aggregate.mockResolvedValue({
        _sum: { totalPriceETB: 150000, subtotalETB: 142500, serviceFeeETB: 7500 },
        _count: { id: 300 },
      });
      mockPrisma.salon.count.mockResolvedValue(25);
      mockPrisma.user.groupBy.mockResolvedValue([
        { role: UserRole.CUSTOMER, _count: { id: 500 } },
        { role: UserRole.SALON_OWNER, _count: { id: 25 } },
      ]);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getAdminOverviewAnalytics({ range: AnalyticsRange.MONTHLY });
      expect(result.financialOverview.gmvETB).toBe(150000);
      expect(result.financialOverview.platformServiceFeesETB).toBe(7500);
      expect(result.salonMetrics.activeSalonsCount).toBe(25);
    });
  });
});
