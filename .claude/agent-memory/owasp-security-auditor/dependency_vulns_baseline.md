---
name: Dependency vulnerabilities snapshot 2026-04-18
description: Estado de pnpm audit en el audit de 2026-04-18 para tener baseline en el próximo
type: project
---

`pnpm audit --prod` reportó 36 vulnerabilidades al 2026-04-18:
- 2 Critical: `better-auth` (2FA bypass), `fast-xml-parser` (entity encoding bypass, vía minio).
- 14 High, incluyendo: `next@15.4.10` (2 CVEs DoS), `drizzle-orm` (SQL injection en arrays), `kysely` (SQL injection), `lodash` (code injection, vía minio), `undici` (3 CVEs WebSocket), `better-auth`/`rou3` (path traversal), `serialize-javascript`, `webpack`, `defu` (prototype pollution), `nodemailer` (SMTP injection).
- 14 Moderate, 6 Low.

**Why:** No se han aplicado actualizaciones porque `better-auth` y `drizzle-orm` mayores requieren validación manual, y `minio` arrastra `lodash`/`fast-xml-parser` sin path de upgrade trivial.

**How to apply:**
- En el próximo audit, comparar contra este baseline para saber qué vulns son nuevas.
- Priorizar siempre `better-auth` y `drizzle-orm` por impacto directo (auth y SQL).
- Si se decide reemplazar `minio` por Supabase Storage (ya parcialmente hecho para imágenes), muchas de las critical de lodash/fast-xml-parser desaparecen.
- Antes de recomendar `pnpm up <pkg>`, verificar el changelog del paquete — especialmente BetterAuth tuvo cambios breaking recientes.
