import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { AppointmentService } from './appointment.service';

type MockSalonDelegate = {
  findUnique: jest.Mock;
};

type MockServiceDelegate = {
  findMany: jest.Mock;
};

type MockStaffProfileDelegate = {
  findFirst: jest.Mock;
};

type MockAppointmentDelegate = {
  findMany: jest.Mock;
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  count: jest.Mock;
  update: jest.Mock;
};

type MockPrismaService = {
  salon: MockSalonDelegate;
  service: MockServiceDelegate;
  staffProfile: MockStaffProfileDelegate;
  appointment: MockAppointmentDelegate;
  $transaction: jest.Mock;
};

type MockRedisService = {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
};

type MockNotificationService = {
  notifyAppointmentBooked: jest.Mock;
  notifyAppointmentConfirmed: jest.Mock;
  notifyAppointmentCancelled: jest.Mock;
  notifyAppointmentCompleted: jest.Mock;
};

describe('AppointmentService', () => {
  let service: AppointmentService;
  let mockPrisma: MockPrismaService;
  let mockRedis: MockRedisService;
  let mockNotificationService: MockNotificationService;

  const mockSalon = {
    id: 'salon-1',
    name: 'Aura Salon',
    isActive: true,
    workingHours: [
      { dayOfWeek: 5, openTime: '08:00', closeTime: '20:00', isClosed: false },
    ],
  };

  const mockServiceItem = {
    id: 'service-1',
    salonId: 'salon-1',
    name: 'Box Braids',
    durationMin: 60,
    priceETB: 500,
    isActive: true,
  };

  beforeEach(async () => {
    mockPrisma = {
      salon: { findUnique: jest.fn() },
      service: { findMany: jest.fn() },
      staffProfile: { findFirst: jest.fn() },
      appointment: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    mockNotificationService = {
      notifyAppointmentBooked: jest.fn().mockResolvedValue(undefined),
      notifyAppointmentConfirmed: jest.fn().mockResolvedValue(undefined),
      notifyAppointmentCancelled: jest.fn().mockResolvedValue(undefined),
      notifyAppointmentCompleted: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableSlots', () => {
    it('should return calculated available slots for open working hours', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(mockSalon);
      mockPrisma.service.findMany.mockResolvedValue([mockServiceItem]);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots({
        salonId: 'salon-1',
        date: '2026-10-02', // 2026-10-02 is a Friday (dayOfWeek 5)
        serviceIds: ['service-1'],
      });

      expect(result.availableSlots.length).toBeGreaterThan(0);
      expect(result.totalDurationMin).toBe(60);
    });
  });

  describe('createAppointment', () => {
    it('should throw ConflictException if time slot is locked in Redis', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(mockSalon);
      mockPrisma.service.findMany.mockResolvedValue([mockServiceItem]);
      mockRedis.get.mockResolvedValue('another-customer');

      const futureDate = new Date(Date.now() + 86400000).toISOString();

      await expect(
        service.createAppointment('cust-1', {
          salonId: 'salon-1',
          serviceIds: ['service-1'],
          startTime: futureDate,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
