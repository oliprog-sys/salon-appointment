import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(customerId: string, dto: CreateReviewDto): Promise<any> {
    const { appointmentId, rating, comment, tipAmountETB } = dto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${appointmentId}' not found`);
    }

    if (appointment.customerId !== customerId) {
      throw new ForbiddenException('You can only review your own appointments');
    }

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        `Only completed appointments can be reviewed. Current appointment status is ${appointment.status}`,
      );
    }

    const existingReview = await this.prisma.review.findUnique({
      where: { appointmentId },
    });

    if (existingReview) {
      throw new ConflictException('A review for this appointment has already been submitted');
    }

    return this.prisma.review.create({
      data: {
        appointmentId,
        customerId,
        rating,
        comment: comment || null,
        tipAmountETB: tipAmountETB ?? 0,
      },
      include: {
        customer: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        appointment: {
          select: { id: true, bookingCode: true, salonId: true, staffId: true, startTime: true },
        },
      },
    });
  }

  async findReviewsBySalon(salonId: string, query: QueryReviewDto): Promise<{ data: any[]; meta: any }> {
    const salon = await this.prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      appointment: {
        salonId,
      },
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          appointment: {
            select: { id: true, bookingCode: true, startTime: true },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSalonMetrics(salonId: string): Promise<any> {
    const salon = await this.prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    const where = {
      appointment: {
        salonId,
      },
    };

    const [aggregate, reviews] = await Promise.all([
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.review.findMany({
        where,
        select: { rating: true },
      }),
    ]);

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating]++;
      }
    });

    const averageRating = aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0;
    const totalReviews = aggregate._count.id;

    return {
      salonId,
      averageRating,
      totalReviews,
      ratingBreakdown: breakdown,
    };
  }

  async findReviewsByStaff(staffId: string, query: QueryReviewDto): Promise<{ data: any[]; meta: any }> {
    const staff = await this.prisma.staffProfile.findUnique({ where: { id: staffId } });
    if (!staff) {
      throw new NotFoundException(`Staff profile with ID '${staffId}' not found`);
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      appointment: {
        staffId,
      },
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          appointment: {
            select: { id: true, bookingCode: true, startTime: true },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStaffMetrics(staffId: string): Promise<any> {
    const staff = await this.prisma.staffProfile.findUnique({ where: { id: staffId } });
    if (!staff) {
      throw new NotFoundException(`Staff profile with ID '${staffId}' not found`);
    }

    const where = {
      appointment: {
        staffId,
      },
    };

    const [aggregate, reviews] = await Promise.all([
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.review.findMany({
        where,
        select: { rating: true },
      }),
    ]);

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating]++;
      }
    });

    const averageRating = aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0;
    const totalReviews = aggregate._count.id;

    return {
      staffId,
      averageRating,
      totalReviews,
      ratingBreakdown: breakdown,
    };
  }

  async findReviewById(id: string): Promise<any> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        appointment: {
          select: { id: true, bookingCode: true, salonId: true, staffId: true, startTime: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID '${id}' not found`);
    }

    return review;
  }

  async deleteReview(id: string, user: { id: string; role: UserRole }): Promise<{ message: string }> {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID '${id}' not found`);
    }

    if (user.role !== UserRole.SUPER_ADMIN && review.customerId !== user.id) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id },
    });

    return { message: 'Review deleted successfully' };
  }
}
