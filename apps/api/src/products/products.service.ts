import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, active: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  findAllAdmin() {
    return this.prisma.product.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        sku: dto.sku.trim(),
        name: dto.name.trim(),
        slug: dto.slug.trim(),
        tagline: dto.tagline?.trim() || null,
        description: dto.description.trim(),
        netContent: dto.netContent.trim(),
        ingredients: dto.ingredients.trim(),
        usageText: dto.usageText.trim(),
        manufacturer: dto.manufacturer?.trim() || null,
        priceCents: dto.priceCents,
        stock: dto.stock ?? 0,
        imageUrl: dto.imageUrl?.trim() || null,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException('Producto no encontrado');
    }
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    const linked = await this.prisma.orderItem.count({ where: { productId: id } });
    if (linked > 0) {
      await this.prisma.product.update({
        where: { id },
        data: { active: false, stock: 0 },
      });
      return { ok: true, softDeleted: true };
    }
    try {
      await this.prisma.product.delete({ where: { id } });
      return { ok: true, softDeleted: false };
    } catch {
      throw new BadRequestException('No se pudo eliminar el producto');
    }
  }
}
