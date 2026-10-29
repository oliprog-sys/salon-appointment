import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

type MockUserDelegate = {
  findUnique: jest.Mock;
  update: jest.Mock;
};

type MockNotificationDelegate = {
  create: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  count: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
};

type MockPrismaService = {
  user: MockUserDelegate;
  notification: MockNotificationDelegate;
};

describe('NotificationService', () => {
  let service: NotificationService;
  let mockPrisma: MockPrismaService;

  const mockUser = {
    id: 'user-1',
    phoneNumber: '+251912345678',
    fcmToken: 'fcm-token-123',
  };

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Booking Confirmed!',
    body: 'Your appointment is confirmed.',
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerFcmToken', () => {
    it('should update user fcmToken', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);
      const res = await service.registerFcmToken('user-1', { fcmToken: 'fcm-token-123' });
      expect(res.message).toBe('FCM push token registered successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { fcmToken: 'fcm-token-123' },
      });
    });
  });

  describe('findUserNotifications', () => {
    it('should return paginated user notifications', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const res = await service.findUserNotifications('user-1', { page: 1, limit: 10 });
      expect(res.data).toHaveLength(1);
      expect(res.unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockResolvedValue({ ...mockNotification, isRead: true });

      const res = await service.markAsRead('user-1', 'notif-1');
      expect(res.isRead).toBe(true);
    });

    it('should throw ForbiddenException if notification belongs to another user', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);
      await expect(service.markAsRead('other-user', 'notif-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('notifyAppointmentConfirmed', () => {
    it('should create in-app notification record and dispatch logs', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      await service.notifyAppointmentConfirmed({
        id: 'appt-1',
        bookingCode: 'AUR-X79B',
        customerId: 'user-1',
        customer: mockUser,
      });

      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });
  });
});
