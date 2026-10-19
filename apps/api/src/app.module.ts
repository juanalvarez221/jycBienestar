import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { GeoModule } from './geo/geo.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SiteModule } from './site/site.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CartsModule } from './carts/carts.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProductsModule,
    OrdersModule,
    GeoModule,
    AuthModule,
    AdminModule,
    SiteModule,
    NotificationsModule,
    CartsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
