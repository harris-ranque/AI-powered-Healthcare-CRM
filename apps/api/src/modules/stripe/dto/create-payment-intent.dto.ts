import { IsNumber, IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  organizationId: string;

  @IsNumber()
  amount: number;
}
