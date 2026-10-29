import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SalonStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalonApprovedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: Authentication required');
    }

    // Super Admin bypasses approval check
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check payload salonStatus first if available
    let status: SalonStatus | undefined = user.salonStatus;
    let salonId: string | undefined = user.salonId;

    if (!status || !salonId) {
      // Query owned or staff salon status from DB
      if (user.role === UserRole.SALON_OWNER) {
        const salon = await this.prisma.salon.findFirst({
          where: { ownerId: user.id },
          select: { id: true, status: true },
        });
        if (salon) {
          status = salon.status;
          salonId = salon.id;
        }
      } else if (user.role === UserRole.STAFF || user.role === UserRole.SALON_STAFF) {
        const staff = await this.prisma.staffProfile.findUnique({
          where: { userId: user.id },
          include: { salon: { select: { id: true, status: true } } },
        });
        if (staff?.salon) {
          status = staff.salon.status;
          salonId = staff.salon.id;
        }
      }
    }

    if (!status || status !== SalonStatus.APPROVED) {
      throw new ForbiddenException(
        `Access denied: Protected vendor routes require an APPROVED salon status. Current status: [${status || 'NO_SALON'}]`,
      );
    }

    // Attach verified salon details to request
    request.salonId = salonId;
    request.salonStatus = status;

    return true;
  }
}
