import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly config: ConfigService) {}

  async notifyOrderCreated(order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    totalCents: number;
  }) {
    const smtp = this.config.get<string>('SMTP_HOST');
    const wa = this.config.get<string>('WHATSAPP_TOKEN');

    if (smtp && order.customerEmail) {
      this.logger.log(
        `[Email listo] Confirmación ${order.orderNumber} → ${order.customerEmail}`,
      );
      // Integra SMTP real cuando existan credenciales verificadas.
    } else {
      this.logger.debug(
        `Email omitido (sin SMTP o sin correo) — pedido ${order.orderNumber}`,
      );
    }

    if (wa) {
      this.logger.log(
        `[WhatsApp listo] Aviso ${order.orderNumber} → ${order.customerPhone}`,
      );
    } else {
      this.logger.debug(
        `WhatsApp omitido (sin credenciales) — pedido ${order.orderNumber}`,
      );
    }
  }
}
