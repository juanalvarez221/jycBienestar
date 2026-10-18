import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ESTADOS_PEDIDO } from '../orders/order-status';

class UpdateStatusDto {
  @IsIn([...ESTADOS_PEDIDO])
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly orders: OrdersService,
    private readonly products: ProductsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('metrics')
  metrics() {
    return this.orders.metrics();
  }

  @Get('orders')
  listOrders() {
    return this.orders.findAllAdmin();
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Patch('orders/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.orders.updateStatus(id, dto.status, dto.note);
  }

  @Get('products')
  listProducts() {
    return this.products.findAllAdmin();
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Get('config')
  getConfig() {
    return this.prisma.siteConfig.findUnique({ where: { id: 'default' } });
  }
}
