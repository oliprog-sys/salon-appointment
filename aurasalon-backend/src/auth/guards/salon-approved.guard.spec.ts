import { ForbiddenException } from '@nestjs/common';
import { SalonStatus, UserRole } from '@prisma/client';
import { SalonApprovedGuard } from './salon-approved.guard';

describe('SalonApprovedGuard', () => {
  let guard: SalonApprovedGuard;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      salon: {
        findFirst: jest.fn(),
      },
      staffProfile: {
        findUnique: jest.fn(),
      },
    };
    guard = new SalonApprovedGuard(mockPrismaService);
  });

  it('should allow SUPER_ADMIN role unconditionally', async () => {
    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'admin-1', role: UserRole.SUPER_ADMIN },
        }),
      }),
    };

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should allow SALON_OWNER if salonStatus is APPROVED in payload', async () => {
    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'owner-1',
            role: UserRole.SALON_OWNER,
            salonId: 'salon-123',
            salonStatus: SalonStatus.APPROVED,
          },
        }),
      }),
    };

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if SALON_OWNER salon status is PENDING_REVIEW', async () => {
    mockPrismaService.salon.findFirst.mockResolvedValue({
      id: 'salon-123',
      status: SalonStatus.PENDING_REVIEW,
    });

    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'owner-1', role: UserRole.SALON_OWNER },
        }),
      }),
    };

    await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
  });
});
