import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SalonStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ManualOnboardSalonDto } from './dto/manual-onboard-salon.dto';
import { QuerySalonDto } from './dto/query-salon.dto';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { VerifySalonDto } from './dto/verify-salon.dto';

@Injectable()
export class SalonService {
  constructor(private readonly prisma: PrismaService) {}

  async createSalon(ownerId: string, dto: CreateSalonDto): Promise<any> {
    const slug = await this.generateUniqueSlug(dto.name);

    return this.prisma.salon.create({
      data: {
        ownerId,
        name: dto.name,
        slug,
        description: dto.description || null,
        address: dto.address,
        subCity: dto.subCity,
        city: dto.city || 'Addis Ababa',
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        coverImageUrl: dto.coverImageUrl || null,
        gallery: dto.gallery || [],
        status: SalonStatus.PENDING_REVIEW,
        isActive: false,
      },
      include: {
        owner: {
          select: { id: true, fullName: true, phoneNumber: true },
        },
        workingHours: true,
        staff: true,
      },
    });
  }

  async getOnboardingStatus(userId: string): Promise<any> {
    const salon = await this.prisma.salon.findFirst({
      where: { ownerId: userId },
      include: {
        owner: {
          select: { id: true, fullName: true, phoneNumber: true, email: true },
        },
      },
    });

    if (!salon) {
      throw new NotFoundException('No salon onboarding record found for the logged in user');
    }

    return {
      salonId: salon.id,
      salonName: salon.name,
      status: salon.status,
      rejectionReason: salon.rejectionReason,
      tradeLicenseUrl: salon.tradeLicenseUrl,
      tinNumber: salon.tinNumber,
      kebeleIdUrl: salon.kebeleIdUrl,
      payoutBank: salon.payoutBank,
      payoutAccount: salon.payoutAccount,
      submittedAt: salon.createdAt,
      updatedAt: salon.updatedAt,
    };
  }

