import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerFcmToken(userId: string, dto: RegisterFcmTokenDto): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: dto.fcmToken },
    });

    return { message: 'FCM push token registered successfully' };
  }

  async findUserNotifications(userId: string, query: QueryNotificationDto): Promise<{ data: any[]; unreadCount: number; meta: any }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      unreadCount,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<any> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID '${notificationId}' not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only update your own notifications');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<{ message: string }> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  }

  // ------------------------------------------
  // Event Triggers & Notification Handlers
  // ------------------------------------------

  async notifyAppointmentBooked(appointment: any): Promise<void> {
    const title = 'Booking Created';
    const body = `Your appointment (${appointment.bookingCode}) at ${appointment.salon?.name || 'AuraSalon'} is pending confirmation.`;
    const data = { appointmentId: appointment.id, bookingCode: appointment.bookingCode, type: 'BOOKED' };

    await this.sendNotificationToUser(appointment.customerId, title, body, data);

    if (appointment.customer?.phoneNumber) {
      this.dispatchSms(appointment.customer.phoneNumber, `[AuraSalon] ${body}`);
    }
  }

  async notifyAppointmentConfirmed(appointment: any): Promise<void> {
    const title = 'Booking Confirmed!';
    const body = `Your appointment (${appointment.bookingCode}) is confirmed! We look forward to serving you.`;
    const data = { appointmentId: appointment.id, bookingCode: appointment.bookingCode, type: 'CONFIRMED' };

    await this.sendNotificationToUser(appointment.customerId, title, body, data);

    if (appointment.customer?.phoneNumber) {
      this.dispatchSms(appointment.customer.phoneNumber, `[AuraSalon] ${body}`);
    }
  }

  async notifyAppointmentCancelled(appointment: any, cancelledBy?: string): Promise<void> {
    const title = 'Booking Cancelled';
    const body = `Your appointment (${appointment.bookingCode}) has been cancelled${cancelledBy ? ` by ${cancelledBy}` : ''}.`;
    const data = { appointmentId: appointment.id, bookingCode: appointment.bookingCode, type: 'CANCELLED' };

    await this.sendNotificationToUser(appointment.customerId, title, body, data);

    if (appointment.customer?.phoneNumber) {
      this.dispatchSms(appointment.customer.phoneNumber, `[AuraSalon] ${body}`);
    }
  }

  async notifyAppointmentCompleted(appointment: any): Promise<void> {
    const title = 'Service Completed';
    const body = `Thank you for visiting ${appointment.salon?.name || 'AuraSalon'}! Please take a moment to rate your experience.`;
    const data = { appointmentId: appointment.id, bookingCode: appointment.bookingCode, type: 'COMPLETED' };

    await this.sendNotificationToUser(appointment.customerId, title, body, data);

    if (appointment.customer?.phoneNumber) {
      this.dispatchSms(appointment.customer.phoneNumber, `[AuraSalon] ${body}`);
    }
  }

  private async sendNotificationToUser(userId: string, title: string, body: string, data?: any): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fcmToken: true, phoneNumber: true },
    });

    if (!user) return;

    await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        data: data || null,
        isRead: false,
      },
    });

    if (user.fcmToken) {
      this.sendFcmPush(user.fcmToken, title, body, data);
    }
  }

  private dispatchSms(phoneNumber: string, message: string): void {
    this.logger.log(`[SMS Dispatcher Mock] To: ${phoneNumber} | Message: "${message}"`);
  }

  private sendFcmPush(fcmToken: string, title: string, body: string, data?: any): void {
    this.logger.log(`[FCM Push Service Mock] Token: ${fcmToken.slice(0, 12)}... | Title: "${title}" | Body: "${body}" | Data: ${JSON.stringify(data || {})}`);
  }
}
