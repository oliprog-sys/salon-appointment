import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HandleWebhookDto } from './dto/handle-webhook.dto';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { MockPayDto } from './dto/mock-pay.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async initializePayment(
    @CurrentUser('id') customerId: string,
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentService.initializePayment(customerId, dto);
  }

  @Post('mock-pay')
  @HttpCode(HttpStatus.OK)
  async simulateMockPayment(@Body() dto: MockPayDto) {
    return this.paymentService.simulateMockPayment(dto);
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: HandleWebhookDto,
    @Headers() headers: Record<string, any>,
  ) {
    return this.paymentService.handleWebhook(provider, payload, headers);
  }

  @Get('appointment/:appointmentId')
  @UseGuards(JwtAuthGuard)
  async getPaymentByAppointment(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.paymentService.getPaymentByAppointment(appointmentId, user.id, user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPaymentById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.paymentService.getPaymentById(id, user.id, user.role);
  }
}
