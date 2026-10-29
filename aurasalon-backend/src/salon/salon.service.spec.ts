import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SalonService } from './salon.service';

type MockSalonDelegate = {
  create: jest.Mock;
  findMany: jest.Mock;
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  count: jest.Mock;
};

type MockWorkingHoursDelegate = {
  upsert: jest.Mock;
  findMany: jest.Mock;
};

type MockStaffProfileDelegate = {
  create: jest.Mock;
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
};

type MockUserDelegate = {
  findUnique: jest.Mock;
  update: jest.Mock;
};

type MockPrismaService = {
  salon: MockSalonDelegate;
  workingHours: MockWorkingHoursDelegate;
  staffProfile: MockStaffProfileDelegate;
  user: MockUserDelegate;
};

describe('SalonService', () => {
  let service: SalonService;
  let mockPrisma: MockPrismaService;

  const mockSalon = {
    id: 'salon-1',
    ownerId: 'owner-1',
    name: 'Aura Beauty Bole',
    slug: 'aura-beauty-bole',
    address: 'Bole Road',
    subCity: 'Bole',
    city: 'Addis Ababa',
    isActive: true,
    isFeatured: false,
    workingHours: [],
    staff: [],
  };

  beforeEach(async () => {
    mockPrisma = {
      salon: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      workingHours: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      staffProfile: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalonService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SalonService>(SalonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSalon', () => {
    it('should create salon and generate unique slug', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(null);
      mockPrisma.salon.create.mockResolvedValue(mockSalon);

      const result = await service.createSalon('owner-1', {
        name: 'Aura Beauty Bole',
        address: 'Bole Road',
        subCity: 'Bole',
      });

      expect(result.slug).toBe('aura-beauty-bole');
      expect(mockPrisma.salon.create).toHaveBeenCalled();
    });
  });

  describe('findAllSalons', () => {
    it('should query salons with sub-city filter and return paginated meta', async () => {
      mockPrisma.salon.findMany.mockResolvedValue([mockSalon]);
      mockPrisma.salon.count.mockResolvedValue(1);

      const result = await service.findAllSalons({ subCity: 'Bole', page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findSalonByIdOrSlug', () => {
    it('should return salon if found', async () => {
      mockPrisma.salon.findFirst.mockResolvedValue(mockSalon);
      const result = await service.findSalonByIdOrSlug('aura-beauty-bole');
      expect(result.id).toBe('salon-1');
    });

    it('should throw NotFoundException if salon not found', async () => {
      mockPrisma.salon.findFirst.mockResolvedValue(null);
      await expect(service.findSalonByIdOrSlug('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSalon', () => {
    it('should throw ForbiddenException if user is not owner or super admin', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(mockSalon);
      await expect(
        service.updateSalon('salon-1', { id: 'other-user', role: UserRole.SALON_OWNER }, { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
