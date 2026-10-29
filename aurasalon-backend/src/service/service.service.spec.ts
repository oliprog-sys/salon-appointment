import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceService } from './service.service';

type MockCategoryDelegate = {
  create: jest.Mock;
  findMany: jest.Mock;
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

type MockServiceDelegate = {
  create: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
};

type MockSalonDelegate = {
  findUnique: jest.Mock;
};

type MockPrismaService = {
  category: MockCategoryDelegate;
  service: MockServiceDelegate;
  salon: MockSalonDelegate;
};

describe('ServiceService', () => {
  let service: ServiceService;
  let mockPrisma: MockPrismaService;

  const mockSalon = {
    id: 'salon-1',
    ownerId: 'owner-1',
    name: 'Aura Salon',
  };

  const mockCategory = {
    id: 'cat-1',
    salonId: 'salon-1',
    name: 'Haircut & Styling',
    sortOrder: 1,
    services: [],
  };

  beforeEach(async () => {
    mockPrisma = {
      category: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      service: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      salon: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    it('should create category if user is salon owner', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(mockSalon);
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const result = await service.createCategory(
        { id: 'owner-1', role: UserRole.SALON_OWNER },
        { salonId: 'salon-1', name: 'Haircut & Styling' },
      );

      expect(result.name).toBe('Haircut & Styling');
      expect(mockPrisma.category.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not salon owner', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(mockSalon);

      await expect(
        service.createCategory(
          { id: 'other-user', role: UserRole.SALON_OWNER },
          { salonId: 'salon-1', name: 'Haircut & Styling' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findCategoriesBySalon', () => {
    it('should return categories for salon', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(mockSalon);
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findCategoriesBySalon('salon-1');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if salon does not exist', async () => {
      mockPrisma.salon.findUnique.mockResolvedValue(null);
      await expect(service.findCategoriesBySalon('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
