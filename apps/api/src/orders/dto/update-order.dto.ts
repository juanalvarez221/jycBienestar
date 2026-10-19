import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ESTADOS_PEDIDO } from '../order-status';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  addressLine?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn([...ESTADOS_PEDIDO])
  status?: string;
}
