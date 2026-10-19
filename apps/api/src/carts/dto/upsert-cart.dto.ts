import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AbandonedItemDto {
  @IsString()
  productId!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsInt()
  @Min(0)
  unitPriceCents!: number;
}

export class UpsertCartDto {
  @IsString()
  @MinLength(8)
  visitorId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AbandonedItemDto)
  items!: AbandonedItemDto[];

  @IsInt()
  @Min(0)
  subtotalCents!: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  addressLine?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  departmentCode?: string;

  @IsOptional()
  @IsString()
  municipalityCode?: string;
}
