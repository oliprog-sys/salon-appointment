import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { PaymentService } from './payment.service';

type MockAppointmentDelegate = {
  findUnique: jest.Mock;
  update: jest.Mock;
};

type MockPaymentDelegate = {
  findUnique: jest.Mock;
  upsert: jest.Mock;
  update: jest.Mock;
};

type MockWebhookLogDelegate = {
  create: jest.Mock;
};

type MockPrismaService = {
  appointment: MockAppointmentDelegate;
  payment: MockPaymentDelegate;
  paymentWebhookLog: MockWebhookLogDelegate;
  $transaction: jest.Mock;
};

type MockRedisService = {
  del: jest.Mock;
};

type MockNotificationService = {
  notifyAppointmentConfirmed: jest.Mock;
};

describe('PaymentService', () => {
  let service: PaymentService;
  let mockPrisma: MockPrismaService;
  let mockRedis: MockRedisService;
  let mockConfigService: Partial<ConfigService>;
  let mockNotificationService: MockNotificationService;

  const mockAppointment = {
    id: 'appt-1',
    customerId: 'cust-1',
    status: AppointmentStatus.PENDING,
    totalPriceETB: 450,
    startTime: new Date('2026-10-02T10:00:00Z'),
  };

  const mockPayment = {
    id: 'pay-1',
    appointmentId: 'appt-1',
    method: PaymentMethod.CHAPA,
    status: PaymentStatus.PENDING,
    amountETB: 450,
    providerTxnRef: 'TXN-CHAPA-123',
    appointment: mockAppointment,
  };

  beforeEach(async () => {
    mockPrisma = {
      appointment: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      paymentWebhookLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
      $transaction: jest.fn((cb) => (typeof cb === 'function' ? cb(mockPrisma) : Promise.all(cb))),
    };

    mockRedis = {
      del: jest.fn().mockResolvedValue(undefined),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    mockNotificationService = {
      notifyAppointmentConfirmed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializePayment', () => {
    it('should initialize payment and return checkout URL', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      mockPrisma.payment.upsert.mockResolvedValue(mockPayment);

      const result = await service.initializePayment('cust-1', {
        appointmentId: 'appt-1',
        method: PaymentMethod.CHAPA,
      });

      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.checkoutUrl).toContain('mock-pay');
    });
  });

  describe('simulateMockPayment', () => {
    it('should process mock payment as SUCCESSFUL and confirm appointment', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await service.simulateMockPayment({
        providerTxnRef: 'TXN-CHAPA-123',
        status: PaymentStatus.SUCCESSFUL,
      });

      expect(result.appointmentStatus).toBe(AppointmentStatus.CONFIRMED);
      expect(mockPrisma.payment.update).toHaveBeenCalled();
      expect(mockPrisma.appointment.update).toHaveBeenCalled();
    });
  });
});
