import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppointmentStatus, PaymentMethod, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { MockPayDto } from './dto/mock-pay.dto';
import { HandleWebhookDto } from './dto/handle-webhook.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  async initializePayment(customerId: string, dto: InitializePaymentDto): Promise<any> {
    const { appointmentId, method, returnUrl } = dto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { salon: true },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${appointmentId}' not found`);
    }

    if (appointment.customerId !== customerId) {
      throw new ForbiddenException('You can only initialize payment for your own appointments');
    }

    if (appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException(`Cannot pay for an appointment that is ${appointment.status}`);
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: { appointmentId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESSFUL) {
      throw new ConflictException('Payment for this appointment has already been completed');
    }

    if (method === PaymentMethod.PAY_AT_SALON) {
      const [payment] = await this.prisma.$transaction([
        this.prisma.payment.upsert({
          where: { appointmentId },
          create: {
            appointmentId,
            method: PaymentMethod.PAY_AT_SALON,
            status: PaymentStatus.PENDING,
            amountETB: appointment.totalPriceETB,
          },
          update: {
            method: PaymentMethod.PAY_AT_SALON,
            status: PaymentStatus.PENDING,
          },
        }),
        this.prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: AppointmentStatus.CONFIRMED },
        }),
      ]);

      return {
        message: 'Appointment confirmed for Pay at Salon',
        paymentId: payment.id,
        appointmentId: appointment.id,
        status: 'CONFIRMED',
      };
    }

    const providerTxnRef = `TXN-${method}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await this.prisma.payment.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        method,
        status: PaymentStatus.PENDING,
        amountETB: appointment.totalPriceETB,
        providerTxnRef,
      },
      update: {
        method,
        status: PaymentStatus.PENDING,
        amountETB: appointment.totalPriceETB,
        providerTxnRef,
      },
    });

    const baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const checkoutUrl = `${baseUrl}/payments/mock-pay?providerTxnRef=${providerTxnRef}&returnUrl=${encodeURIComponent(returnUrl || '')}`;

    return {
      paymentId: payment.id,
      appointmentId: appointment.id,
      providerTxnRef,
      amountETB: payment.amountETB,
      status: PaymentStatus.PENDING,
      checkoutUrl,
    };
  }

  async simulateMockPayment(dto: MockPayDto): Promise<any> {
    const { providerTxnRef, status } = dto;

    const payment = await this.prisma.payment.findUnique({
      where: { providerTxnRef },
      include: { appointment: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with transaction reference '${providerTxnRef}' not found`);
    }

    await this.processPaymentOutcome(payment, status, {
      source: 'MockPaymentSimulation',
      providerTxnRef,
      simulatedStatus: status,
      timestamp: new Date().toISOString(),
    });

    return {
      message: `Mock payment processed as ${status}`,
      providerTxnRef,
      paymentId: payment.id,
      appointmentStatus: status === PaymentStatus.SUCCESSFUL ? AppointmentStatus.CONFIRMED : payment.appointment.status,
    };
  }

  async handleWebhook(providerStr: string, payload: HandleWebhookDto | any, headers: Record<string, any>): Promise<any> {
    const providerEnum = this.mapProviderToEnum(providerStr);

    this.verifyWebhookSignature(providerStr, headers, payload);

    const providerTxnRef = payload.providerTxnRef || payload.tx_ref || payload.outTradeNo || payload.id;
    const isSuccess =
      payload.status === 'SUCCESSFUL' ||
      payload.status === 'success' ||
      payload.trade_status === 'TRADE_SUCCESS' ||
      payload.code === 200;

    const targetStatus = isSuccess ? PaymentStatus.SUCCESSFUL : PaymentStatus.FAILED;

    let payment = null;
    if (providerTxnRef) {
      payment = await this.prisma.payment.findUnique({
        where: { providerTxnRef },
        include: { appointment: true },
      });
    }

    await this.prisma.paymentWebhookLog.create({
      data: {
        provider: providerEnum,
        payload,
        paymentId: payment ? payment.id : null,
      },
    });

    if (payment) {
      await this.processPaymentOutcome(payment, targetStatus, payload);
    } else {
      this.logger.warn(`Webhook received for unknown transaction ref: [${providerTxnRef}]`);
    }

    return { status: 'success', message: 'Webhook processed successfully' };
  }

  async getPaymentByAppointment(appointmentId: string, userId: string, role: UserRole): Promise<any> {
    const payment = await this.prisma.payment.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          select: { id: true, customerId: true, salonId: true, bookingCode: true, status: true },
        },
        webhooks: {
          orderBy: { processedAt: 'desc' },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`No payment found for appointment '${appointmentId}'`);
    }

    if (role !== UserRole.SUPER_ADMIN && payment.appointment.customerId !== userId) {
      const salon = await this.prisma.salon.findUnique({
        where: { id: payment.appointment.salonId },
      });
      if (!salon || salon.ownerId !== userId) {
        throw new ForbiddenException('You do not have permission to view this payment');
      }
    }

    return payment;
  }

  async getPaymentById(id: string, userId: string, role: UserRole): Promise<any> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        appointment: {
          select: { id: true, customerId: true, salonId: true, bookingCode: true, status: true },
        },
        webhooks: {
          orderBy: { processedAt: 'desc' },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID '${id}' not found`);
    }

    if (role !== UserRole.SUPER_ADMIN && payment.appointment.customerId !== userId) {
      const salon = await this.prisma.salon.findUnique({
        where: { id: payment.appointment.salonId },
      });
      if (!salon || salon.ownerId !== userId) {
        throw new ForbiddenException('You do not have permission to view this payment');
      }
    }

    return payment;
  }

  private async processPaymentOutcome(payment: any, targetStatus: PaymentStatus, _payload: any): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: targetStatus,
          ...(targetStatus === PaymentStatus.SUCCESSFUL && { paidAt: new Date() }),
        },
      });

      if (targetStatus === PaymentStatus.SUCCESSFUL) {
        await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: { status: AppointmentStatus.CONFIRMED },
        });
      }
    });

    if (targetStatus === PaymentStatus.SUCCESSFUL && payment.appointment?.startTime) {
      const staffId = payment.appointment.staffId;
      const salonId = payment.appointment.salonId;
      const dateObj = new Date(payment.appointment.startTime);
      if (!isNaN(dateObj.getTime())) {
        const lockKey = `lock:slot:${staffId || 'salon:' + salonId}:${dateObj.toISOString()}`;
        await this.redis.del(lockKey);
      }
      await this.notificationService.notifyAppointmentConfirmed(payment.appointment).catch(() => {});
    }
  }

  private mapProviderToEnum(providerStr: string): PaymentMethod {
    const normalized = providerStr.toLowerCase();
    if (normalized.includes('chapa')) return PaymentMethod.CHAPA;
    if (normalized.includes('telebirr')) return PaymentMethod.TELEBIRR;
    if (normalized.includes('cbe')) return PaymentMethod.CBE_BIRR;
    return PaymentMethod.PAY_AT_SALON;
  }

  private verifyWebhookSignature(providerStr: string, headers: Record<string, any>, _payload: any): void {
    const normalized = providerStr.toLowerCase();

    if (normalized.includes('chapa')) {
      const chapaSecret = this.configService.get<string>('CHAPA_SECRET_KEY');
      const signature = headers['x-chapa-signature'] || headers['x-signature'];

      if (chapaSecret && signature && signature !== chapaSecret) {
        throw new UnauthorizedException('Invalid Chapa webhook signature');
      }
    }

    if (normalized.includes('telebirr')) {
      const telebirrSecret = this.configService.get<string>('TELEBIRR_PUBLIC_KEY');
      const signature = headers['x-telebirr-signature'];

      if (telebirrSecret && signature && signature !== telebirrSecret) {
        throw new UnauthorizedException('Invalid Telebirr webhook signature');
      }
    }
  }
}
