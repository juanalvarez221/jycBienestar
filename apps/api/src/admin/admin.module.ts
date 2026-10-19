import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { CartsModule } from '../carts/carts.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    OrdersModule,
    ProductsModule,
    AuthModule,
    CartsModule,
    AnalyticsModule,
    NotificationsModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
