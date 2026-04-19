---
name: /api/debug/* endpoints are security-sensitive
description: Los endpoints debug en este repo son fuente recurrente de SSRF, DoS y fuga de claves
type: feedback
---

Los endpoints bajo `src/app/api/debug/*` fueron una fuente significativa de hallazgos Critical/High en el audit de 2026-04-18:
- `POST /api/debug/scrape-test` aceptaba cualquier URL → SSRF vía Firecrawl.
- `GET /api/debug/firecrawl-health` imprimía `apiKey.substring(0, 10)` a stdout.
- Cuatro endpoints debug no tenían autenticación y devolvían `error.stack` en producción.

**Why:** Se crearon como utilidades de depuración durante el desarrollo del pipeline de scraping y se desplegaron a producción sin revisión de seguridad.

**How to apply:**
- Todo endpoint debug nuevo debe usar `requireAdmin()` desde el primer commit.
- Nunca imprimir API keys ni secretos parciales en `console.log`.
- `error.message` y `error.stack` solo deben volver al cliente si `NODE_ENV === "development"`.
- Si un endpoint acepta URLs arbitrarias, aplicar allowlist de hostnames (ver el fix aplicado en `scrape-test/route.ts`).
- Considerar mover estos endpoints a una ruta no predecible o eliminarlos del build de producción.
