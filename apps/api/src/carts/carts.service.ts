import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCartDto } from './dto/upsert-cart.dto';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  upsert(dto: UpsertCartDto) {
    const data = {
      itemsJson: JSON.stringify(dto.items),
      subtotalCents: dto.subtotalCents,
      customerName: dto.customerName?.trim() || null,
      customerPhone: dto.customerPhone?.trim() || null,
      customerEmail: dto.customerEmail?.trim() || null,
      addressLine: dto.addressLine?.trim() || null,
      neighborhood: dto.neighborhood?.trim() || null,
      departmentCode: dto.departmentCode || null,
      municipalityCode: dto.municipalityCode || null,
      recoveredAt: dto.items.length === 0 ? new Date() : null,
    };
    return this.prisma.abandonedCart.upsert({
      where: { visitorId: dto.visitorId },
      create: { visitorId: dto.visitorId, ...data },
      update: data,
    });
  }

  recover(visitorId?: string) {
    if (!visitorId) return Promise.resolve(null);
    return this.prisma.abandonedCart.updateMany({
      where: { visitorId },
      data: { recoveredAt: new Date(), itemsJson: '[]', subtotalCents: 0 },
    });
  }

  async listOpen() {
    const rows = await this.prisma.abandonedCart.findMany({
      where: {
        recoveredAt: null,
        subtotalCents: { gt: 0 },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.mapCart(row));
  }

  async remove(id: string) {
    await this.prisma.abandonedCart.delete({ where: { id } }).catch(() => null);
    return { ok: true };
  }

  private mapCart(row: {
    id: string;
    visitorId: string;
    itemsJson: string;
    subtotalCents: number;
    customerName: string | null;
    customerPhone: string | null;
    customerEmail: string | null;
    addressLine: string | null;
    neighborhood: string | null;
    departmentCode: string | null;
    municipalityCode: string | null;
    recoveredAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    let items: {
      productId: string;
      name: string;
      quantity: number;
      unitPriceCents: number;
    }[] = [];
    try {
      items = JSON.parse(row.itemsJson || '[]');
    } catch {
      items = [];
    }
    return { ...row, items };
  }
}
