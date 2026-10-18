# J&C Bienestar

Landing ecommerce premium para **Power Sex Jarabe 500 ml**, pensada para Mateo en Medellín y el Valle de Aburrá: energía después del camello, compra discreta, pago contraentrega.

## Stack

| App | Tecnología |
|-----|------------|
| `apps/web` | Angular 19 — landing, PDP, carrito, checkout, admin |
| `apps/api` | NestJS + Prisma + SQLite (local) |
| Ops | Contraentrega (COD), sin pasarela electrónica |

## Arranque

```bash
# API
cd apps/api
npm install
npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run start:dev

# Web (otra terminal)
cd apps/web
npm install
npm start
```

- Tienda: http://localhost:4200  
- API: http://localhost:3000/api  
- Admin: http://localhost:4200/admin  
  - Email: `admin@jycbienestar.com`  
  - Password: `CambiaEsto123!` (cámbiala en producción)

## Qué incluye

- Landing de conversión (hero marca → empatía del camello → producto → discreción → CTA)
- Ficha de producto, carrito y checkout contraentrega
- Checkbox obligatorio de **términos y condiciones**
- DIVIPOLA con Antioquia / Valle de Aburrá priorizados
- Panel admin: pedidos, estados, métricas, precio/stock
- Email / WhatsApp preparados (se activan con credenciales en `.env`)

## Docs de marca

- `docs/art-direction.md`
- `docs/copy-guide.md`
- `docs/image-attribution.md`

## Notas

- Base local: SQLite en `apps/api/prisma/dev.db`
- `docker-compose.yml` queda listo si más adelante quieres PostgreSQL
- Reemplaza el placeholder del envase con foto real del jarabe 500 ml cuando la tengas
