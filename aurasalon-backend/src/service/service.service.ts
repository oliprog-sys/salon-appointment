import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(user: { id: string; role: UserRole }, dto: CreateCategoryDto): Promise<any> {
    await this.verifySalonOwnership(dto.salonId, user);

    return this.prisma.category.create({
      data: {
        salonId: dto.salonId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        services: true,
      },
    });
  }

  async findCategoriesBySalon(salonId: string): Promise<any[]> {
    const salon = await this.prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    return this.prisma.category.findMany({
      where: { salonId },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateCategory(id: string, user: { id: string; role: UserRole }, dto: UpdateCategoryDto): Promise<any> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { salon: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    await this.verifySalonOwnership(category.salonId, user);

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteCategory(id: string, user: { id: string; role: UserRole }): Promise<{ message: string }> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    await this.verifySalonOwnership(category.salonId, user);

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }

  async createService(user: { id: string; role: UserRole }, dto: CreateServiceDto): Promise<any> {
    await this.verifySalonOwnership(dto.salonId, user);

    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, salonId: dto.salonId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${dto.categoryId}' not found in this salon`);
    }

    return this.prisma.service.create({
      data: {
        salonId: dto.salonId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description || null,
        durationMin: dto.durationMin,
        priceETB: dto.priceETB,
        ...(dto.staffIds && dto.staffIds.length > 0 && {
          staff: {
            connect: dto.staffIds.map((staffId) => ({ id: staffId })),
          },
        }),
      },
      include: {
        category: true,
        staff: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async findServiceById(id: string): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        salon: {
          select: { id: true, name: true, slug: true, address: true, subCity: true },
        },
        staff: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID '${id}' not found`);
    }

    return service;
  }

  async updateService(id: string, user: { id: string; role: UserRole }, dto: UpdateServiceDto): Promise<any> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID '${id}' not found`);
    }

    await this.verifySalonOwnership(service.salonId, user);

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, salonId: service.salonId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID '${dto.categoryId}' not found in this salon`);
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.durationMin !== undefined && { durationMin: dto.durationMin }),
        ...(dto.priceETB !== undefined && { priceETB: dto.priceETB }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.staffIds && {
          staff: {
            set: dto.staffIds.map((staffId) => ({ id: staffId })),
          },
        }),
      },
      include: {
        category: true,
        staff: true,
      },
    });
  }

  async deleteService(id: string, user: { id: string; role: UserRole }): Promise<{ message: string }> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID '${id}' not found`);
    }

    await this.verifySalonOwnership(service.salonId, user);

    await this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Service deactivated successfully' };
  }

  private async verifySalonOwnership(salonId: string, user: { id: string; role: UserRole }): Promise<void> {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }

    if (user.role !== UserRole.SUPER_ADMIN && salon.ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to modify services for this salon');
    }
  }
}
