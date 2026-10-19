import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

type OrderMail = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  addressLine: string;
  neighborhood?: string | null;
  municipalityName?: string;
  departmentName?: string;
  notes?: string | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  items: Array<{
    productName: string;
    quantity: number;
    unitPriceCents: number;
  }>;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private money(cents: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  private escape(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private deliveryLine(order: OrderMail) {
    const parts = [
      order.addressLine,
      order.neighborhood || null,
      [order.municipalityName, order.departmentName].filter(Boolean).join(', ') ||
        null,
    ].filter(Boolean) as string[];
    return parts.map((p) => this.escape(p)).join('<br/>');
  }

  private smtpReady() {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    return Boolean(host && user && pass);
  }

  private getTransporter() {
    if (!this.smtpReady()) return null;
    if (!this.transporter) {
      const port = Number(this.config.get('SMTP_PORT') || 587);
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST'),
        port,
        secure: port === 465,
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
    return this.transporter;
  }

  private fromAddress() {
    const from =
      this.config.get<string>('SMTP_FROM') ||
      this.config.get<string>('SMTP_USER') ||
      'bienestarjyc@gmail.com';
    if (from.includes('<')) return from;
    return `JyC Bienestar <${from}>`;
  }

  private panelOrdersUrl() {
    const front = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:4200')
      .split(',')[0]
      .trim();
    const ops = this.config.get<string>('OPS_PATH') || 'h8n3q6w2p4t9';
    return `${front}/${ops}/pedidos`;
  }

  async adminRecipients() {
    const rows = await this.prisma.adminNotifyEmail.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });
    if (rows.length) {
      return [...new Set(rows.map((r) => r.email.trim().toLowerCase()))];
    }
    const raw =
      this.config.get<string>('ADMIN_NOTIFY_EMAIL') ||
      this.config.get<string>('ADMIN_EMAIL') ||
      this.config.get<string>('SMTP_USER') ||
      '';
    return [
      ...new Set(
        raw
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  }

  /** Documento limpio: tipografía, datos y un pie mínimo. Sin “cards” ni relleno. */
  private document(title: string, bodyHtml: string) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${this.escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f5;color:#161816;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px 40px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6a6d68;">JyC Bienestar</p>
    <h1 style="margin:0 0 28px;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#161816;">${this.escape(title)}</h1>
    ${bodyHtml}
    <p style="margin:36px 0 0;padding-top:16px;border-top:1px solid #ddd9d0;font-size:12px;color:#6a6d68;">
      bienestarjyc@gmail.com
    </p>
  </div>
</body>
</html>`;
  }

  private field(label: string, valueHtml: string) {
    return `<p style="margin:0 0 16px;">
  <span style="display:block;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#6a6d68;margin-bottom:4px;">${label}</span>
  <span style="display:block;color:#161816;">${valueHtml}</span>
</p>`;
  }

  private itemsBlock(order: OrderMail) {
    const lines = order.items
      .map(
        (item) =>
          `${item.quantity} × ${this.escape(item.productName)} — ${this.money(item.unitPriceCents * item.quantity)}`,
      )
      .join('<br/>');
    return `${lines}<br/><br/>Subtotal ${this.money(order.subtotalCents)} · Envío ${this.money(order.shippingCents)}<br/><strong>Total ${this.money(order.totalCents)}</strong>`;
  }

  private customerHtml(order: OrderMail) {
    return `
${this.field('Cliente', this.escape(order.customerName))}
${this.field('Pedido', this.escape(order.orderNumber))}
${this.field('Detalle', this.itemsBlock(order))}
${this.field('Entrega', this.deliveryLine(order))}
${this.field('Pago', 'Contraentrega al recibir')}
<p style="margin:24px 0 0;color:#3a3d39;">
  Si hay que cambiar dirección o teléfono, responde a este correo indicando el número de pedido.
</p>`;
  }

  private customerText(order: OrderMail) {
    const place = [order.municipalityName, order.departmentName]
      .filter(Boolean)
      .join(', ');
    const items = order.items
      .map(
        (i) =>
          `${i.quantity} × ${i.productName} — ${this.money(i.unitPriceCents * i.quantity)}`,
      )
      .join('\n');
    return [
      `JyC Bienestar — Pedido ${order.orderNumber}`,
      '',
      order.customerName,
      '',
      items,
      `Subtotal ${this.money(order.subtotalCents)}`,
      `Envío ${this.money(order.shippingCents)}`,
      `Total ${this.money(order.totalCents)}`,
      '',
      'Entrega',
      order.addressLine,
      order.neighborhood || '',
      place,
      '',
      'Pago: contraentrega al recibir',
      '',
      'Cambios de dirección o teléfono: responde a este correo con el número de pedido.',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  private adminHtml(order: OrderMail) {
    const contact = [
      this.escape(order.customerName),
      this.escape(order.customerPhone),
      order.customerEmail ? this.escape(order.customerEmail) : null,
    ]
      .filter(Boolean)
      .join('<br/>');

    const notes = order.notes?.trim()
      ? this.field('Nota del cliente', this.escape(order.notes.trim()))
      : '';

    return `
${this.field('Pedido', `${this.escape(order.orderNumber)} · ${this.money(order.totalCents)}`)}
${this.field('Cliente', contact)}
${this.field('Entrega', this.deliveryLine(order))}
${this.field('Detalle', this.itemsBlock(order))}
${notes}
${this.field('Pago', 'Contraentrega')}
<p style="margin:28px 0 0;">
  <a href="${this.panelOrdersUrl()}" style="color:#1a3f3a;font-weight:700;text-decoration:underline;">Abrir pedidos</a>
</p>`;
  }

  private adminText(order: OrderMail) {
    const place = [order.municipalityName, order.departmentName]
      .filter(Boolean)
      .join(', ');
    const items = order.items
      .map(
        (i) =>
          `${i.quantity} × ${i.productName} — ${this.money(i.unitPriceCents * i.quantity)}`,
      )
      .join('\n');
    return [
      `Pedido ${order.orderNumber} · ${this.money(order.totalCents)}`,
      '',
      order.customerName,
      order.customerPhone,
      order.customerEmail || '',
      '',
      order.addressLine,
      order.neighborhood || '',
      place,
      '',
      items,
      `Total ${this.money(order.totalCents)}`,
      order.notes ? `\nNota: ${order.notes}` : '',
      '',
      `Panel: ${this.panelOrdersUrl()}`,
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  async sendTestToAdmins() {
    const transport = this.getTransporter();
    if (!transport) {
      return { ok: false as const, reason: 'smtp_missing' };
    }
    const admins = await this.adminRecipients();
    if (!admins.length) {
      return { ok: false as const, reason: 'no_recipients' };
    }
    const when = new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date());
    await transport.sendMail({
      from: this.fromAddress(),
      to: admins.join(', '),
      subject: `JyC · Prueba de correo · ${when}`,
      html: this.document(
        'Prueba de correo',
        `
${this.field('Estado', 'SMTP operativo')}
${this.field('Remitente', this.escape(this.config.get<string>('SMTP_USER') || 'bienestarjyc@gmail.com'))}
${this.field('Destinatarios', admins.map((e) => this.escape(e)).join('<br/>'))}
${this.field('Hora', this.escape(when))}
<p style="margin:20px 0 0;color:#3a3d39;">Los avisos de pedidos nuevos usarán este mismo canal.</p>`,
      ),
      text: [
        'JyC Bienestar — Prueba de correo',
        `Remitente: ${this.config.get<string>('SMTP_USER')}`,
        `Destinatarios: ${admins.join(', ')}`,
        `Hora: ${when}`,
        'SMTP operativo. Los avisos de pedidos usarán este canal.',
      ].join('\n'),
    });
    return { ok: true as const, recipients: admins };
  }

  async notifyOrderCreated(order: OrderMail) {
    const transport = this.getTransporter();
    if (!transport) {
      this.logger.debug(
        `SMTP no configurado — pedido ${order.orderNumber} sin correo (cliente/admin)`,
      );
      return { sent: false, reason: 'smtp_missing' as const };
    }

    const results: string[] = [];

    if (order.customerEmail) {
      try {
        await transport.sendMail({
          from: this.fromAddress(),
          to: order.customerEmail,
          subject: `Pedido ${order.orderNumber} · JyC Bienestar`,
          html: this.document(
            `Pedido ${order.orderNumber}`,
            this.customerHtml(order),
          ),
          text: this.customerText(order),
        });
        results.push('customer');
        this.logger.log(`Correo cliente enviado → ${order.customerEmail}`);
      } catch (err) {
        this.logger.error(`Fallo correo cliente ${order.orderNumber}`, err as Error);
      }
    }

    const admins = await this.adminRecipients();
    if (admins.length) {
      try {
        await transport.sendMail({
          from: this.fromAddress(),
          to: admins.join(', '),
          subject: `${order.orderNumber} · ${order.customerName} · ${this.money(order.totalCents)}`,
          html: this.document(
            `Pedido ${order.orderNumber}`,
            this.adminHtml(order),
          ),
          text: this.adminText(order),
        });
        results.push('admin');
        this.logger.log(`Correo admin enviado → ${admins.join(', ')}`);
      } catch (err) {
        this.logger.error(`Fallo correo admin ${order.orderNumber}`, err as Error);
      }
    }

    return { sent: results.length > 0, channels: results };
  }
}
