import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateOrderDto } from '../orders/dto/update-order.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  CreateNotifyEmailDto,
  UpdateNotifyEmailDto,
} from './dto/notify-email.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CartsService } from '../carts/carts.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    private readonly carts: CartsService,
    private readonly analytics: AnalyticsService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get('metrics')
  metrics() {
    return this.analytics.dashboard();
  }

  @Get('orders')
  listOrders() {
    return this.orders.findAllAdmin();
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Patch('orders/:id')
  updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.update(id, dto);
  }

  @Patch('orders/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.orders.updateStatus(id, dto.status, dto.note);
  }

  @Delete('orders/:id')
  removeOrder(@Param('id') id: string) {
    return this.orders.remove(id);
  }

  @Get('customers')
  listCustomers() {
    return this.orders.listCustomers();
  }

  @Get('customers/:phoneKey')
  getCustomer(@Param('phoneKey') phoneKey: string) {
    return this.orders.customerDetail(phoneKey);
  }

  @Patch('customers/:phoneKey')
  updateCustomer(
    @Param('phoneKey') phoneKey: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.orders.updateCustomer(phoneKey, dto);
  }

  @Delete('customers/:phoneKey')
  removeCustomer(@Param('phoneKey') phoneKey: string) {
    return this.orders.removeCustomer(phoneKey);
  }

  @Get('carts')
  listCarts() {
    return this.carts.listOpen();
  }

  @Delete('carts/:id')
  removeCart(@Param('id') id: string) {
    return this.carts.remove(id);
  }

  @Get('products')
  listProducts() {
    return this.products.findAllAdmin();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete('products/:id')
  removeProduct(@Param('id') id: string) {
    return this.products.remove(id);
  }

  @Get('config')
  getConfig() {
    return this.prisma.siteConfig.findUnique({ where: { id: 'default' } });
  }

  @Get('notify-emails')
  listNotifyEmails() {
    return this.prisma.adminNotifyEmail.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post('notify-emails/test')
  async testNotifyEmails() {
    const result = await this.notifications.sendTestToAdmins();
    if (!result.ok) {
      throw new BadRequestException(
        result.reason === 'smtp_missing'
          ? 'SMTP no configurado. Revisa SMTP_USER y SMTP_PASS en el servidor.'
          : 'No hay destinatarios activos.',
      );
    }
    return result;
  }

  @Post('notify-emails')
  async createNotifyEmail(@Body() dto: CreateNotifyEmailDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.adminNotifyEmail.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('Ese correo ya está en la lista');
    }
    return this.prisma.adminNotifyEmail.create({
      data: {
        email,
        name: dto.name?.trim() || null,
        active: dto.active ?? true,
      },
    });
  }

  @Patch('notify-emails/:id')
  async updateNotifyEmail(
    @Param('id') id: string,
    @Body() dto: UpdateNotifyEmailDto,
  ) {
    const current = await this.prisma.adminNotifyEmail.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Correo no encontrado');
    const email = dto.email?.trim().toLowerCase();
    if (email && email !== current.email) {
      const clash = await this.prisma.adminNotifyEmail.findUnique({
        where: { email },
      });
      if (clash) {
        throw new BadRequestException('Ese correo ya está en la lista');
      }
    }
    return this.prisma.adminNotifyEmail.update({
      where: { id },
      data: {
        ...(email ? { email } : {}),
        ...(dto.name !== undefined
          ? { name: dto.name?.trim() || null }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  @Delete('notify-emails/:id')
  async removeNotifyEmail(@Param('id') id: string) {
    try {
      await this.prisma.adminNotifyEmail.delete({ where: { id } });
      return { ok: true };
    } catch {
      throw new NotFoundException('Correo no encontrado');
    }
  }
}
