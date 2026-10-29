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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateSalonDto } from './dto/create-salon.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ManualOnboardSalonDto } from './dto/manual-onboard-salon.dto';
import { QuerySalonDto } from './dto/query-salon.dto';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { VerifySalonDto } from './dto/verify-salon.dto';
import { SalonService } from './salon.service';

@Controller('salons')
export class SalonController {
  constructor(private readonly salonService: SalonService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createSalon(@CurrentUser('id') ownerId: string, @Body() dto: CreateSalonDto) {
    return this.salonService.createSalon(ownerId, dto);
  }

  @Get('onboarding/status')
  @UseGuards(JwtAuthGuard)
  async getOnboardingStatus(@CurrentUser('id') userId: string) {
    return this.salonService.getOnboardingStatus(userId);
  }

  @Post('/admin/salons/manual-onboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async manualOnboard(@Body() dto: ManualOnboardSalonDto) {
    return this.salonService.manualOnboard(dto);
  }

  @Patch('/admin/salons/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async verifySalon(@Param('id') id: string, @Body() dto: VerifySalonDto) {
    return this.salonService.verifySalon(id, dto);
  }

  @Get()
  async findAllSalons(@Query() query: QuerySalonDto) {
    return this.salonService.findAllSalons(query);
  }

  @Get(':idOrSlug')
  async findSalonByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.salonService.findSalonByIdOrSlug(idOrSlug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  async updateSalon(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: UpdateSalonDto,
  ) {
    return this.salonService.updateSalon(id, user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  async deleteSalon(@Param('id') id: string, @CurrentUser() user: { id: string; role: UserRole }) {
    return this.salonService.deleteSalon(id, user);
  }

  @Put(':id/working-hours')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  async setWorkingHours(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: SetWorkingHoursDto,
  ) {
    return this.salonService.setWorkingHours(id, user, dto);
  }

  @Post(':id/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async addStaff(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: CreateStaffDto,
  ) {
    return this.salonService.addStaff(id, user, dto);
  }

  @Get(':id/staff')
  async getStaffBySalon(@Param('id') id: string) {
    return this.salonService.getStaffBySalon(id);
  }

  @Patch(':id/staff/:staffId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.SUPER_ADMIN)
  async updateStaff(
    @Param('id') salonId: string,
    @Param('staffId') staffId: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: UpdateStaffDto,
  ) {
    return this.salonService.updateStaff(salonId, staffId, user, dto);
  }
}
