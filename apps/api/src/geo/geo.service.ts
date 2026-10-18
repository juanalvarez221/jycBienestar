import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ANTIOQUIA = '05';
const VALLE_PRIORITY = new Set([
  '05001', // Medellín
  '05088', // Bello
  '05360', // Itagüí
  '05266', // Envigado
  '05631', // Sabaneta
  '05380', // La Estrella
  '05212', // Copacabana
  '05308', // Girardota
  '05079', // Barbosa
  '05129', // Caldas
]);

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async departments() {
    const deps = await this.prisma.geoDepartment.findMany({
      orderBy: { name: 'asc' },
    });
    return deps.sort(
      (a: { code: string; name: string }, b: { code: string; name: string }) => {
        if (a.code === ANTIOQUIA) return -1;
        if (b.code === ANTIOQUIA) return 1;
        return a.name.localeCompare(b.name, 'es');
      },
    );
  }

  async municipalities(departmentCode: string) {
    const list = await this.prisma.geoMunicipality.findMany({
      where: { departmentCode },
      orderBy: { name: 'asc' },
    });
    if (!list.length) {
      throw new NotFoundException('Departamento sin municipios');
    }

    return list.sort((a: (typeof list)[number], b: (typeof list)[number]) => {
      const ap = VALLE_PRIORITY.has(a.code) || a.isPriority ? 0 : 1;
      const bp = VALLE_PRIORITY.has(b.code) || b.isPriority ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const ao = [...VALLE_PRIORITY].indexOf(a.code);
      const bo = [...VALLE_PRIORITY].indexOf(b.code);
      if (ao !== -1 || bo !== -1) {
        return (ao === -1 ? 99 : ao) - (bo === -1 ? 99 : bo);
      }
      return a.name.localeCompare(b.name, 'es');
    });
  }

  async shippingQuote(municipalityCode: string) {
    const rate = await this.prisma.shippingRate.findFirst({
      where: { municipalityCode, active: true },
    });
    if (rate) {
      return {
        feeCents: rate.feeCents,
        etaLabel: rate.etaLabel,
        zoneLabel: rate.zoneLabel,
      };
    }
    const config = await this.prisma.siteConfig.findUnique({
      where: { id: 'default' },
    });
    return {
      feeCents: config?.defaultShippingCents ?? 12000,
      etaLabel: '2 a 4 días hábiles',
      zoneLabel: 'Resto del país',
    };
  }
}
