import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as typeof import('bcrypt');
import { DEPARTMENTS, MUNICIPALITIES, VALLE_SHIPPING } from './seed-geo';

const prisma = new PrismaClient();

const TERMS = `
<h1>Términos y condiciones</h1>
<p>Estos términos regulan la compra de productos a través del sitio de J&amp;C Bienestar. Al confirmar un pedido, usted declara haber leído y aceptado estas condiciones.</p>
<h2>Pedidos y pago</h2>
<p>El pago se realiza contraentrega (efectivo o medio acordado con el mensajero) al momento de recibir el pedido. El precio y el costo de envío se confirman antes de finalizar la compra.</p>
<h2>Entrega</h2>
<p>Priorizamos Medellín y el Valle de Aburrá. Los tiempos estimados son referenciales y pueden variar por zona, clima o disponibilidad del mensajero.</p>
<h2>Datos personales</h2>
<p>Usamos sus datos únicamente para gestionar el pedido, la entrega y la atención al cliente, conforme a nuestra Política de privacidad.</p>
<h2>Contacto</h2>
<p>Para inquietudes sobre su pedido, escríbanos a los canales publicados en el sitio.</p>
`;

const PRIVACY = `
<h1>Política de privacidad</h1>
<p>J&amp;C Bienestar trata los datos personales que usted suministra en el checkout (nombre, teléfono, dirección, correo opcional) con la finalidad de procesar y entregar su pedido.</p>
<h2>Finalidades</h2>
<ul>
<li>Gestionar pedidos y entregas contraentrega.</li>
<li>Contactarlo sobre el estado de su compra.</li>
<li>Atención al cliente.</li>
</ul>
<h2>Derechos</h2>
<p>Puede solicitar consulta, actualización o eliminación de sus datos contactándonos por los canales del sitio, de acuerdo con la Ley 1581 de 2012 y normas complementarias.</p>
`;

async function main() {
  for (const d of DEPARTMENTS) {
    await prisma.geoDepartment.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: d,
    });
  }

  for (const m of MUNICIPALITIES) {
    await prisma.geoMunicipality.upsert({
      where: { code: m.code },
      update: {
        name: m.name,
        departmentCode: m.departmentCode,
        isPriority: !!m.isPriority,
      },
      create: {
        code: m.code,
        name: m.name,
        departmentCode: m.departmentCode,
        isPriority: !!m.isPriority,
      },
    });
  }

  for (const rate of VALLE_SHIPPING) {
    const existing = await prisma.shippingRate.findFirst({
      where: { municipalityCode: rate.municipalityCode },
    });
    if (existing) {
      await prisma.shippingRate.update({
        where: { id: existing.id },
        data: rate,
      });
    } else {
      await prisma.shippingRate.create({ data: rate });
    }
  }

  await prisma.product.upsert({
    where: { slug: 'power-sex-jarabe-500ml' },
    update: {},
    create: {
      sku: 'PSX-500',
      name: 'Power Sex Jarabe 500 ml',
      slug: 'power-sex-jarabe-500ml',
      tagline: 'Energía después del camello',
      description:
        'Presentación en jarabe de 500 ml pensada para quienes buscan recuperar ritmo al final del día. Una opción de bienestar para el hogar, con entrega discreta a domicilio en Medellín y el Valle de Aburrá.',
      netContent: '500 ml',
      ingredients:
        'Consultar información del envase y del fabricante. Los datos de composición se actualizan según la etiqueta del lote comercializado.',
      usageText:
        'Siga las indicaciones de uso impresas en la etiqueta del producto. No exceda la porción sugerida por el fabricante.',
      manufacturer: 'Según rotulado del envase',
      priceCents: 89000,
      stock: 50,
      imageUrl: '/assets/product-placeholder.svg',
      active: true,
    },
  });

  const password = process.env.ADMIN_PASSWORD || 'CambiaEsto123!';
  const email = process.env.ADMIN_EMAIL || 'admin@jycbienestar.com';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      name: 'Administrador J&C',
    },
  });

  await prisma.siteConfig.upsert({
    where: { id: 'default' },
    update: {
      termsHtml: TERMS,
      privacyHtml: PRIVACY,
      contactWhatsapp: '573000000000',
      contactEmail: 'pedidos@jycbienestar.com',
      contactPhone: '+57 300 000 0000',
      defaultShippingCents: 10000,
    },
    create: {
      id: 'default',
      termsHtml: TERMS,
      privacyHtml: PRIVACY,
      contactWhatsapp: '573000000000',
      contactEmail: 'pedidos@jycbienestar.com',
      contactPhone: '+57 300 000 0000',
      defaultShippingCents: 10000,
      termsVersion: '1.0',
    },
  });

  console.log('Seed OK — producto, geo, admin y config listos');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
