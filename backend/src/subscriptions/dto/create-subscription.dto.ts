import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  category: string;

  @IsNumber()
  price: number;

  @IsString()
  currency: string;

  @IsIn(['weekly', 'monthly', 'quarterly', 'yearly'])
  cycle: string;

  @IsDateString()
  nextRenewal: string;

  @IsOptional()
  @IsDateString()
  trialEndsAt?: string | null;

  @IsIn(['active', 'trial', 'cancelled'])
  status: string;

  @IsString()
  source: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
