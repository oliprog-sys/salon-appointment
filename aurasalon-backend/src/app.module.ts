import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppointmentModule } from './appointment/appointment.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ReviewModule } from './review/review.module';
import { SalonModule } from './salon/salon.module';
import { ServiceModule } from './service/service.module';
import { UploadModule } from './upload/upload.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

const observeModules =
  process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_KEY !== 'YOUR_APP_KEY'
    ? [
        ObserveModule.forRoot({
          appKey: process.env.OBSERVE_APP_KEY,
          appSecret: process.env.OBSERVE_APP_SECRET || '',
          serviceId: process.env.OBSERVE_SERVICE_ID || 'aurasalon-backend',
        }),
      ]
    : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['aurasalon-backend/.env', '.env'],
    }),
    ...observeModules,
    PrismaModule,
    RedisModule,
    AuthModule,
    SalonModule,
    ServiceModule,
    AppointmentModule,
    PaymentModule,
    ReviewModule,
    NotificationModule,
    AnalyticsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
