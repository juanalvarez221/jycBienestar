import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class TrackEventDto {
  @IsString()
  @MinLength(8)
  visitorId!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsIn(['page_view', 'click', 'add_to_cart', 'checkout_start', 'checkout_complete'])
  type!: string;

  @IsString()
  @MinLength(1)
  path!: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  element?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  xPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  yPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  viewportW?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  viewportH?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  metaJson?: string;
}
