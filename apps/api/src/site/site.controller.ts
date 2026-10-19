import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('site')
export class SiteController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('config')
  async config() {
    const config = await this.prisma.siteConfig.findUnique({
      where: { id: 'default' },
    });
    return {
      contactPhone: config?.contactPhone,
      contactWhatsapp: config?.contactWhatsapp,
      contactEmail: config?.contactEmail,
      termsVersion: config?.termsVersion,
      termsHtml: config?.termsHtml,
      privacyHtml: config?.privacyHtml,
    };
  }
}
