import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @MinLength(3)
  customerName!: string;

  @IsString()
  @MinLength(7)
  customerPhone!: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsString()
  @MinLength(5)
  addressLine!: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;
}
