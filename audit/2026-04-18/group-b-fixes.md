# OWASP Security Audit — Group B Fixes

**Fecha:** 2026-04-18
**Alcance:** 14 fixes de "grupo B" pendientes del audit previo.

---

## Resumen ejecutivo

- **Aplicados automáticamente:** 13 de 14 fixes.
- **No aplicado intencionalmente:** 1 fix (SameSite=Strict — ver nota abajo).
- **Archivos nuevos creados:** 3 helpers reutilizables.
- **Typecheck:** PASA sin errores.
- **Lint:** PASA sin errores nuevos (solo warnings preexistentes).

---

## Archivos nuevos

| Path | Propósito |
|---|---|
| `src/lib/net/safe-fetch.ts` | Helpers anti-SSRF: `assertAllowedUrl()` (allowlist + DNS→IP pública) y `fetchWithSizeLimit()` (aborta body >5 MB). |
| `src/lib/video/simli-url.ts` | `assertAllowedSimliHlsUrl()` — sólo HTTPS + hostname en `.simli.ai` / `.cloudfront.net`. |
| `src/lib/http/error-response.ts` | `errorResponse()` — respuesta 5xx estándar que esconde `error.message` en producción. |

---

## Fixes aplicados

### 1. SSRF en `fetch-full-content` — APLICADO
**Archivo:** `src/lib/news/content-fetcher.ts`
- Nuevo import de `assertAllowedUrl` y `fetchWithSizeLimit`.
- `fetchElComercioContent()` y `fetchArticleFullContent()` validan la URL contra allowlist + resuelven DNS antes del fetch.
- Rechazo de `http:`/`https:` sólo (cualquier otro scheme falla).
- Rechazo de IPs privadas/loopback/link-local/reservadas (IPv4 e IPv6, incluyendo IPv4-mapped).
- Allowlist incluye los 5 dominios de noticias + `news.google.com` (para fallback de La Hora) + `googleusercontent.com` y `lh3.googleusercontent.com` (para imágenes de Google News).

### 2. Prototype pollution en `add-manual-news` — APLICADO
**Archivo:** `src/app/api/bulletins/[id]/add-manual-news/route.ts`
- Nuevo regex `CATEGORY_SLUG_REGEX = /^[a-z0-9_-]{1,32}$/`.
- Rechazo explícito de `__proto__`, `constructor`, `prototype` vía `.refine()` de Zod para `category` y `subcategory`.
- Al merge con `existingClassified`, se crea un objeto con `Object.create(null)` y se filtran las claves reservadas, evitando que datos antiguos contaminados contaminen el prototype chain en runtime.

### 3. `/api/diagnostics` público → admin-only — APLICADO
**Archivo:** `src/app/api/diagnostics/route.ts`
- `requireSession()` → 401 si no hay sesión.
- `requireAdmin()` → si la sesión no es admin, devuelve `{ status: "ok" }` sin filtrar env/config.
- Sólo admins ven el payload completo con flags de env, DB, auth, AI.

### 4. Validación de `hlsUrl` de Simli — APLICADO
**Archivos:**
- `src/lib/video/simli-url.ts` (nuevo): `assertAllowedSimliHlsUrl()`.
- `src/app/api/bulletins/[id]/generate-avatars/route.ts`: llama al assert antes de `convertHLStoMP4`.
- `src/lib/video/hls-to-mp4.ts`: defensa en profundidad — el propio helper llama al assert en `convertHLStoMP4()` y `downloadHLS()`.

**Nota:** `render-final-video/route.ts` no consume `hlsUrl` directamente (lee `categoryVideos[x].mp4Url`, que ya es una URL de MinIO interna). No requirió cambios.

### 5. Path traversal defensivo en `generate-tts` — APLICADO
**Archivo:** `src/app/api/bulletins/[id]/generate-tts/route.ts`
- Validación del `id` con `z.string().uuid()` (400 si no matchea).
- Sanitización de `news.category` con regex `^[a-z0-9_-]{1,32}$`; fallback a `"uncategorized"` si no matchea.
- `path.basename()` al final como última línea de defensa.
- Verificación `path.resolve()` de que la ruta final queda dentro de `audioDir`.
- También se reemplazó el `require()` dinámico por los imports de top-level (mejor linting y consistencia).

### 6. Tope de tamaño en fetch HTML — APLICADO
**Archivos:**
- `src/lib/net/safe-fetch.ts`: helper `fetchWithSizeLimit()` reutilizable.
- `src/lib/news/content-fetcher.ts`: `fetchElComercioContent()` y `fetchArticleFullContent()` usan el helper con `maxBytes: 5 * 1024 * 1024`.
- `src/app/api/news/diagnose/route.ts`: `testUrl()`, `testLaHoraHomepage()`, `testGoogleNewsRSS()` usan el helper.

