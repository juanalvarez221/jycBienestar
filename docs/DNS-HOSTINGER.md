# Cómo apuntar jycbienestar.com (Hostinger → Vercel)

La tienda ya está en **Vercel** (gratis + HTTPS). Solo cambia el DNS en Hostinger.

## En Hostinger → Dominios → jycbienestar.com → Administrar registros DNS

### 1. Registro A del dominio raíz

| Campo | Valor |
|-------|--------|
| Tipo | **A** |
| Nombre | `@` |
| Valor / Contenido | **`76.76.21.21`** |
| TTL | 300 |

Si ya existe un A con `2.57.91.91`, **edítalo** y pon `76.76.21.21` (no dejes los dos).

### 2. Registro de www

Opción recomendada:

| Campo | Valor |
|-------|--------|
| Tipo | **CNAME** |
| Nombre | `www` |
| Valor | **`cname.vercel-dns.com`** |
| TTL | 300 |

(Si Hostinger no acepta ese CNAME, usa A con nombre `www` y valor `76.76.21.21`.)

### 3. Nameservers

Puedes dejar `lunar.dns-parking.com` / `solar.dns-parking.com` **mientras** puedas editar los registros DNS como ahora. No hace falta cambiar nameservers.

### 4. Esperar

Propagación: **5 a 60 minutos**. Luego abre:

- https://jycbienestar.com  
- https://www.jycbienestar.com  

Ambos deben mostrar candado HTTPS (lo activa Vercel solo).

### Tienda provisional (ya funciona)

https://jyc-bienestar.vercel.app
