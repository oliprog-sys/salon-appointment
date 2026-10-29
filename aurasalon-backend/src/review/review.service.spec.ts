import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewService } from './review.service';

type MockAppointmentDelegate = {
  findUnique: jest.Mock;
};

type MockReviewDelegate = {
  create: jest.Mock;
  findUnique: jest.Mock;
  findMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
  delete: jest.Mock;
};

type MockSalonDelegate = {
  findUnique: jest.Mock;
};

type MockStaffProfileDelegate = {
  findUnique: jest.Mock;
};

type MockPrismaService = {
  appointment: MockAppointmentDelegate;
  review: MockReviewDelegate;
  salon: MockSalonDelegate;
  staffProfile: MockStaffProfileDelegate;
};

describe('ReviewService', () => {
  let service: ReviewService;
  let mockPrisma: MockPrismaService;

  const mockAppointmentCompleted = {
    id: 'appt-1',
    customerId: 'cust-1',
    status: AppointmentStatus.COMPLETED,
    salonId: 'salon-1',
    staffId: 'staff-1',
  };

  const mockReview = {
    id: 'rev-1',
    appointmentId: 'appt-1',
    customerId: 'cust-1',
    rating: 5,
    comment: 'Great hair braiding service!',
    tipAmountETB: 50,
  };

  beforeEach(async () => {
    mockPrisma = {
      appointment: { findUnique: jest.fn() },
      review: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        delete: jest.fn(),
      },
      salon: { findUnique: jest.fn() },
      staffProfile: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReview', () => {
    it('should create review for completed appointment', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointmentCompleted);
      mockPrisma.review.findUnique.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(mockReview);

      const result = await service.createReview('cust-1', {
        appointmentId: 'appt-1',
        rating: 5,
        comment: 'Great hair braiding service!',
      });

      expect(result.rating).toBe(5);
      expect(mockPrisma.review.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if appointment is not completed', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...mockAppointmentCompleted,
        status: AppointmentStatus.PENDING,
      });

      await expect(
        service.createReview('cust-1', { appointmentId: 'appt-1', rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not the customer', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointmentCompleted);

      await expect(
        service.createReview('other-cust', { appointmentId: 'appt-1', rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getSalonMetrics', () => {
    it('should return aggregated rating metrics for a salon', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue({ id: 'salon-1', name: 'Aura Salon' });
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.8 },
        _count: { id: 10 },
      });
      mockPrisma.review.findMany.mockResolvedValue([{ rating: 5 }, { rating: 4 }, { rating: 5 }]);

      const result = await service.getSalonMetrics('salon-1');
      expect(result.averageRating).toBe(4.8);
      expect(result.totalReviews).toBe(10);
      expect(result.ratingBreakdown[5]).toBe(2);
    });
  });
});