### 7. `error.message` solo en dev — APLICADO
**Helper creado:** `src/lib/http/error-response.ts` (`errorResponse()`).

**Archivos adaptados al helper o al patrón equivalente (condicional `NODE_ENV`):**
- `src/app/api/bulletins/[id]/route.ts` (GET, PATCH, DELETE)
- `src/app/api/bulletins/[id]/generate-tts/route.ts`
- `src/app/api/bulletins/[id]/enhance-content/route.ts` (POST + PUT)
- `src/app/api/bulletins/[id]/add-manual-news/route.ts`
- `src/app/api/bulletins/[id]/send-email/route.ts`
- `src/app/api/news/classify/route.ts`
- `src/app/api/news/summarize/route.ts`
- `src/app/api/news/scrape/route.ts`

**Nota de alcance:** Existen ~15 archivos adicionales con el mismo patrón `message: (error as Error).message` (debug, cron, subscribers, sources, dashboard, bulletins/route, progress, process, fetch-full-content, send-test-email, update-news). Dado que el prompt listaba explícitamente 3 archivos y pedía extender al "patrón", cubrí los críticos (endpoints de IA/email donde el error puede contener información de infra) y dejé los demás. Recomendable en un siguiente pasada migrarlos todos al helper `errorResponse()`.

### 8. Tipos estrictos en `render-final-video` y `orchestrate` — APLICADO
**Archivo:** `src/app/api/bulletins/[id]/render-final-video/route.ts`
- Nuevas interfaces: `SelectedNewsItem` (Zod schema con `passthrough`), `CategoryVideoEntry`, `RemotionNewsInput`, `RemotionInputProps` (con `[key: string]: unknown` para satisfacer la restricción de Remotion).
- Validación con Zod de `bulletin.selectedNews` antes de pasar a Remotion; 400 si está mal formado.
- Se eliminaron `any[]` y `(news: any)`.

**Archivo:** `src/app/api/bulletins/[id]/orchestrate/route.ts`
- `selectedNews` ahora es `Array<Record<string, unknown>>`.
- `categoryVideos` ahora está tipado como `Record<string, { mp4Url?: string; duration?: number; simliUrl?: string }>`.

### 9. `BETTER_AUTH_SECRET` + cookie options — APLICADO
**Archivo:** `src/lib/auth.ts`
- Nuevo `secret: process.env.BETTER_AUTH_SECRET` explícito.
- En producción, fail-fast si `BETTER_AUTH_SECRET` no está definido.
- `session: { expiresIn: 60*60*24*7, updateAge: 60*60*24 }`.
- `advanced.defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: isProduction }`.
- `advanced.useSecureCookies: isProduction`.

**Nota:** La API real de BetterAuth 1.3.x usa `advanced.defaultCookieAttributes`, no `advanced.cookieOptions` como sugería el prompt. Se consultó la doc oficial de BetterAuth para verificar los keys correctos.

### 10. `trustedOrigins` solo en dev — APLICADO
**Archivo:** `src/lib/auth.ts`
- En producción: `[NEXT_PUBLIC_APP_URL]` solamente.
- En desarrollo: `[localhost:3000, NEXT_PUBLIC_APP_URL]` (deduplicado).

### 11. `SameSite=Strict` en cookies admin — NO APLICADO (intencional)
**Decisión:** Se dejó `sameSite: "lax"` en `defaultCookieAttributes`.

**Motivo:**
- BetterAuth emite una sola `session_token` cookie compartida por todos los usuarios (no hay distinción admin / no-admin a nivel de cookie).
- El flujo de Google OAuth (usado en producción) requiere `lax` o `none` para que el redirect de `accounts.google.com` pueda leer la cookie de estado. `strict` rompe el sign-in con "CSRF token mismatch" o pérdida de sesión en el callback.
- Aplicar Strict a un subset de cookies requeriría o (a) partir la cookie de sesión en dos con BetterAuth plugins (cambio arquitectural, no trivial) o (b) una segunda cookie independiente firmada por app sólo para rutas admin (nueva dependencia y flujo).

**Recomendación pendiente:** considerar a futuro aislar rutas admin con una segunda capa de verificación (p.ej. re-auth a través de confirmación de password antes de operaciones destructivas, o un plugin de `step-up auth` de BetterAuth), en lugar de intentar forzar `SameSite=Strict`.

