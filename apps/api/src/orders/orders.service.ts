import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotificationsService } from '../notifications/notifications.service';
@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private orderNumber() {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 900 + 100);
    return `JYC-${stamp}-${rand}`;
  }

  async create(dto: CreateOrderDto) {
    if (!dto.acceptedTerms) {
      throw new BadRequestException(
        'Debes aceptar los términos y condiciones para continuar',
      );
    }

    if (!dto.items?.length) {
      throw new BadRequestException('El carrito está vacío');
    }

    const municipality = await this.prisma.geoMunicipality.findUnique({
      where: { code: dto.municipalityCode },
    });
    if (!municipality || municipality.departmentCode !== dto.departmentCode) {
      throw new BadRequestException('Municipio o departamento inválido');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('Uno o más productos no están disponibles');
    }

    let subtotal = 0;
    const lineItems = dto.items.map((item) => {
      const product = products.find(
        (p: (typeof products)[number]) => p.id === item.productId,
      )!;
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}`,
        );
      }
      subtotal += product.priceCents * item.quantity;
      return {
        productId: product.id,
        productName: product.name,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
      };
    });

    const rate = await this.prisma.shippingRate.findFirst({
      where: { municipalityCode: dto.municipalityCode, active: true },
    });
    const config = await this.prisma.siteConfig.findUnique({
      where: { id: 'default' },
    });
    const shippingCents =
      rate?.feeCents ?? config?.defaultShippingCents ?? 10000;

    for (const item of dto.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.orderNumber(),
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        customerEmail: dto.customerEmail?.trim() || null,
        addressLine: dto.addressLine.trim(),
        neighborhood: dto.neighborhood?.trim() || null,
        departmentCode: dto.departmentCode,
        municipalityCode: dto.municipalityCode,
        notes: dto.notes?.trim() || null,
        subtotalCents: subtotal,
        shippingCents,
        totalCents: subtotal + shippingCents,
        paymentMethod: 'CONTRAENTREGA',
        acceptedTermsAt: new Date(),
        status: 'RECIBIDO',
        items: { create: lineItems },
        statusEvents: {
          create: {
            status: 'RECIBIDO',
            note: 'Pedido recibido — pago contraentrega',
          },
        },
      },
      include: { items: true, statusEvents: true },
    });

    void this.notifications.notifyOrderCreated(order);
    return order;
  }

  findAllAdmin() {
    return this.prisma.order.findMany({
      include: { items: true, statusEvents: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, statusEvents: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async updateStatus(id: string, status: string, note?: string) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        statusEvents: {
          create: { status, note: note || `Estado: ${status}` },
        },
      },
      include: { items: true, statusEvents: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async metrics() {
    const [
      total,
      entregados,
      cancelados,
      devueltos,
      enPreparacion,
      enviados,
      recibidos,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'ENTREGADO' } }),
      this.prisma.order.count({ where: { status: 'CANCELADO' } }),
      this.prisma.order.count({ where: { status: 'DEVUELTO' } }),
      this.prisma.order.count({ where: { status: 'EN_PREPARACION' } }),
      this.prisma.order.count({ where: { status: 'ENVIADO' } }),
      this.prisma.order.count({ where: { status: 'RECIBIDO' } }),
    ]);

    const ingresos = await this.prisma.order.aggregate({
      where: { status: { notIn: ['CANCELADO', 'DEVUELTO'] } },
      _sum: { totalCents: true },
    });

    return {
      total,
      recibidos,
      enPreparacion,
      enviados,
      entregados,
      cancelados,
      devueltos,
      ingresosCentavos: ingresos._sum.totalCents ?? 0,
    };
  }
}
