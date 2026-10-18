import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [OrdersModule, ProductsModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
