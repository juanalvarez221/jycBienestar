# DNS Hostinger → jycbienestar.com (Vercel)

En tu panel Hostinger (**Administrar registros DNS**):

## Cambios

1. **Edita** el registro **A** de `@`  
   - Valor actual: `2.57.91.91` (parking)  
   - Nuevo valor: `76.76.21.21` (Vercel)

2. **Edita** el **CNAME** de `www`  
   - Valor actual: `jycbienestar.com`  
   - Nuevo valor: `cname.vercel-dns.com`

3. Guarda. Espera 5–60 minutos.

## Nameservers

Puedes dejar `lunar.dns-parking.com` / `solar.dns-parking.com` **si** Hostinger te deja editar DNS como ahora.  
Si Vercel pide nameservers propios, usa el botón **Cambiar nameservers** solo con los que Vercel indique en el proyecto.

## Comprobar

```bash
nslookup jycbienestar.com
```

Debe resolver cerca de `76.76.21.21` y abrir `https://jycbienestar.com` con candado SSL.
