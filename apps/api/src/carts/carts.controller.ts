import { Body, Controller, Post } from '@nestjs/common';
import { CartsService } from './carts.service';
import { UpsertCartDto } from './dto/upsert-cart.dto';

@Controller('carts')
export class CartsController {
  constructor(private readonly carts: CartsService) {}

  @Post()
  save(@Body() dto: UpsertCartDto) {
    return this.carts.upsert(dto);
  }
}
