import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
  Equals,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(3)
  customerName!: string;

  @IsString()
  @MinLength(7)
  customerPhone!: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsString()
  @MinLength(5)
  addressLine!: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsString()
  departmentCode!: string;

  @IsString()
  municipalityCode!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsBoolean()
  @Equals(true, {
    message: 'Debes aceptar los términos y condiciones para continuar',
  })
  acceptedTerms!: boolean;

  @IsOptional()
  @IsString()
  visitorId?: string;
}
