import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Corrections the user made in the review sheet before confirming. Every field
 * is optional — anything left out falls back to what the parser extracted.
 */
export class ConfirmDetectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsIn(['weekly', 'monthly', 'quarterly', 'yearly'])
  cycle?: string;

  @IsOptional()
  @IsDateString()
  nextRenewal?: string;

  @IsOptional()
  @IsDateString()
  trialEndsAt?: string | null;

  @IsOptional()
  @IsIn(['active', 'trial', 'cancelled'])
  status?: string;
}
