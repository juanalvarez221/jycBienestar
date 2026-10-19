# Publicar J&C Bienestar — jycbienestar.com

## Arquitectura (gratis + HTTPS)

| Pieza | Servicio | Rol |
|-------|----------|-----|
| Tienda (Angular) | **Vercel** | HTTPS, CDN, dominio |
| API (NestJS) | **Render** (free) | Pedidos, admin, geo |
| Base de datos | **Neon** (free PostgreSQL) | Persistencia |

## 1. Base de datos Neon (2 minutos)

1. Entra a https://console.neon.tech y crea proyecto `jyc-bienestar`
2. Copia el **connection string** (`postgresql://...`)

## 2. API en Render

1. Entra a https://dashboard.render.com
2. **New → Blueprint** → conecta el repo de GitHub `jycBienestar`
3. En variables:
   - `DATABASE_URL` = connection string de Neon
   - `ADMIN_PASSWORD` = contraseña fuerte del admin
4. Deploy. Anota la URL, ej: `https://jyc-bienestar-api.onrender.com`

## 3. Frontend en Vercel

1. `npx vercel login` (navegador)
2. Desde `apps/web`: `npx vercel --prod`
3. En Vercel → Project → Settings → Domains → añade `jycbienestar.com` y `www.jycbienestar.com`
4. Si la URL de Render no es `jyc-bienestar-api.onrender.com`, edita `apps/web/vercel.json` (rewrite `/api`)

## 4. DNS en Hostinger (tu panel)

Nameservers actuales de parking están bien si puedes editar registros DNS.

**Edita / crea:**

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| **A** | `@` | `76.76.21.21` | 300 |
| **CNAME** | `www` | `cname.vercel-dns.com` | 300 |

Quita o cambia el A actual `2.57.91.91` (parking Hostinger).

Propagación: 5–60 minutos. SSL lo activa Vercel solo.

## 5. Verificación

- https://jycbienestar.com → landing
- https://jycbienestar.com/checkout → pedido
- https://jycbienestar.com/admin → panel
