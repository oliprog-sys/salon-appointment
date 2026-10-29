import { PaymentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class MockPayDto {
  @IsNotEmpty()
  @IsString()
  providerTxnRef: string;

  @IsNotEmpty()
  @IsEnum(PaymentStatus, {
    message: 'status must be one of: SUCCESSFUL, FAILED',
  })
  status: PaymentStatus;
}
