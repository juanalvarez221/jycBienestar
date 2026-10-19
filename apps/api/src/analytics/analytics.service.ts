import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackEventDto } from './dto/track-event.dto';
import { CartsService } from '../carts/carts.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly carts: CartsService,
  ) {}

  track(dto: TrackEventDto, userAgent?: string) {
    return this.prisma.analyticsEvent.create({
      data: {
        visitorId: dto.visitorId,
        sessionId: dto.sessionId || null,
        type: dto.type,
        path: dto.path.slice(0, 500),
        label: dto.label?.slice(0, 200) || null,
        element: dto.element?.slice(0, 200) || null,
        xPercent: dto.xPercent ?? null,
        yPercent: dto.yPercent ?? null,
        viewportW: dto.viewportW ?? null,
        viewportH: dto.viewportH ?? null,
        city: dto.city?.slice(0, 120) || null,
        region: dto.region?.slice(0, 120) || null,
        country: dto.country?.slice(0, 80) || null,
        userAgent: userAgent?.slice(0, 400) || null,
        referrer: dto.referrer?.slice(0, 500) || null,
        metaJson: dto.metaJson?.slice(0, 2000) || null,
      },
    });
  }

  async dashboard() {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      base,
      abandonedCarts,
      events30,
      clicks7,
      pageViews7,
      visitors7,
      orders,
    ] = await Promise.all([
      this.orderBaseMetrics(),
      this.carts.listOpen(),
      this.prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since30 } },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
      this.prisma.analyticsEvent.count({
        where: { type: 'click', createdAt: { gte: since7 } },
      }),
      this.prisma.analyticsEvent.count({
        where: { type: 'page_view', createdAt: { gte: since7 } },
      }),
      this.prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since7 } },
        select: { visitorId: true },
        distinct: ['visitorId'],
      }),
      this.prisma.order.findMany({
        select: {
          municipalityCode: true,
          departmentCode: true,
          totalCents: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const abandonedValue = abandonedCarts.reduce(
      (sum, cart) => sum + cart.subtotalCents,
      0,
    );

    const clickGrid = this.buildClickGrid(
      events30.filter((e) => e.type === 'click' && e.xPercent != null && e.yPercent != null),
    );
    const topLabels = this.topCounts(
      events30.filter((e) => e.type === 'click' && e.label).map((e) => e.label!),
      12,
    );
    const topPaths = this.topCounts(
      events30.filter((e) => e.type === 'page_view').map((e) => e.path),
      10,
    );
    const topRegions = this.topCounts(
      events30
        .map((e) => [e.city, e.region, e.country].filter(Boolean).join(', '))
        .filter(Boolean),
      10,
    );

    const places = await this.prisma.geoMunicipality.findMany({
      include: { department: true },
    });
    const placeMap = new Map(places.map((p) => [p.code, p]));
    const byMunicipality = new Map<
      string,
      { name: string; department: string; orders: number; revenueCents: number }
    >();
    for (const order of orders) {
      if (['CANCELADO', 'DEVUELTO', 'CANCELLED', 'RETURNED'].includes(order.status)) {
        continue;
      }
      const place = placeMap.get(order.municipalityCode);
      const key = order.municipalityCode;
      const row = byMunicipality.get(key) ?? {
        name: place?.name ?? order.municipalityCode,
        department: place?.department.name ?? order.departmentCode,
        orders: 0,
        revenueCents: 0,
      };
      row.orders += 1;
      row.revenueCents += order.totalCents;
      byMunicipality.set(key, row);
    }

    const recentEvents = events30.slice(0, 40).map((e) => ({
      id: e.id,
      type: e.type,
      path: e.path,
      label: e.label,
      city: e.city,
      region: e.region,
      createdAt: e.createdAt,
      xPercent: e.xPercent,
      yPercent: e.yPercent,
    }));

    return {
      ...base,
      carritosAbandonados: abandonedCarts.length,
      valorCarritosAbandonadosCentavos: abandonedValue,
      carritos: abandonedCarts.slice(0, 25),
      visitantes7d: visitors7.length,
      vistas7d: pageViews7,
      clics7d: clicks7,
      topClics: topLabels,
      topPaginas: topPaths,
      topUbicaciones: topRegions,
      mapaClics: clickGrid,
      pedidosPorMunicipio: [...byMunicipality.values()]
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 15),
      eventosRecientes: recentEvents,
    };
  }

  private async orderBaseMetrics() {
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
      where: {
        status: { notIn: ['CANCELADO', 'DEVUELTO', 'CANCELLED', 'RETURNED'] },
      },
      _sum: { totalCents: true },
    });

    const phones = await this.prisma.order.findMany({
      select: { customerPhone: true },
    });
    const clientes = new Set(
      phones.map((row) => row.customerPhone.replace(/\D/g, '')).filter(Boolean),
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

  private topCounts(values: string[], limit: number) {
    const map = new Map<string, number>();
    for (const value of values) {
      map.set(value, (map.get(value) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /** Cuadrícula 10×10 con intensidad relativa de clics (0–100). */
  private buildClickGrid(
    clicks: Array<{ xPercent: number | null; yPercent: number | null; path: string }>,
  ) {
    const cells = Array.from({ length: 100 }, (_, i) => ({
      x: i % 10,
      y: Math.floor(i / 10),
      count: 0,
    }));
    for (const click of clicks) {
      if (click.xPercent == null || click.yPercent == null) continue;
      const x = Math.min(9, Math.max(0, Math.floor(click.xPercent / 10)));
      const y = Math.min(9, Math.max(0, Math.floor(click.yPercent / 10)));
      cells[y * 10 + x].count += 1;
    }
    const max = Math.max(1, ...cells.map((c) => c.count));
    return cells.map((c) => ({
      ...c,
      intensity: Math.round((c.count / max) * 100),
    }));
  }
}
