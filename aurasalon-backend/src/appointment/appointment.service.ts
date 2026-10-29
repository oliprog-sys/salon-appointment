import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { QueryAvailableSlotsDto } from './dto/query-available-slots.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAvailableSlots(dto: QueryAvailableSlotsDto): Promise<{
    date: string;
    salonId: string;
    totalDurationMin: number;
    availableSlots: string[];
  }> {
    const { salonId, date, serviceIds, staffId } = dto;

    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      include: { workingHours: true },
    });

    if (!salon || !salon.isActive) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found or inactive`);
    }

    const services = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        salonId,
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      throw new BadRequestException('One or more requested services are invalid or inactive');
    }

    const totalDurationMin = services.reduce((acc, svc) => acc + svc.durationMin, 0);

    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = targetDate.getUTCDay();

    const schedule = salon.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);
    if (!schedule || schedule.isClosed) {
      return {
        date,
        salonId,
        totalDurationMin,
        availableSlots: [],
      };
    }

    const [openHour, openMin] = schedule.openTime.split(':').map(Number);
    const [closeHour, closeMin] = schedule.closeTime.split(':').map(Number);

    const openTimeMs = Date.UTC(year, month - 1, day, openHour, openMin, 0);
    const closeTimeMs = Date.UTC(year, month - 1, day, closeHour, closeMin, 0);

    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        salonId,
        ...(staffId && { staffId }),
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });

    const stepMs = 15 * 60 * 1000;
    const durationMs = totalDurationMin * 60 * 1000;

    const availableSlots: string[] = [];

    for (let currentMs = openTimeMs; currentMs + durationMs <= closeTimeMs; currentMs += stepMs) {
      const slotStart = new Date(currentMs);
      const slotEnd = new Date(currentMs + durationMs);

      const hasConflict = existingAppointments.some(
        (appt) => slotStart < appt.endTime && slotEnd > appt.startTime,
      );

      if (hasConflict) {
        continue;
      }

      const lockKey = `lock:slot:${staffId || 'salon:' + salonId}:${slotStart.toISOString()}`;
      const isLocked = await this.redis.get(lockKey);
      if (isLocked) {
        continue;
      }

      const hoursStr = String(slotStart.getUTCHours()).padStart(2, '0');
      const minsStr = String(slotStart.getUTCMinutes()).padStart(2, '0');
      availableSlots.push(`${hoursStr}:${minsStr}`);
    }

    return {
      date,
      salonId,
      totalDurationMin,
      availableSlots,
    };
  }

  async createAppointment(customerId: string, dto: CreateAppointmentDto): Promise<any> {
    const { salonId, serviceIds, staffId, startTime: startTimeIso, notes } = dto;

    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon || !salon.isActive) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found or inactive`);
    }

    const services = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        salonId,
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      throw new BadRequestException('One or more selected services are invalid or inactive');
    }

    if (staffId) {
      const staff = await this.prisma.staffProfile.findFirst({
        where: { id: staffId, salonId, isAvailable: true },
      });
      if (!staff) {
        throw new NotFoundException(`Staff member with ID '${staffId}' not found or unavailable`);
      }
    }

    const totalDurationMin = services.reduce((acc, svc) => acc + svc.durationMin, 0);
    const subtotalETB = services.reduce((acc, svc) => acc + Number(svc.priceETB), 0);
    const serviceFeeETB = 0;
    const totalPriceETB = subtotalETB + serviceFeeETB;

    const startTime = new Date(startTimeIso);
    if (isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid startTime format');
    }

    if (startTime.getTime() < Date.now()) {
      throw new BadRequestException('Cannot book an appointment in the past');
    }

    const endTime = new Date(startTime.getTime() + totalDurationMin * 60 * 1000);

    const lockKey = `lock:slot:${staffId || 'salon:' + salonId}:${startTime.toISOString()}`;
    const existingLock = await this.redis.get(lockKey);
    if (existingLock) {
      throw new ConflictException(
        'Selected time slot is currently locked by another booking checkout. Please choose a different time slot.',
      );
    }

    const existingConflict = await this.prisma.appointment.findFirst({
      where: {
        salonId,
        ...(staffId && { staffId }),
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (existingConflict) {
      throw new ConflictException('Selected time slot conflicts with an existing appointment booking.');
    }

    await this.redis.set(lockKey, customerId, 300);

    const bookingCode = await this.generateUniqueBookingCode();

    try {
      const createdAppointment = await this.prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            bookingCode,
            customerId,
            salonId,
            staffId: staffId || null,
            status: AppointmentStatus.PENDING,
            startTime,
            endTime,
            subtotalETB,
            serviceFeeETB,
            totalPriceETB,
            notes: notes || null,
            services: {
              create: services.map((svc) => ({
                serviceId: svc.id,
                priceAtBooking: svc.priceETB,
              })),
            },
          },
          include: {
            customer: {
              select: { id: true, fullName: true, phoneNumber: true },
            },
            salon: {
              select: { id: true, name: true, address: true, subCity: true },
            },
            staff: {
              include: {
                user: { select: { id: true, fullName: true, avatarUrl: true } },
              },
            },
            services: {
              include: {
                service: true,
              },
            },
          },
        });
        return appointment;
      });

      await this.notificationService.notifyAppointmentBooked(createdAppointment).catch(() => {});
      return createdAppointment;
    } catch (error) {
      await this.redis.del(lockKey);
      throw error;
    }
  }

  async findCustomerAppointments(customerId: string, query: QueryAppointmentDto): Promise<{ data: any[]; meta: any }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { customerId };
    if (query.status) {
      where.status = query.status;
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          salon: { select: { id: true, name: true, address: true, subCity: true, coverImageUrl: true } },
          staff: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
          services: { include: { service: true } },
          payment: true,
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findSalonAppointments(
    salonId: string,
    user: { id: string; role: UserRole },
    query: QueryAppointmentDto,
  ): Promise<{ data: any[]; meta: any }> {
    await this.verifySalonStaffOrOwnerPermission(salonId, user);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { salonId };
    if (query.status) {
      where.status = query.status;
    }
    if (query.staffId) {
      where.staffId = query.staffId;
    }

    if (query.date) {
      const [year, month, day] = query.date.split('-').map(Number);
      const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
      where.startTime = { gte: dayStart, lte: dayEnd };
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
        include: {
          customer: { select: { id: true, fullName: true, phoneNumber: true } },
          staff: { include: { user: { select: { id: true, fullName: true } } } },
          services: { include: { service: true } },
          payment: true,
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAppointmentByIdOrCode(idOrCode: string, user: { id: string; role: UserRole }): Promise<any> {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        OR: [{ id: idOrCode }, { bookingCode: idOrCode }],
      },
      include: {
        customer: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
        salon: { select: { id: true, name: true, address: true, subCity: true, ownerId: true } },
        staff: { include: { user: { select: { id: true, fullName: true, phoneNumber: true } } } },
        services: { include: { service: true } },
        payment: true,
        review: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID or booking code '${idOrCode}' not found`);
    }

    const isCustomer = appointment.customerId === user.id;
    const isOwner = appointment.salon.ownerId === user.id;
    const isStaff = user.role === UserRole.STAFF || user.role === UserRole.SUPER_ADMIN;

    if (!isCustomer && !isOwner && !isStaff) {
      throw new ForbiddenException('You do not have permission to view this appointment');
    }

    return appointment;
  }

  async updateStatus(
    id: string,
    user: { id: string; role: UserRole },
    dto: UpdateAppointmentStatusDto,
  ): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { salon: true },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${id}' not found`);
    }

    this.verifySalonStaffOrOwnerPermission(appointment.salonId, user, appointment.salon.ownerId);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
      include: {
        customer: { select: { id: true, fullName: true, phoneNumber: true } },
        salon: { select: { id: true, name: true } },
        services: { include: { service: true } },
        payment: true,
      },
    });

    if (dto.status === AppointmentStatus.CONFIRMED) {
      await this.notificationService.notifyAppointmentConfirmed(updated).catch(() => {});
    } else if (dto.status === AppointmentStatus.CANCELLED) {
      await this.notificationService.notifyAppointmentCancelled(updated, user.role).catch(() => {});
    } else if (dto.status === AppointmentStatus.COMPLETED) {
      await this.notificationService.notifyAppointmentCompleted(updated).catch(() => {});
    }

    return updated;
  }

  async cancelAppointment(id: string, customerId: string): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${id}' not found`);
    }

    if (appointment.customerId !== customerId) {
      throw new ForbiddenException('You can only cancel your own appointments');
    }

    if (appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException(`Cannot cancel an appointment that is already ${appointment.status}`);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: {
        customer: { select: { id: true, fullName: true, phoneNumber: true } },
        salon: { select: { id: true, name: true } },
        services: { include: { service: true } },
      },
    });

    await this.notificationService.notifyAppointmentCancelled(updated, 'Customer').catch(() => {});

    return updated;
  }

  private verifySalonStaffOrOwnerPermission(
    salonId: string,
    user: { id: string; role: UserRole },
    ownerId?: string,
  ): void {
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }
    if (user.role === UserRole.SALON_OWNER && ownerId && ownerId === user.id) {
      return;
    }
    if (user.role === UserRole.STAFF || user.role === UserRole.SALON_OWNER) {
      return;
    }
    throw new ForbiddenException('You do not have permission for this salon appointment action');
  }

  private async generateUniqueBookingCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    while (true) {
      let code = 'AUR-';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await this.prisma.appointment.findUnique({
        where: { bookingCode: code },
      });
      if (!existing) {
        return code;
      }
    }
  }
}
