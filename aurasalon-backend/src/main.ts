import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import * as path from 'path';
import { AppModule, ObserveInstrument } from './app.module';

async function bootstrap() {
  const hasObserveKey =
    Boolean(process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_KEY !== 'YOUR_APP_KEY');

  const app = await NestFactory.create(AppModule, {
    ...(hasObserveKey ? { instrument: ObserveInstrument } : {}),
  });

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 AuraSalon Backend running on http://localhost:${port}`);
}
bootstrap();