  async manualOnboard(dto: ManualOnboardSalonDto): Promise<any> {
    const setupToken = `setup-${Date.now().toString(36)}-${Math.random().toString(36).slice(-6)}`;
    const slug = await this.generateUniqueSlug(dto.salonName);

    let user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.ownerPhoneNumber },
    });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          phoneNumber: dto.ownerPhoneNumber,
          fullName: dto.ownerFullName,
          email: dto.ownerEmail || null,
          passwordHash,
          role: UserRole.SALON_OWNER,
          isPhoneVerified: false,
          isActive: true,
        },
      });
    }

    const salon = await this.prisma.salon.create({
      data: {
        ownerId: user.id,
        name: dto.salonName,
        slug,
        address: dto.address,
        subCity: dto.subCity,
        status: SalonStatus.PENDING_REVIEW,
        isActive: false,
        setupToken,
        tradeLicenseUrl: dto.tradeLicenseUrl || null,
        tinNumber: dto.tinNumber || null,
      },
    });

    return {
      message: 'Salon manually onboarded in PENDING_REVIEW state. Setup token generated.',
      setupToken,
      salon,
      owner: { id: user.id, fullName: user.fullName, phoneNumber: user.phoneNumber },
    };
  }

  async verifySalon(salonId: string, dto: VerifySalonDto): Promise<any> {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    const isApproved = dto.status === SalonStatus.APPROVED;

    return this.prisma.salon.update({
      where: { id: salonId },
      data: {
        status: dto.status,
        isActive: isApproved,
        rejectionReason: dto.rejectionReason || null,
      },
      include: {
        owner: {
          select: { id: true, fullName: true, phoneNumber: true, email: true },
        },
      },
    });
  }

  async findAllSalons(query: QuerySalonDto): Promise<{ data: any[]; meta: any }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      status: SalonStatus.APPROVED,
    };

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    if (query.subCity) {
      where.subCity = {
        contains: query.subCity,
        mode: 'insensitive',
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { subCity: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [salons, total] = await Promise.all([
      this.prisma.salon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          workingHours: true,
          staff: {
            where: { isAvailable: true },
            include: {
              user: {
                select: { id: true, fullName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
      this.prisma.salon.count({ where }),
    ]);

    return {
      data: salons,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findSalonByIdOrSlug(idOrSlug: string): Promise<any> {
    const salon = await this.prisma.salon.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
        status: SalonStatus.APPROVED,
      },
      include: {
        owner: {
          select: { id: true, fullName: true, phoneNumber: true, avatarUrl: true },
        },
        workingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        staff: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true, phoneNumber: true },
            },
          },
        },
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            services: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID or slug '${idOrSlug}' not found`);
    }

    return salon;
  }

  async updateSalon(id: string, user: { id: string; role: UserRole }, dto: UpdateSalonDto): Promise<any> {
    const salon = await this.prisma.salon.findUnique({
      where: { id },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${id}' not found`);
    }

    this.checkSalonOwnership(salon.ownerId, user);

    let slug = salon.slug;
    if (dto.name && dto.name !== salon.name) {
      slug = await this.generateUniqueSlug(dto.name, salon.id);
    }

    return this.prisma.salon.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name, slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.address && { address: dto.address }),
        ...(dto.subCity && { subCity: dto.subCity }),
        ...(dto.city && { city: dto.city }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.coverImageUrl !== undefined && { coverImageUrl: dto.coverImageUrl }),
        ...(dto.gallery && { gallery: dto.gallery }),
        ...(dto.isFeatured !== undefined && user.role === UserRole.SUPER_ADMIN && { isFeatured: dto.isFeatured }),
        ...(dto.isActive !== undefined && user.role === UserRole.SUPER_ADMIN && { isActive: dto.isActive }),
      },
      include: {
        workingHours: true,
        staff: true,
      },
    });
  }

  async deleteSalon(id: string, user: { id: string; role: UserRole }): Promise<{ message: string }> {
    const salon = await this.prisma.salon.findUnique({
      where: { id },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${id}' not found`);
    }

    this.checkSalonOwnership(salon.ownerId, user);

    await this.prisma.salon.update({
      where: { id },
      data: { isActive: false, status: SalonStatus.SUSPENDED },
    });

    return { message: 'Salon deactivated successfully' };
  }

  async setWorkingHours(
    salonId: string,
    user: { id: string; role: UserRole },
    dto: SetWorkingHoursDto,
  ): Promise<any[]> {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    this.checkSalonOwnership(salon.ownerId, user);

    const upsertPromises = dto.schedules.map((schedule) =>
      this.prisma.workingHours.upsert({
        where: {
          salonId_dayOfWeek: {
            salonId,
            dayOfWeek: schedule.dayOfWeek,
          },
        },
        create: {
          salonId,
          dayOfWeek: schedule.dayOfWeek,
          openTime: schedule.openTime,
          closeTime: schedule.closeTime,
          isClosed: schedule.isClosed ?? false,
        },
        update: {
          openTime: schedule.openTime,
          closeTime: schedule.closeTime,
          isClosed: schedule.isClosed ?? false,
        },
      }),
    );

    await Promise.all(upsertPromises);

    return this.prisma.workingHours.findMany({
      where: { salonId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async addStaff(salonId: string, user: { id: string; role: UserRole }, dto: CreateStaffDto): Promise<any> {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    this.checkSalonOwnership(salon.ownerId, user);

    let targetUser: any = null;
    if (dto.userId) {
      targetUser = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    } else if (dto.phoneNumber) {
      targetUser = await this.prisma.user.findUnique({ where: { phoneNumber: dto.phoneNumber } });
    } else {
      throw new BadRequestException('Either userId or phoneNumber must be provided to assign staff');
    }

    if (!targetUser) {
      throw new NotFoundException('Target user for staff assignment not found');
    }

    const existingStaff = await this.prisma.staffProfile.findUnique({
      where: { userId: targetUser.id },
    });

    if (existingStaff) {
      throw new ConflictException('User is already assigned to a staff profile');
    }

    if (targetUser.role === UserRole.CUSTOMER || targetUser.role === UserRole.CLIENT) {
      await this.prisma.user.update({
        where: { id: targetUser.id },
        data: { role: UserRole.STAFF },
      });
    }

    return this.prisma.staffProfile.create({
      data: {
        userId: targetUser.id,
        salonId,
        title: dto.title,
        bio: dto.bio || null,
        isAvailable: dto.isAvailable ?? true,
      },
      include: {
        user: {
          select: { id: true, fullName: true, phoneNumber: true, avatarUrl: true, role: true },
        },
      },
    });
  }

  async getStaffBySalon(salonId: string): Promise<any[]> {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    return this.prisma.staffProfile.findMany({
      where: { salonId },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, phoneNumber: true },
        },
      },
    });
  }

  async updateStaff(
    salonId: string,
    staffId: string,
    user: { id: string; role: UserRole },
    dto: UpdateStaffDto,
  ): Promise<any> {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    this.checkSalonOwnership(salon.ownerId, user);

    const staffProfile = await this.prisma.staffProfile.findFirst({
      where: { id: staffId, salonId },
    });

    if (!staffProfile) {
      throw new NotFoundException(`Staff profile with ID '${staffId}' not found in this salon`);
    }

    return this.prisma.staffProfile.update({
      where: { id: staffId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, phoneNumber: true },
        },
      },
    });
  }

  private checkSalonOwnership(ownerId: string, user: { id: string; role: UserRole }): void {
    if (user.role !== UserRole.SUPER_ADMIN && ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this salon');
    }
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug || 'salon';
    let count = 1;

    while (true) {
      const existing = await this.prisma.salon.findUnique({
        where: { slug },
      });

      if (!existing || existing.id === excludeId) {
        return slug;
      }

      slug = `${baseSlug}-${count}`;
      count++;
    }
  }
}
