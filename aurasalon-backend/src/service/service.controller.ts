import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceService } from './service.service';

@Controller()
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: CreateCategoryDto,
  ) {
    return this.serviceService.createCategory(user, dto);
  }

  @Get('salons/:salonId/categories')
  async findCategoriesBySalon(@Param('salonId') salonId: string) {
    return this.serviceService.findCategoriesBySalon(salonId);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  async updateCategory(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.serviceService.updateCategory(id, user, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.serviceService.deleteCategory(id, user);
  }

  @Post('services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createService(
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: CreateServiceDto,
  ) {
    return this.serviceService.createService(user, dto);
  }

  @Get('services/:id')
  async findServiceById(@Param('id') id: string) {
    return this.serviceService.findServiceById(id);
  }

  @Patch('services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  async updateService(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: UpdateServiceDto,
  ) {
    return this.serviceService.updateService(id, user, dto);
  }

  @Delete('services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  async deleteService(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.serviceService.deleteService(id, user);
  }
}
