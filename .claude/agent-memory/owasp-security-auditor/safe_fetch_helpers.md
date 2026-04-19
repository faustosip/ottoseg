---
name: Safe fetch helpers
description: Helpers anti-SSRF y tope de bytes en src/lib/net/safe-fetch.ts (+ Simli HLS)
type: project
---

Se añadieron en el grupo B del audit (2026-04-18):

- `src/lib/net/safe-fetch.ts`:
  - `NEWS_SOURCE_ALLOWLIST`: dominios permitidos para scraping
    (`primicias.ec`, `lahora.com.ec`, `elcomercio.com`, `teleamazonas.com`,
    `ecu911.gob.ec`, `news.google.com`, `googleusercontent.com`,
    `lh3.googleusercontent.com`).
  - `assertAllowedUrl(url, { allowlist?, checkDns? })`: valida scheme,
    hostname contra allowlist y que el DNS no resuelva a IP privada/loopback.
  - `fetchWithSizeLimit(url, { maxBytes, timeoutMs, ...RequestInit })`:
    fetch que aborta si el body supera `maxBytes` (default 5 MB).
    Devuelve `{ ok, status, headers, text }`.

- `src/lib/video/simli-url.ts`:
  - `assertAllowedSimliHlsUrl(url)`: solo HTTPS y hostname terminando en
    `.simli.ai` o `.cloudfront.net`. Se llama dos veces (en el route
    handler y dentro de `convertHLStoMP4` / `downloadHLS` como defensa
    en profundidad).

**Why:** Antes el backend hacía `fetch(url)` directo contra cualquier URL
proveniente de la DB o de respuestas JSON de APIs externas (Simli). Eso
abría la puerta a SSRF (golpear 169.254.169.254 / localhost) y a DoS por
respuesta gigante.

**How to apply:**
- Cualquier fetch server-side que parta de una URL influenciada por el
  usuario o por un tercero → `assertAllowedUrl()` + `fetchWithSizeLimit()`.
- Nuevas fuentes de noticias deben añadirse a `NEWS_SOURCE_ALLOWLIST`.
- Si se añaden más provedores de video tipo Simli, extender
  `ALLOWED_HLS_SUFFIXES` en `simli-url.ts`.
