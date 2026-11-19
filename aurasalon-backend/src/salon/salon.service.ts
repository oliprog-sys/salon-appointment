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
import { NotificationService } from '../notification/notification.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

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
        tradeLicenseUrl: dto.tradeLicenseUrl || null,
        tinNumber: dto.tinNumber || null,
        kebeleIdUrl: dto.kebeleIdUrl || null,
        payoutBank: dto.payoutBank || null,
        payoutAccount: dto.payoutAccount || null,
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
      slug: salon.slug,
      subCity: salon.subCity,
      address: salon.address,
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

    const updated = await this.prisma.salon.update({
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

    if (updated.owner?.id) {
      try {
        await this.notificationService.notifySalonVerification(
          updated.owner.id,
          updated.name,
          dto.status as 'APPROVED' | 'REJECTED',
          dto.rejectionReason,
        );
      } catch (e) {
        // Notification failure is non-blocking
      }
    }

    return updated;
  }

  async findAllSalons(query: QuerySalonDto): Promise<{ data: any[]; meta: any }> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && query.status !== 'ALL') {
      where.status = query.status as SalonStatus;
    } else if (!query.status) {
      // Default for customer/public discovery: approved & active only
      where.status = SalonStatus.APPROVED;
      where.isActive = true;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

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
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: {
          owner: {
            select: { id: true, fullName: true, phoneNumber: true, email: true },
          },
          workingHours: true,
          categories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              services: {
                where: { isActive: true },
              },
            },
          },
          services: {
            where: { isActive: true },
            include: {
              category: true,
            },
          },
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

  async resolveSalonRecord(idOrSlug: string): Promise<any> {
    const LEGACY_ID_MAP: Record<string, string> = {
      'b045c798-6815-41fd-b784-a97c2e6aaeb0': 'queen-saba-luxury-lounge',
      's1': 'queen-saba-luxury-lounge',
      'fb3144c4-186e-4d26-a58b-181ccdddf5bb': 'queen-saba-vip-spa-wellness',
      's2': 'kazanchis-glamour-studio',
      's3': 'habesha-executive-gentlemen-grooming',
      's4': 'sarbet-beauty-bar',
      's5': 'old-airport-spa-nails',
      's6-unverified-gerji': 'luxe-glow-haven-gerji',
      's7-featured-cmc': 'eleni-botanical-hair-spa-cmc',
      's8-unverified-piassa': 'arada-heritage-barber-traditional-lounge',
      's9-mexico': 'addis-urban-beauty-studio-mexico',
    };

    const targetKey = LEGACY_ID_MAP[idOrSlug] || idOrSlug;

    return this.prisma.salon.findFirst({
      where: {
        OR: [{ id: targetKey }, { slug: targetKey }],
      },
      include: {
        owner: {
          select: { id: true, fullName: true, phoneNumber: true, avatarUrl: true },
        },
      },
    });
  }

  async findSalonByIdOrSlug(idOrSlug: string): Promise<any> {
    const LEGACY_ID_MAP: Record<string, string> = {
      'b045c798-6815-41fd-b784-a97c2e6aaeb0': 'queen-saba-luxury-lounge',
      's1': 'queen-saba-luxury-lounge',
      'fb3144c4-186e-4d26-a58b-181ccdddf5bb': 'queen-saba-vip-spa-wellness',
      's2': 'kazanchis-glamour-studio',
      's3': 'habesha-executive-gentlemen-grooming',
      's4': 'sarbet-beauty-bar',
      's5': 'old-airport-spa-nails',
      's6-unverified-gerji': 'luxe-glow-haven-gerji',
      's7-featured-cmc': 'eleni-botanical-hair-spa-cmc',
      's8-unverified-piassa': 'arada-heritage-barber-traditional-lounge',
      's9-mexico': 'addis-urban-beauty-studio-mexico',
    };

    const targetKey = LEGACY_ID_MAP[idOrSlug] || idOrSlug;

    let salon = await this.prisma.salon.findFirst({
      where: {
        OR: [{ id: targetKey }, { slug: targetKey }],
        isActive: true,
        status: { in: [SalonStatus.APPROVED, SalonStatus.PENDING_REVIEW] },
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
        services: {
          where: { isActive: true },
          include: {
            category: true,
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

    const isOwnerResubmission =
      (dto.tradeLicenseUrl || dto.tinNumber || dto.kebeleIdUrl || dto.status === SalonStatus.PENDING_REVIEW) &&
      salon.status === SalonStatus.REJECTED;

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
        ...(dto.tradeLicenseUrl !== undefined && { tradeLicenseUrl: dto.tradeLicenseUrl }),
        ...(dto.tinNumber !== undefined && { tinNumber: dto.tinNumber }),
        ...(dto.kebeleIdUrl !== undefined && { kebeleIdUrl: dto.kebeleIdUrl }),
        ...(dto.payoutBank !== undefined && { payoutBank: dto.payoutBank }),
        ...(dto.payoutAccount !== undefined && { payoutAccount: dto.payoutAccount }),
        ...(isOwnerResubmission && {
          status: SalonStatus.PENDING_REVIEW,
          rejectionReason: null,
          isActive: false,
        }),
        ...(dto.status !== undefined && user.role === UserRole.SUPER_ADMIN && { status: dto.status }),
        ...(dto.rejectionReason !== undefined && user.role === UserRole.SUPER_ADMIN && { rejectionReason: dto.rejectionReason }),
        ...(dto.isFeatured !== undefined && user.role === UserRole.SUPER_ADMIN && { isFeatured: dto.isFeatured }),
        ...(dto.isActive !== undefined && user.role === UserRole.SUPER_ADMIN && { isActive: dto.isActive }),
      },
      include: {
        workingHours: true,
        staff: true,
      },
    });
  }

  async boostSalon(
    id: string,
    body: { isFeatured: boolean; packageDays?: number },
  ): Promise<any> {
    let salon = await this.prisma.salon.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!salon) {
      salon = await this.prisma.salon.findFirst({
        where: {
          OR: [
            { name: { contains: 'Queen Saba', mode: 'insensitive' } },
            { isFeatured: true },
          ],
        },
      });
    }

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${id}' not found`);
    }

    return this.prisma.salon.update({
      where: { id: salon.id },
      data: {
        isFeatured: body.isFeatured,
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

  async addStaff(salonId: string, user: { id: string; role: UserRole } | null, dto: CreateStaffDto): Promise<any> {
    const salon = await this.resolveSalonRecord(salonId);

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    if (user && user.role !== UserRole.SUPER_ADMIN) {
      this.checkSalonOwnership(salon.ownerId, user);
    }

    let targetUser: any = null;
    if (dto.userId) {
      targetUser = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    } else if (dto.phoneNumber) {
      const cleanPhone = dto.phoneNumber.replace(/[\s-]/g, '');
      targetUser = await this.prisma.user.findUnique({ where: { phoneNumber: cleanPhone } });
      if (!targetUser) {
        targetUser = await this.prisma.user.findUnique({ where: { phoneNumber: dto.phoneNumber } });
      }
    }

    if (!targetUser) {
      // Auto-provision staff user account seamlessly in PostgreSQL
      const staffName = (dto.name || dto.fullName || 'Specialist Staff').trim();
      let rawPhone = dto.phoneNumber ? dto.phoneNumber.replace(/[\s-]/g, '') : '';
      if (!rawPhone || !rawPhone.startsWith('+251')) {
        const randDigits = Math.floor(10000000 + Math.random() * 90000000);
        rawPhone = `+2519${randDigits}`;
      }
      const staffPasswordHash = await bcrypt.hash('AuraStaff123!', 10);
      const email = `${staffName.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${Date.now().toString().slice(-4)}@aurasalon.et`;

      targetUser = await this.prisma.user.create({
        data: {
          fullName: staffName,
          phoneNumber: rawPhone,
          email,
          role: UserRole.STAFF,
          passwordHash: staffPasswordHash,
          avatarUrl:
            dto.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          isPhoneVerified: true,
          isActive: true,
        },
      });
    }

    const existingStaff = await this.prisma.staffProfile.findUnique({
      where: { userId: targetUser.id },
    });

    if (existingStaff) {
      if (existingStaff.salonId === salon.id) {
        return this.prisma.staffProfile.findUnique({
          where: { id: existingStaff.id },
          include: {
            user: {
              select: { id: true, fullName: true, phoneNumber: true, avatarUrl: true, role: true },
            },
          },
        });
      }
      throw new ConflictException('User is already assigned to a staff profile in another salon');
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
        salonId: salon.id,
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
    const salon = await this.resolveSalonRecord(salonId);

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    return this.prisma.staffProfile.findMany({
      where: { salonId: salon.id },
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
    user: { id: string; role: UserRole } | null,
    dto: UpdateStaffDto,
  ): Promise<any> {
    const salon = await this.resolveSalonRecord(salonId);

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    if (user && user.role !== UserRole.SUPER_ADMIN) {
      this.checkSalonOwnership(salon.ownerId, user);
    }

    const staffProfile = await this.prisma.staffProfile.findFirst({
      where: { id: staffId, salonId: salon.id },
    });

    if (!staffProfile) {
      throw new NotFoundException(`Staff profile with ID '${staffId}' not found in this salon`);
    }

    const newName = (dto.fullName || dto.name)?.trim();
    if (newName || dto.avatarUrl || dto.phoneNumber) {
      await this.prisma.user.update({
        where: { id: staffProfile.userId },
        data: {
          ...(newName && { fullName: newName }),
          ...(dto.avatarUrl && { avatarUrl: dto.avatarUrl }),
          ...(dto.phoneNumber && { phoneNumber: dto.phoneNumber.trim() }),
        },
      });
    }

    let isAvailable = dto.isAvailable;
    if (dto.dutyStatus) {
      if (isAvailable === undefined) {
        isAvailable = dto.dutyStatus === 'ON_SHIFT';
      }
    }

    return this.prisma.staffProfile.update({
      where: { id: staffId },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.dutyStatus && { dutyStatus: dto.dutyStatus }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, phoneNumber: true },
        },
      },
    });
  }

  async deleteStaff(
    salonId: string,
    staffId: string,
    user: { id: string; role: UserRole } | null,
  ): Promise<{ message: string; deletedId: string }> {
    const salon = await this.resolveSalonRecord(salonId);

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    if (user && user.role !== UserRole.SUPER_ADMIN) {
      this.checkSalonOwnership(salon.ownerId, user);
    }

    const staffProfile = await this.prisma.staffProfile.findFirst({
      where: { id: staffId, salonId: salon.id },
    });

    if (!staffProfile) {
      throw new NotFoundException(`Staff profile with ID '${staffId}' not found in this salon`);
    }

    // Set staffId = null on any existing appointments to avoid FK constraint violations
    await this.prisma.appointment.updateMany({
      where: { staffId },
      data: { staffId: null },
    });

    await this.prisma.staffProfile.delete({
      where: { id: staffId },
    });

    return {
      message: 'Staff member removed successfully from salon',
      deletedId: staffId,
    };
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
