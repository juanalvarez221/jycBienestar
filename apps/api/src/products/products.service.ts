import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProductDto } from './dto/update-product.dto';

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

  async update(id: string, dto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException('Producto no encontrado');
    }
  }
}