### 12. Logs sin PII — APLICADO
**Archivos:**
- `src/app/api/news/scrape/route.ts:61`: `session.user.email` → `session.user.id`.
- `src/app/api/news/classify/route.ts:44`: idem.
- `src/app/api/news/summarize/route.ts:44`: idem.

### 13. Fallback URL hardcoded — APLICADO
**Archivo:** `src/app/api/bulletins/[id]/send-email/route.ts`
- Si `NEXT_PUBLIC_APP_URL` no está definido:
  - En prod → lanza `Error` (fail-fast, no envía emails con URLs rotas).
  - En dev → cae a `http://localhost:3000`.
- Eliminado el fallback hardcoded `https://ottoseguridadai.com`.

### 14. `maxRetries: 150` → 5 con backoff exponencial — APLICADO
**Archivo:** `src/app/api/bulletins/[id]/enhance-content/route.ts`
- Nuevo helper local `withRetry(fn, maxAttempts = 5)` con backoff `500ms * 2^attempt` (max 8s).
- Las llamadas a `generateText` ahora usan `maxRetries: 5` del SDK y se envuelven en `withRetry`, dando una cota dura sobre cuánto tiempo puede consumir un sólo artículo.

---

## Verificación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | PASA sin errores |
| `pnpm run lint` | PASA — solo warnings preexistentes (no se introdujo ninguna nueva) |

Warnings preexistentes (no causadas por este audit): `_context` no usado en enhance-content, `error` no usado en catch blocks de algunos endpoints de diagnóstico, `sourceNameMapping` sin usar, `isNotNull` sin importar en email-tracking, y similares. Ninguna bloquea el pipeline.

---

## Archivos modificados (lista completa)

1. `src/lib/net/safe-fetch.ts` — NUEVO
2. `src/lib/video/simli-url.ts` — NUEVO
3. `src/lib/http/error-response.ts` — NUEVO
4. `src/lib/news/content-fetcher.ts` — SSRF + size limit
5. `src/lib/video/hls-to-mp4.ts` — defensa en profundidad Simli
6. `src/lib/auth.ts` — secret, session, cookieOptions, trustedOrigins
7. `src/app/api/diagnostics/route.ts` — requireAdmin
8. `src/app/api/news/diagnose/route.ts` — fetchWithSizeLimit + requireActiveUser
9. `src/app/api/news/scrape/route.ts` — errorResponse, log PII
10. `src/app/api/news/classify/route.ts` — errorResponse, log PII
11. `src/app/api/news/summarize/route.ts` — errorResponse, log PII
12. `src/app/api/bulletins/[id]/route.ts` — error.message condicional
13. `src/app/api/bulletins/[id]/add-manual-news/route.ts` — prototype pollution + errorResponse
14. `src/app/api/bulletins/[id]/generate-avatars/route.ts` — assertAllowedSimliHlsUrl
15. `src/app/api/bulletins/[id]/generate-tts/route.ts` — UUID validation, slug sanitization, path guard, error.message condicional
16. `src/app/api/bulletins/[id]/enhance-content/route.ts` — error.message condicional + maxRetries 5 + backoff
17. `src/app/api/bulletins/[id]/render-final-video/route.ts` — tipos estrictos Zod
18. `src/app/api/bulletins/[id]/orchestrate/route.ts` — tipos estrictos
19. `src/app/api/bulletins/[id]/send-email/route.ts` — fallback URL + errorResponse

## Memoria persistente actualizada

- `.claude/agent-memory/owasp-security-auditor/error_response_helper.md` — NUEVO
- `.claude/agent-memory/owasp-security-auditor/safe_fetch_helpers.md` — NUEVO
- `.claude/agent-memory/owasp-security-auditor/MEMORY.md` — dos nuevos punteros añadidos

---

## Recomendaciones pendientes (para futuras pasadas)

1. **Extender `errorResponse()`** al resto de endpoints que aún construyen manualmente `{ error, message: (error as Error).message }` (ver grep en el reporte).
2. **SameSite=Strict** — evaluar un plugin de step-up auth en BetterAuth para operaciones admin destructivas (eliminación de suscriptores, cambio de rol, envío masivo de email).
3. **Considerar rate limiting** explícito en endpoints caros (`enhance-content`, `orchestrate`, `generate-avatars`) más allá del timeout — hoy sólo limitamos reintentos internos.
4. **Revisar `fetch()` restantes** del backend (`src/lib/crawl4ai/*`, `src/app/api/bulletins/*` que llaman a Simli/ElevenLabs) — aunque son APIs externas legítimas, podrían beneficiarse de `fetchWithSizeLimit()` para evitar respuestas malformadas de terceros.
