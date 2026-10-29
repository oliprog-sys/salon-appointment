import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class InitializePaymentDto {
  @IsNotEmpty()
  @IsString()
  appointmentId: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod, {
    message: 'method must be one of: TELEBIRR, CBE_BIRR, CHAPA, PAY_AT_SALON',
  })
  method: PaymentMethod;

  @IsOptional()
  @IsUrl({}, { message: 'returnUrl must be a valid URL' })
  returnUrl?: string;
}
