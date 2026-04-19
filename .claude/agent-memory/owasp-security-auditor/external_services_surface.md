---
name: External services attack surface
description: Mapa de servicios externos del stack y sus vectores de seguridad
type: project
---

Servicios externos integrados con secrets en el stack:

- **Supabase** (BD + Storage): `SUPABASE_SERVICE_ROLE_KEY` bypassea RLS. `bulletin-images` y `bulletin-videos` son buckets PÚBLICOS — mover a presigned URLs.
- **MinIO** (legacy): fallback `minioadmin/minioadmin` en `src/lib/storage/minio.ts:13-14`, bucket con `s3:GetObject` público. Considerar retirar si ya se migra a Supabase.
- **Firecrawl**: la allowlist está solo en `/api/debug/scrape-test`. El scraper principal (`src/lib/news/scraper.ts`) lee URLs de `newsSources` tabla sin validar → SSRF si un admin inserta URL interna.
- **Crawl4AI**: `crawl.ottoseguridadai.com` — verificar si el endpoint está autenticado. El cliente en `src/lib/crawl4ai/client.ts` no envía Authorization header.
- **Simli / ElevenLabs**: sin cap de caracteres del texto enviado → coste arbitrario si `news.summary` es grande. Añadir `.slice(0, 2000)`.
- **SendGrid SMTP**: validar CRLF en headers (defensa en profundidad, Nodemailer moderno ya sanea). DKIM/SPF/DMARC a verificar en DNS.
- **Polar**: `POLAR_WEBHOOK_SECRET` configurado PERO no existe ningún endpoint en `src/app/api/webhooks/polar/**`. O se implementa correctamente (HMAC timing-safe + idempotencia) o se eliminan las env vars.

**Why:** El audit original trató "el stack" como solo Next.js + BD + OpenRouter. La realidad es que hay 7+ servicios externos con credenciales server-side; cada uno es un vector.

**How to apply:** Al hacer audit futuro, hacer `grep -i 'env.SOMETHING_KEY\|env.SOMETHING_SECRET' src/` para mapear qué servicios tocan credenciales, y verificar:
1. ¿La credencial está solo server-side?
2. ¿Qué pasa si falta la env var? (fallback a `admin/admin` es el peor caso visto acá).
3. ¿Los recursos que crea el servicio son públicos por defecto? (Supabase bucket `public: true`, MinIO policy).
4. ¿El input enviado al servicio es validado en tamaño/forma?
