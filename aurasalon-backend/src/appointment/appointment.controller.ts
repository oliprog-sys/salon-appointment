import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { QueryAvailableSlotsDto } from './dto/query-available-slots.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Controller()
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('salons/:salonId/available-slots')
  async getAvailableSlots(
    @Param('salonId') salonId: string,
    @Query('date') date: string,
    @Query('serviceIds') serviceIds: string,
    @Query('staffId') staffId?: string,
  ) {
    const serviceIdsArray = typeof serviceIds === 'string'
      ? serviceIds.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const dto: QueryAvailableSlotsDto = {
      salonId,
      date,
      serviceIds: serviceIdsArray,
      staffId,
    };

    return this.appointmentService.getAvailableSlots(dto);
  }

  @Post('appointments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createAppointment(
    @CurrentUser('id') customerId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentService.createAppointment(customerId, dto);
  }

  @Get('appointments/me')
  @UseGuards(JwtAuthGuard)
  async findMyAppointments(
    @CurrentUser('id') customerId: string,
    @Query() query: QueryAppointmentDto,
  ) {
    return this.appointmentService.findCustomerAppointments(customerId, query);
  }

  @Get('appointments/salon/:salonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.STAFF, UserRole.SUPER_ADMIN)
  async findSalonAppointments(
    @Param('salonId') salonId: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Query() query: QueryAppointmentDto,
  ) {
    return this.appointmentService.findSalonAppointments(salonId, user, query);
  }

  @Get('appointments/:idOrCode')
  @UseGuards(JwtAuthGuard)
  async findAppointmentByIdOrCode(
    @Param('idOrCode') idOrCode: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.appointmentService.findAppointmentByIdOrCode(idOrCode, user);
  }

  @Patch('appointments/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALON_OWNER, UserRole.STAFF, UserRole.SUPER_ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentService.updateStatus(id, user, dto);
  }

  @Patch('appointments/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelAppointment(
    @Param('id') id: string,
    @CurrentUser('id') customerId: string,
  ) {
    return this.appointmentService.cancelAppointment(id, customerId);
  }
}
