# Publicar jycbienestar.com — pasos finales (5–10 min)

## Ya está listo

- Código en GitHub: https://github.com/juanalvarez221/jycBienestar
- Tienda en Vercel (HTTPS): https://jyc-bienestar.vercel.app
- Dominio añadido en Vercel: `jycbienestar.com` + `www`

---

## 1) DNS en Hostinger (obligatorio)

En **Administrar registros DNS**:

| Acción | Tipo | Nombre | Valor nuevo |
|--------|------|--------|-------------|
| Editar | **A** | `@` | `76.76.21.21` |
| Editar | **CNAME** o **A** | `www` | CNAME → `cname.vercel-dns.com` **o** A → `76.76.21.21` |

Borra el A antiguo `2.57.91.91` (parking).

En 5–60 min: https://jycbienestar.com

---

## 2) Base de datos Neon (gratis)

1. https://console.neon.tech → crear proyecto `jyc-bienestar`
2. Copia **Connection string** (PostgreSQL)

---

## 3) API en Render (gratis)

1. https://dashboard.render.com → New → Blueprint
2. Conecta el repo `juanalvarez221/jycBienestar`
3. Variables:
   - `DATABASE_URL` = pegar string de Neon
   - `ADMIN_PASSWORD` = contraseña fuerte
4. Deploy → URL tipo `https://jyc-bienestar-api.onrender.com`

Si la URL de Render es distinta, avísame y actualizo el proxy en `apps/web/vercel.json`.

---

## Comprobar

1. https://jyc-bienestar.vercel.app → landing
2. https://jycbienestar.com → tras DNS
3. Pedido de prueba en `/checkout` (cuando la API esté arriba)
4. Admin: `/admin`
