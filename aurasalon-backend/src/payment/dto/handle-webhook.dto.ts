import { IsObject, IsOptional, IsString } from 'class-validator';

export class HandleWebhookDto {
  @IsOptional()
  @IsString()
  providerTxnRef?: string;

  @IsOptional()
  @IsString()
  tx_ref?: string;

  @IsOptional()
  @IsString()
  outTradeNo?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  trade_status?: string;

  @IsOptional()
  @IsObject()
  rawPayload?: Record<string, any>;
}
