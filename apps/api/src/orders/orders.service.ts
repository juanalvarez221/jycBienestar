import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateCustomerDto } from '../admin/dto/update-customer.dto';
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
      rate?.feeCents ?? config?.defaultShippingCents ?? 1_000_000;

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

    if (dto.visitorId) {
      await this.prisma.abandonedCart.updateMany({
        where: { visitorId: dto.visitorId },
        data: { recoveredAt: new Date(), itemsJson: '[]', subtotalCents: 0 },
      });
    }

    const [placed] = await this.withPlace([order]);
    void this.notifications.notifyOrderCreated(placed);
    return placed;
  }

  private phoneKey(phone: string) {
    return phone.replace(/\D/g, '');
  }

  private async placeMap() {
    const municipalities = await this.prisma.geoMunicipality.findMany({
      include: { department: true },
    });
    return new Map(municipalities.map((item) => [item.code, item]));
  }

  private async withPlace<T extends { municipalityCode: string }>(rows: T[]) {
    const places = await this.placeMap();
    return rows.map((row) => {
      const place = places.get(row.municipalityCode);
      return {
        ...row,
        municipalityName: place?.name ?? row.municipalityCode,
        departmentName: place?.department.name ?? '',
      };
    });
  }

  private orderInclude() {
    return {
      items: true,
      statusEvents: { orderBy: { createdAt: 'asc' as const } },
    };
  }

  findAllAdmin() {
    return this.prisma.order
      .findMany({
        include: this.orderInclude(),
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) => this.withPlace(rows));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude(),
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    const [withPlace] = await this.withPlace([order]);
    return withPlace;
  }

  async updateStatus(id: string, status: string, note?: string) {
    await this.findOne(id);
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        statusEvents: {
          create: { status, note: note || `Estado: ${status}` },
        },
      },
      include: this.orderInclude(),
    });
    const [withPlace] = await this.withPlace([updated]);
    return withPlace;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const current = await this.findOne(id);
    const data: {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string | null;
      addressLine?: string;
      neighborhood?: string | null;
      notes?: string | null;
      status?: string;
      statusEvents?: { create: { status: string; note: string } };
    } = {};

    if (dto.customerName !== undefined) data.customerName = dto.customerName.trim();
    if (dto.customerPhone !== undefined) data.customerPhone = dto.customerPhone.trim();
    if (dto.customerEmail !== undefined) {
      data.customerEmail = dto.customerEmail.trim() || null;
    }
    if (dto.addressLine !== undefined) data.addressLine = dto.addressLine.trim();
    if (dto.neighborhood !== undefined) {
      data.neighborhood = dto.neighborhood.trim() || null;
    }
    if (dto.notes !== undefined) data.notes = dto.notes.trim() || null;
    if (dto.status && dto.status !== current.status) {
      data.status = dto.status;
      data.statusEvents = {
        create: {
          status: dto.status,
          note: 'Estado actualizado desde el panel',
        },
      };
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data,
      include: this.orderInclude(),
    });
    const [withPlace] = await this.withPlace([updated]);
    return withPlace;
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      if (order.status !== 'ENTREGADO') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      await tx.order.delete({ where: { id } });
    });
    return { ok: true };
  }

  private async ordersMatchingPhone(phoneKey: string) {
    const orders = await this.prisma.order.findMany({
      include: this.orderInclude(),
      orderBy: { createdAt: 'desc' },
    });
    return orders.filter((order) => this.phoneKey(order.customerPhone) === phoneKey);
  }

  private summarize(
    phoneKey: string,
    list: Array<{
      customerName: string;
      customerPhone: string;
      customerEmail: string | null;
      addressLine: string;
      neighborhood: string | null;
      municipalityName: string;
      departmentName: string;
      status: string;
      totalCents: number;
      createdAt: Date;
    }>,
  ) {
    const latest = list[0];
    const closed = new Set(['ENTREGADO', 'CANCELADO', 'DEVUELTO']);
    return {
      phoneKey,
      customerName: latest.customerName,
      customerPhone: latest.customerPhone,
      customerEmail: latest.customerEmail,
      addressLine: latest.addressLine,
      neighborhood: latest.neighborhood,
      municipalityName: latest.municipalityName,
      departmentName: latest.departmentName,
      ordersCount: list.length,
      openCount: list.filter((order) => !closed.has(order.status)).length,
      spentCents: list
        .filter((order) => order.status !== 'CANCELADO' && order.status !== 'DEVUELTO')
        .reduce((sum, order) => sum + order.totalCents, 0),
      lastOrderAt: latest.createdAt,
    };
  }

  async listCustomers() {
    const orders = await this.withPlace(
      await this.prisma.order.findMany({ orderBy: { createdAt: 'desc' } }),
    );
    const groups = new Map<string, typeof orders>();
    for (const order of orders) {
      const key = this.phoneKey(order.customerPhone) || order.id;
      const bucket = groups.get(key) ?? [];
      bucket.push(order);
      groups.set(key, bucket);
    }
    return [...groups.entries()].map(([phoneKey, list]) =>
      this.summarize(phoneKey, list),
    );
  }

  async customerDetail(phoneKey: string) {
    const matches = await this.ordersMatchingPhone(phoneKey);
    if (!matches.length) throw new NotFoundException('Cliente no encontrado');
    const orders = await this.withPlace(matches);
    return { ...this.summarize(phoneKey, orders), orders };
  }

  async updateCustomer(phoneKey: string, dto: UpdateCustomerDto) {
    const matches = await this.ordersMatchingPhone(phoneKey);
    if (!matches.length) throw new NotFoundException('Cliente no encontrado');
    await this.prisma.order.updateMany({
      where: { id: { in: matches.map((order) => order.id) } },
      data: {
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        customerEmail: dto.customerEmail?.trim() || null,
        addressLine: dto.addressLine.trim(),
        neighborhood: dto.neighborhood?.trim() || null,
      },
    });
    return this.customerDetail(this.phoneKey(dto.customerPhone));
  }

  async removeCustomer(phoneKey: string) {
    const matches = await this.ordersMatchingPhone(phoneKey);
    if (!matches.length) throw new NotFoundException('Cliente no encontrado');
    for (const order of matches) {
      await this.remove(order.id);
    }
    return { ok: true, removed: matches.length };
  }

  async metrics() {
    const count = (statuses: string[]) =>
      this.prisma.order.count({ where: { status: { in: statuses } } });

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
      count(['ENTREGADO', 'DELIVERED']),
      count(['CANCELADO', 'CANCELLED']),
      count(['DEVUELTO', 'RETURNED']),
      count(['EN_PREPARACION', 'PREPARING']),
      count(['ENVIADO', 'SHIPPED']),
      count(['RECIBIDO', 'RECEIVED']),
    ]);

    const ingresos = await this.prisma.order.aggregate({
      where: { status: { notIn: ['CANCELADO', 'DEVUELTO', 'CANCELLED', 'RETURNED'] } },
      _sum: { totalCents: true },
    });

    const phones = await this.prisma.order.findMany({
      select: { customerPhone: true },
    });
    const clientes = new Set(
      phones.map((row) => this.phoneKey(row.customerPhone)).filter(Boolean),
    ).size;

    return {
      total,
      recibidos,
      enPreparacion,
      enviados,
      entregados,
      cancelados,
      devueltos,
      ingresosCentavos: ingresos._sum.totalCents ?? 0,
      clientes,
      porAtender: recibidos + enPreparacion,
    };
  }
}
