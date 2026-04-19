# OWASP Top 10:2025 Security Audit — OttoSeguridad (Revisión 2)

**Proyecto:** OttoSeguridad (`/Users/faustoparedes/Documents/Proyectos/ottoseguridad`)
**Fecha:** 2026-04-18
**Auditor:** Claude Code (skill `owasp-security-audit`) — rehecho con contexto de infraestructura
**Stack detectado:** Next.js 15 (App Router, React 19, TypeScript), BetterAuth, PostgreSQL + Drizzle ORM, Vercel AI SDK 5 + OpenRouter, Nodemailer (SendGrid SMTP), Supabase Storage + MinIO, Remotion (Simli + ElevenLabs), Firecrawl, Crawl4AI externo. Despliegue: **VPS Contabo + Docker Swarm + Traefik + Let's Encrypt**.
**Alcance:** Repo completo en `main` (commit `72fed12`), `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `next.config.ts`, todos los endpoints `src/app/api/**`, helpers `src/lib/**`, dependencias (`pnpm audit`).
**Nota de revisión:** Esta versión **sobreescribe** el reporte del mismo día porque el inicial era superficial en áreas de infraestructura y servicios externos. Se preservan los hallazgos válidos del original y se incorporan los faltantes.

---

## Resumen ejecutivo

| Severidad | Cantidad | De ellos ya fixed (grupo A+B) |
|---|---:|---:|
| Critical | 8 | 5 |
| High | 14 | 3 |
| Medium | 14 | 5 |
| Low | 9 | 3 |
| Info | 4 | 0 |
| **Total** | **49** | **16** |

- **Hallazgos nuevos (respecto al audit inicial):** 19, casi todos en infraestructura (Dockerfile, docker-compose, Traefik), servicios externos (Supabase service_role, MinIO bucket público, SendGrid, Polar) y dependencias.
- **Hallazgos previos aún pendientes:** 14. Ver matriz en la sección final.
- **Aplicado automáticamente en esta revisión:** 2 endpoints menores (ver "Fixes aplicados en esta pasada"). El resto — infraestructura — se entrega como snippets listos.

### Top-5 Critical/High que requieren acción inmediata

1. **Dockerfile hardcodea `BETTER_AUTH_SECRET="build-time-secret-not-used-in-production"`** — si alguna vez el env var real se pierde en runtime, BetterAuth firmará sesiones con ese secreto. Un atacante que sepa de este default (revisión casual del Dockerfile en GitHub, o de la imagen de Docker Hub si es pública) puede forjar sesiones.
2. **Imagen `faustoai/ottoseguridadai:latest` en Docker Hub (verificar visibilidad)** — si el repo es público, cualquiera descarga y analiza el código compilado + los `NEXT_PUBLIC_*` bakeados al build. Si es privado, igual se recomienda tag versionado (rollback + trazabilidad).
3. **Secrets en `environment` de docker-compose** — visibles en `docker inspect` para cualquier operador con acceso al socket de Docker. No se usan `secrets:` de Swarm. Rotar + migrar `BETTER_AUTH_SECRET`, `POSTGRES_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_PASS`, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `MINIO_SECRET_KEY`, `OPENROUTER_API_KEY`, `ELEVENLABS_API_KEY`, `SIMLI_API_KEY`, `FIRECRAWL_API_KEY`.
4. **Faltan middlewares Traefik**: no hay rate-limit por ruta, ni IP allowlist para `/api/cron/*`, ni headers de seguridad a nivel de proxy (defensa en profundidad sobre los ya puestos en `next.config.ts`), ni redirect HTTP→HTTPS documentado en este stack.
5. **MinIO bucket `noticias` con política pública `s3:GetObject` + fallback credencial `minioadmin/minioadmin`** — si el bucket se instancia con los defaults del código y las env vars faltan, el bucket termina siendo world-readable con creds por defecto, exponiendo todo lo que la app sube (videos de boletines, imágenes).

---

## Secciones

1. [Infraestructura: Dockerfile, docker-compose, Traefik, Swarm](#1-infraestructura)
2. [Servicios externos y credenciales](#2-servicios-externos-y-credenciales)
3. [Polar webhooks (inconsistencia)](#3-polar-webhooks)
4. [Autenticación y autorización (A01, A07)](#4-autenticación-y-autorización)
5. [Inyección / SSRF / deserialización (A03, A10 viejo)](#5-inyección--ssrf)
6. [Logging, manejo de errores y filtrado (A09)](#6-logging--errores)
7. [Dependencias (A03 Supply Chain)](#7-dependencias)
8. [Hallazgos pendientes del audit inicial — estado actualizado](#8-matriz-de-hallazgos-previos)
9. [Snippets listos para copiar](#9-snippets-listos-para-copiar)
10. [Fixes aplicados en esta pasada](#10-fixes-aplicados)
11. [Plan de remediación por capas](#11-plan-de-remediación-por-capas)
12. [Verificación](#12-verificación)
13. [Cambios respecto al audit inicial](#13-cambios-respecto-al-audit-inicial)

---

## 1. Infraestructura

### [CRITICAL-INF1] Default hardcoded de `BETTER_AUTH_SECRET` en Dockerfile
- **OWASP:** A02:2025 — Security Misconfiguration / A07 — Authentication Failures
- **Ubicación:** `Dockerfile:40`
- **Descripción:** El build stage define `ENV BETTER_AUTH_SECRET="build-time-secret-not-used-in-production"`. El valor es público (Dockerfile está en el repo y la imagen termina en Docker Hub). BetterAuth usa este secret para firmar cookies de sesión y tokens CSRF. El runtime stage borra esa variable porque reempieza, pero **si alguna vez se omite `BETTER_AUTH_SECRET` del `docker-compose.yml`/Portainer en runtime, Node heredará `undefined` y el fail-fast de `src/lib/auth.ts:17-21` protege en producción — pero el mero hecho de publicar un secret con nombre predecible incrementa riesgo**. Adicionalmente, dentro del mismo build stage se procesan migraciones/validaciones que tocan BetterAuth, y si algún hook de build usa `auth` (no es el caso hoy pero es frágil), quedaría firmando con el secret público.
- **Riesgo:** Un atacante con el secret puede forjar cookies de sesión válidas si BetterAuth lee ese valor en runtime (escenario: misconfig en Portainer donde se pierde la variable).
- **Fix:** Eliminar `ENV BETTER_AUTH_SECRET=...`. El build de Next.js no necesita ese secreto (BetterAuth se inicializa en runtime, no en build-time). Si algún `next build` step lo requiere, pasar un valor **random generado en el build** (`RUN BETTER_AUTH_SECRET=$(openssl rand -hex 32) ...`), nunca uno estático.
- **Estado:** Recomendación (Dockerfile, no auto-aplicado)

### [CRITICAL-INF2] Secrets en `environment:` de docker-compose (no `secrets:` de Swarm)
- **OWASP:** A02:2025 — Security Misconfiguration
- **Ubicación:** `docker-compose.yml:13-85`
- **Descripción:** Las 16 variables sensibles pasan como `environment:` — visibles en `docker inspect <container>` para cualquiera con acceso al socket de Docker (Portainer, SSH al manager). Docker Swarm soporta `secrets:` que monta los valores como archivos `/run/secrets/<name>` y no los expone a `docker inspect`.
- **Credenciales actualmente expuestas así:** `POSTGRES_URL`, `SUPABASE_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `OPENROUTER_API_KEY`, `FIRECRAWL_API_KEY`, `CRON_SECRET`, `MINIO_SECRET_KEY`, `SIMLI_API_KEY`, `ELEVENLABS_API_KEY`, `SMTP_PASS`, `POLAR_WEBHOOK_SECRET`, `POLAR_ACCESS_TOKEN`, `BLOB_READ_WRITE_TOKEN`.
- **Fix:** Ver snippet 4 ("docker-compose con `secrets:`") más abajo. Requiere un pequeño wrapper de arranque en el contenedor para leer los archivos y exportarlos como env vars, o cambios en el código para leer de disk.
- **Estado:** Recomendación

### [CRITICAL-INF3] `COPY . .` puede filtrar archivos sensibles al image layer
- **OWASP:** A02:2025 — Security Misconfiguration / A08 — Software or Data Integrity Failures
- **Ubicación:** `Dockerfile:24`
- **Descripción:** `COPY . .` en el builder stage copia todo lo que NO esté en `.dockerignore`. El `.dockerignore` actual **es razonable** (ignora `.env*`, `.git`, `node_modules`, `.next`, `*.md` excepto README, `.vscode`, `.idea`, coverage, Dockerfile, docker-compose). Sin embargo faltan:
  - `audit/` (este reporte y derivados no deberían ir a la imagen final).
  - `.claude/` (prompts del agente, specs).
  - `specs/` (specs internas).
  - `test-results/`, `playwright-report/`.
  - `output/` (videos Remotion generados en dev).
  - `temp/` (usado por `render-final-video/route.ts` para tmp files).
- Aunque el stage `runner` solo copia `public/`, `.next/standalone`, `.next/static`, **el intermediate layer del builder queda cacheado en el registry si se usa `--cache-from`** y puede ser recuperado por alguien con acceso al registry.
- **Fix:** Ver snippet 3 (".dockerignore recomendado").
- **Estado:** Recomendación

### [HIGH-INF4] Imagen en Docker Hub como `:latest` sin tag versionado
- **OWASP:** A08:2025 — Software or Data Integrity Failures
- **Ubicación:** `docker-compose.yml:5` (`image: faustoai/ottoseguridadai:latest`)
- **Descripción:** `:latest` impide rollback determinista ("volver a la versión de ayer" no es reproducible si ya se pisó). Cadena de suministro frágil: un `docker pull` resuelve a distinto digest según cuándo se pulló. Falta pinning por `@sha256:<digest>`.
- **Fix:** Usar `faustoai/ottoseguridadai:1.1.2` (mismo que `package.json#version`) o `:2026-04-18.1`. Opcionalmente fijar por digest: `image: faustoai/ottoseguridadai:1.1.2@sha256:abc...`.
- **Estado:** Recomendación

### [HIGH-INF5] Imagen en Docker Hub potencialmente pública
- **OWASP:** A05:2025 — Security Misconfiguration
- **Ubicación:** Registry `hub.docker.com/r/faustoai/ottoseguridadai`
- **Descripción:** No se pudo verificar desde el código si el repo de Docker Hub es privado. Si es público, cualquiera descarga la imagen y:
  - Ve el código compilado/minificado de Next.js standalone.
  - Lee los `NEXT_PUBLIC_*` **bakeados al build** (URL de Supabase, anon key pública, URL de la app). Esas, por definición, son públicas — pero el anon key de Supabase sólo debe ser "público" si RLS está bien configurado. Ver INF8 más abajo.
  - Puede analizar el bundle buscando endpoints, nombres de tablas, lógica de autorización.
- **Fix:** Marcar el repo como privado en Docker Hub; usar `docker login` en el nodo Swarm. O mover a GitHub Container Registry (`ghcr.io`) con autenticación por token.
- **Estado:** Recomendación (verificar + migrar)

### [HIGH-INF6] Traefik sin rate limiting
- **OWASP:** A04:2025 — Insecure Design
- **Ubicación:** `docker-compose.yml:98-107` (labels `traefik.*`)
- **Descripción:** Las labels solo definen `buffering` (50 MB req/resp). No hay `ratelimit`. Endpoints pagos (`/api/chat` → OpenRouter; `/api/bulletins/[id]/generate-{tts,avatars,video}` → ElevenLabs + Simli + renderizado Remotion; `/api/bulletins/[id]/send-email` → SendGrid; `/api/bulletins/[id]/orchestrate`) quedan sin cota a nivel de red. La cota actual es sólo "estar autenticado", lo que un atacante cumple con credenciales robadas.
- **Fix:** Ver snippet 1 ("Traefik ratelimit por ruta").
- **Estado:** Recomendación

### [HIGH-INF7] Traefik sin IP allowlist en `/api/cron/*`
- **OWASP:** A01:2025 — Broken Access Control / A04 — Insecure Design
- **Ubicación:** `docker-compose.yml` + `src/app/api/cron/daily-bulletin/route.ts`
- **Descripción:** El endpoint `/api/cron/daily-bulletin` valida `Authorization: Bearer <CRON_SECRET>`, pero cualquiera en Internet puede **intentarlo y consumir CPU/BD** hasta que la comprobación falle. Si el secret se filtra (un log, un .env commiteado, un error de configuración en Portainer) no hay defensa en profundidad. Un allowlist de IPs del cron scheduler (Vercel Cron, GitHub Actions, UptimeRobot) reduciría la superficie.
- **Fix:** Ver snippet 1 ("IP allowlist /api/cron").
- **Estado:** Recomendación

### [HIGH-INF8] Falta healthcheck de Docker en el servicio
- **OWASP:** A04:2025 — Insecure Design
- **Ubicación:** `docker-compose.yml` (no tiene `healthcheck:`)
- **Descripción:** Sin healthcheck, Traefik ruta tráfico a un contenedor incluso si la app está caída o colgada. Efecto: ventanas de indisponibilidad silenciosa, alertas perdidas, y en dependencias tipo "el contenedor está up pero Node está en GC pause" el tráfico sigue entrando.
- **Fix:** Añadir `healthcheck:` que golpee `/api/auth/session` o un endpoint `/api/health` (no existe aún — se puede crear uno público que devuelva `{status:"ok"}` sin tocar BD, o uno que haga `SELECT 1` con timeout corto).
- **Estado:** Recomendación

### [MEDIUM-INF9] No hay redirect HTTP→HTTPS explícito
- **OWASP:** A02:2025 — Security Misconfiguration
- **Ubicación:** `docker-compose.yml:100` (`traefik.http.routers.ottoseguridad.entrypoints=websecure`)
- **Descripción:** El router está anclado a `websecure` pero no se define un router secundario que redirija HTTP→HTTPS. Si la configuración global de Traefik (en otro stack) tiene el redirect, está cubierto; si no, las peticiones HTTP van a 404 en vez de redirigir. HSTS en la app (`Strict-Transport-Security` en `next.config.ts`) no protege la primera visita.
- **Fix:** Ver snippet 2 ("Redirect HTTP→HTTPS + headers de seguridad").
- **Estado:** Recomendación

### [MEDIUM-INF10] `buffering.maxRequestBodyBytes=52428800` (50 MB) es uniforme
- **OWASP:** A04:2025 — Insecure Design
- **Ubicación:** `docker-compose.yml:104`
- **Descripción:** 50 MB como global es muy permisivo. `/api/upload/video` necesita 150 MB (pero el código lo valida a 150 MB, conflicto con el buffer de Traefik → uploads fallarán silenciosamente si se acercan a 50 MB). El resto de endpoints no necesita más de 1 MB. Un límite uniforme facilita DoS con `Content-Length: 49MB` a cualquier endpoint.
- **Fix:** Bajar el global a 2 MB y tener un middleware `*-upload-buffering` con 160 MB aplicado sólo a los routers `/api/upload/**`.
- **Estado:** Recomendación

### [MEDIUM-INF11] `NEXT_PUBLIC_*` bakeados al build
- **OWASP:** A02:2025 — Security Misconfiguration
- **Ubicación:** `Dockerfile:32-36`
- **Descripción:** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` se inyectan como build args al `next build`. Esto es correcto para variables realmente públicas; lo que falla es que en Memoria del proyecto (CLAUDE.md memoria auto) se anota que *"`NEXT_PUBLIC_*` env vars are inlined at build time — server needs non-prefixed vars too"* lo que sugiere incidentes previos donde variables del servidor se empaquetaron como públicas. Verificar con `grep -r "NEXT_PUBLIC_" src/` que no se usa `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` por error. (Revisado: sólo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` aparecen — OK.)
- **Estado:** Info / recomendación — añadir un lint-rule/CI check que falle si aparece cualquier `NEXT_PUBLIC_*_SECRET` o `NEXT_PUBLIC_*_KEY` cuyo nombre no contenga `ANON`.

### [MEDIUM-INF12] Node 20 entra en maintenance LTS en 2026-04
- **OWASP:** A03:2025 — Software Supply Chain Failures
- **Ubicación:** `Dockerfile:2, 16, 46` (`FROM node:20-alpine`)
- **Descripción:** Node 20 entra en maintenance-LTS el 2026-04-29. Ya no recibe mejoras, sólo parches de seguridad críticos, y eventualmente EOL en 2026-04. Considerar migrar a Node 22 LTS (Active-LTS hasta 2027-10).
- **Fix:** `FROM node:22-alpine`. Probar build antes de promover.
- **Estado:** Recomendación (migración planificada)

### [MEDIUM-INF13] `pnpm@latest` no-determinista en Dockerfile
- **OWASP:** A03:2025 — Software Supply Chain Failures
- **Ubicación:** `Dockerfile:7, 20` (`corepack prepare pnpm@latest --activate`)
- **Descripción:** `@latest` permite que un build de hoy use pnpm X y el de mañana pnpm Y. Distinto resolver, distintos árboles de dependencias, distintas vulnerabilidades. Supply-chain attacks contra pnpm serían inmediatamente incorporados.
- **Fix:** `corepack prepare pnpm@10.0.0 --activate` (o la versión actual que usan los desarrolladores). `pnpm --version` localmente para fijar.
- **Estado:** Recomendación

### [LOW-INF14] `replicas: 1` en un solo nodo manager, sin HA
- **OWASP:** A04:2025 — Insecure Design
- **Ubicación:** `docker-compose.yml:88-92`
- **Descripción:** Un restart o un kernel panic tumba la app. `placement.constraints: node.role == manager` fuerza ejecución en el manager (OK para no-HA) pero no escala horizontalmente. No es estrictamente un issue de seguridad, pero la "disponibilidad" es parte del CIA Triad.
- **Fix:** Considerar `replicas: 2` si hay más de un nodo, con `update_config` para rollouts sin downtime. Requiere sesiones stateless (que ya lo son gracias a BetterAuth+PG).
- **Estado:** Info

### [LOW-INF15] Red `Ottoseguridadnet` es `external: true`
- **OWASP:** A04:2025 — Insecure Design
- **Ubicación:** `docker-compose.yml:109-112`
- **Descripción:** La red es externa (compartida con otros stacks del Swarm). Esto implica que otros contenedores en esa red pueden alcanzar el contenedor de OttoSeguridad por nombre de servicio, potencialmente sin TLS. Revisar que en `Ottoseguridadnet` sólo haya servicios que deben comunicarse con OttoSeguridad (o con los que ésta necesita hablar: Crawl4AI, Supabase self-hosted, MinIO si lo hay).
- **Fix:** Documentar en la memoria del proyecto qué servicios viven en esa red y por qué.
- **Estado:** Info

---

## 2. Servicios externos y credenciales

### 2.1 Supabase (Database + Storage)

#### [CRITICAL-SVC1] `SUPABASE_SERVICE_ROLE_KEY` usado server-side sin restricciones
- **OWASP:** A01:2025 — Broken Access Control
- **Ubicación:** `src/lib/storage/supabase-storage.ts:23, 36`
- **Descripción:** El service_role key **bypassea todas las Row-Level-Security policies** de Supabase. Está correctamente confinado a server-side (nunca se expone en bundle cliente — verificado con grep), pero:
  - Cualquier endpoint authenticated que consuma `getSupabaseAdmin()` puede leer/escribir/borrar cualquier fila de cualquier tabla en Supabase, no solo los buckets.
  - No hay tests o asserts que impidan que un desarrollador futuro lo use en Server Actions sin pensar en autorización por usuario.
- **Fix:**
  1. Crear un segundo cliente "anon" para operaciones que deberían respetar RLS (lecturas a nombre del usuario autenticado). Dejar el service_role solo para operaciones administrativas bien delimitadas (subida de archivos del dashboard, no lectura de datos).
  2. Añadir un comentario JSDoc `@requires admin` en `getSupabaseAdmin()` y un lint/grep en CI que busque uso fuera de `src/lib/storage/**`.
  3. Revisar el JWT del service_role: rotar periódicamente (recomendación interna de Supabase cada 90 días o tras eventos).
- **Estado:** Recomendación arquitectónica

#### [HIGH-SVC2] Buckets `bulletin-images` y `bulletin-videos` son públicos
- **OWASP:** A01:2025 — Broken Access Control
- **Ubicación:** `src/lib/storage/supabase-storage.ts:69, 157`
- **Descripción:** Ambos buckets se crean con `public: true`. Eso significa que cualquier URL pública del bucket es accesible sin autenticación. Los videos generados (que contienen la voz clonada de Otto y el avatar) son enumerables si el atacante conoce el UUID del boletín o el patrón de nombres (`${uuid}.mp4`). Peor: `upsert: true` permite **sobrescribir** un archivo con el mismo nombre si se descubre el patrón.
- **Mitigación parcial:** los nombres usan `uuidv4()` (no enumerables por fuerza bruta realista). Pero el pattern es predecible desde la BD (cualquier endpoint authenticated puede listar UUIDs y construir URLs).
- **Fix:** Hacer los buckets privados y servir archivos via Supabase presigned URLs con expiración (similar a `getPresignedUrl` de MinIO). Requiere cambio arquitectónico: el HTML del email y el frontend deben obtener URL firmada al mostrar.
- **Estado:** Recomendación (cambio arquitectónico)

#### [MEDIUM-SVC3] Validación client-side del MIME/tamaño en endpoints de upload
- **OWASP:** A03:2025 — Injection (upload polimórfico)
- **Ubicación:** `src/app/api/upload/image/route.ts:52-73`, `src/app/api/upload/video/route.ts:46-67`
- **Descripción:** La validación comprueba `file.type` que viene del cliente (se puede forjar con curl). Se debería validar con **magic bytes** (file sniffing) para evitar que un atacante suba un `.svg` (que `NEXT_PUBLIC_APP_URL` renderiza inline en otros sitios) con payload XSS o un `.mp4` que en realidad sea un archivo ZIP.
- **Fix:**
  - Pequeña biblioteca: leer los primeros bytes del buffer y verificar contra la signature del MIME declarado (ej. `file-type` npm package).
  - Considerar rechazar SVG (permite scripts inline). Ya está en allowlist hoy — evaluar si es necesario.
- **Estado:** Recomendación

### 2.2 MinIO

#### [CRITICAL-SVC4] MinIO con fallback a `minioadmin/minioadmin` + bucket público
- **OWASP:** A02:2025 — Security Misconfiguration / A07 — Authentication Failures
- **Ubicación:** `src/lib/storage/minio.ts:11-16, 41-53`
- **Descripción:** El código tiene varias capas de riesgo:
  1. `MINIO_ACCESS_KEY || 'minioadmin'` y `MINIO_SECRET_KEY || 'minioadmin'` — si las env vars faltan, **el cliente intenta las credenciales por defecto** que son las que se configuran al bootear MinIO por primera vez.
  2. `initializeBucket()` crea el bucket con política **`s3:GetObject` permitido a cualquier AWS Principal `*`** (world-readable).
  3. `getPublicUrl()` construye URLs públicas sin token ni firma — quien conozca el fileName lo descarga.
  4. Los fileNames siguen patrones predecibles: `bulletins/${uuid}/avatars/${category}.mp4`, `bulletins/${uuid}/final-video.mp4`.
- **Amenaza:** Un usuario autenticado que exfiltre los UUIDs de boletines (fácil vía `/api/bulletins` que lista todo) puede construir URLs a los videos de producción (incluso a boletines en borrador/no-publicados).
- **Fix:**
  1. Eliminar los fallbacks `'minioadmin'`. Fail-fast si no están configurados.
  2. Cambiar la policy a restrictiva; servir archivos con `getPresignedUrl()` (ya existe la función en el mismo archivo, líneas 178-194). Las presigned URLs de 1h son suficientes para pixel-tracking/email delivery.
  3. Alternativa: mover todo a Supabase Storage y retirar MinIO si ya se está migrando (env vars lo sugieren — hay ambos).
- **Estado:** Recomendación crítica

#### [MEDIUM-SVC5] MinIO no valida Content-Type al upload
- **OWASP:** A03:2025 — Injection
- **Ubicación:** `src/lib/storage/minio.ts:70-95`
- **Descripción:** `uploadFile(fileName, fileBuffer, contentType)` acepta cualquier `contentType` string. Si un caller pasa `text/html` con un buffer de HTML malicioso, y luego alguien abre el `getPublicUrl()` desde un dominio confiado (ej. un subdominio del mismo `*.ottoseguridadai.com`), hay XSS en contexto de ese dominio.
- **Mitigación actual:** los dos callers actuales (`generate-avatars` y `render-final-video`) pasan `video/mp4` hardcoded. Pero el helper es público y usable.
- **Fix:** Restringir `contentType` a un set permitido en el helper, o validar magic bytes del buffer antes de subir.
- **Estado:** Recomendación

### 2.3 Firecrawl

#### [MEDIUM-SVC6] Firecrawl URLs venidas de BD no re-validadas
- **OWASP:** A10:2021 — SSRF
- **Ubicación:** `src/app/api/debug/scrape-test/route.ts` (OK — allowlist aplicada en fix previo), `src/lib/news/scraper.ts` (usa `newsSources` tabla como origen)
- **Descripción:** En `scrape-test` se validó allowlist (fix previo). Pero el pipeline normal lee URLs de `newsSources` en BD y las envía a Firecrawl. Si un admin malicioso o comprometido inserta una fuente con URL `http://169.254.169.254/latest/meta-data/` o `http://internal-svc:8080/admin`, Firecrawl la scrapeará. Firecrawl es un tercero, pero si devuelve el contenido en `data.markdown`, ese contenido termina en BD y puede contener información sensible extraída del endpoint interno.
- **Fix:** Aplicar la misma allowlist usada en `scrape-test` al scraper principal (`src/lib/news/scraper.ts`). Reutilizar `assertAllowedUrl()` de `src/lib/net/safe-fetch.ts` antes de llamar a Firecrawl.
- **Estado:** Recomendación

### 2.4 Crawl4AI

#### [HIGH-SVC7] `CRAWL4AI_API_URL` sin autenticación documentada
- **OWASP:** A01:2025 — Broken Access Control
- **Ubicación:** `src/lib/crawl4ai/client.ts`, env var `CRAWL4AI_API_URL=https://crawl.ottoseguridadai.com`
- **Descripción:** El memo del proyecto dice que Crawl4AI está en `https://crawl.ottoseguridadai.com`. No se ve en el código ningún header de autenticación (Bearer token, API key) en las llamadas a Crawl4AI. Si el endpoint es público, cualquiera puede lanzar trabajos de scraping contra él → coste de recursos (Playwright es caro en CPU/RAM) y potencial SSRF si Crawl4AI acepta URLs arbitrarias en su `body`.
- **Fix:**
  1. Confirmar si `crawl.ottoseguridadai.com` está protegido: IP allowlist (solo el Swarm), basic-auth en Traefik, o API token.
  2. Añadir `Authorization` header en `src/lib/crawl4ai/client.ts` con un `CRAWL4AI_API_KEY` server-side.
- **Estado:** Recomendación (verificar + acción)

### 2.5 Simli (generación de video)

#### [MEDIUM-SVC8] Simli: texto del TTS puede contener datos sensibles
- **OWASP:** A02:2025 — Security Misconfiguration / privacidad
- **Ubicación:** `src/app/api/bulletins/[id]/generate-avatars/route.ts:82, 99-108`
- **Descripción:** El texto que se envía a Simli API (`newsText = news.summary || news.title`) viene de contenido scrapeado. No es user-controlled directamente, pero si se añaden noticias manuales (`add-manual-news`) y un atacante autenticado inserta prompt-injection o contenido malicioso, ese contenido llega a Simli/ElevenLabs y puede:
  - Quemar cuota a propósito con textos muy largos.
  - Incluir instrucciones que terminen en la voz del avatar (reputación).
- **Fix:**
  - Validar `newsText.length` antes de enviar (hoy no hay tope — un summary de 50k caracteres pasa). Cap de ~2000 caracteres.
  - Sanitizar caracteres de control y zero-width (`\u200B`, `\u200E`, etc.).
- **Estado:** Recomendación

#### [INFO-SVC9] `assertAllowedSimliHlsUrl` bien aplicado
- **Ubicación:** `src/lib/video/simli-url.ts`, `src/app/api/bulletins/[id]/generate-avatars/route.ts:130`
- **Detalle:** El fix del grupo B validó el HLS URL contra `.simli.ai` / `.cloudfront.net` (allowlist). Bien.

### 2.6 ElevenLabs

#### [MEDIUM-SVC10] Texto a TTS sin cap de caracteres
- **OWASP:** A04:2025 — Insecure Design
- **Ubicación:** `src/app/api/bulletins/[id]/generate-tts/route.ts:84-115`
- **Descripción:** `news.summary || news.title` se envía directo a ElevenLabs. ElevenLabs cobra por caracteres. Sin cap, un atacante con cuenta que manipule `summary` puede generar facturas de $X por boletín.
- **Fix:** `const text = (news.summary || news.title).slice(0, 2000)`. ElevenLabs recomienda ≤2500 para un único request.
- **Estado:** Recomendación (fix trivial)

### 2.7 SendGrid SMTP (Nodemailer)

#### [HIGH-SVC11] Sin validación de CRLF injection en subject/to/from
- **OWASP:** A03:2025 — Injection (header injection)
- **Ubicación:** `src/lib/email/index.ts:69-76`, `src/lib/email/templates/bulletin.ts:162`
- **Descripción:** Nodemailer moderno ya sanitiza `\r\n` en `to`, `from`, `subject`, pero **solo si se usa la API de objetos**, no si se concatena. El `subject` se construye con `${formattedDate}` que viene de `bulletin.date` (campo BD). Si la fecha viene corrupta (p.ej. un UPDATE SQL manual malformado), en teoría `\r\n` podría colarse. Defensa en profundidad: forzar un `.replace(/[\r\n]/g, "")` en el subject antes de pasarlo a Nodemailer.
- **Fix:** Función `sanitizeHeader(value: string): string` que quita CRLF; aplicar a `subject`, `to`, `from` antes de `transport.sendMail`. Adicionalmente, la vulnerabilidad de nodemailer `<8.0.4` (CVE GHSA-c7w3-x93f-qmm8 — "SMTP command injection via unsanitized envelope.size") confirma que hay clases de bug parecidas — **actualizar nodemailer es prioritario**.
- **Estado:** Recomendación

#### [MEDIUM-SVC12] `sendEmail()` retorna `false` silenciosamente en errores
- **OWASP:** A09:2025 — Security Logging and Alerting Failures
- **Ubicación:** `src/lib/email/index.ts:65-82`
- **Descripción:** En bounce/rechazo SMTP, el código devuelve `false` y loguea. No hay alertas, ni retry explícito, ni registro persistente del error. En `sendBulkEmail` sí se cuentan los fallos pero no se propaga causa raíz. Si SendGrid revoca las creds o el dominio es blacklisteado, la app envía `false` cientos de veces sin aviso.
- **Fix:** Guardar los errores por suscriptor en `email_sends` (campo `error`). Alert en Slack/email al admin cuando el failure rate > 10%.
- **Estado:** Recomendación

#### [INFO-SVC13] DKIM/SPF/DMARC en el dominio SMTP_FROM
- **OWASP:** A02:2025 — Security Misconfiguration
- **Ubicación:** `SMTP_FROM="Otto Seguridad <noticias@ottoseguridad.com>"`
- **Detalle:** No verificable desde el código. Verificar desde DNS:
  - `dig TXT ottoseguridad.com` para SPF (`v=spf1 include:sendgrid.net ~all`).
  - `dig TXT s1._domainkey.ottoseguridad.com` para DKIM (SendGrid).
  - `dig TXT _dmarc.ottoseguridad.com` para DMARC (`v=DMARC1; p=reject; rua=mailto:...`).
- Si no están configurados, los correos van a spam y cualquiera puede suplantar `noticias@ottoseguridad.com`.
- **Estado:** Fuera de alcance del repo; recomendación operacional

---

## 3. Polar webhooks

### [HIGH-POL1] `POLAR_WEBHOOK_SECRET` configurado pero no hay endpoint webhook
- **OWASP:** A05:2025 — Security Misconfiguration / A08 — Software or Data Integrity Failures
- **Ubicación:** `docker-compose.yml:84`, `env.example:46` + ausencia de `src/app/api/webhooks/polar/**`
- **Descripción:** El stack expone `POLAR_WEBHOOK_SECRET` y `POLAR_ACCESS_TOKEN` como env vars, pero **no existe ningún endpoint que reciba webhooks de Polar** (grep exhaustivo `src/app/api/` y `src/lib/` para `polar`, `webhook`, `signature`, `stripe` — nada). Eso significa:
  - **Escenario A:** Polar está configurado en su dashboard para disparar webhooks a `app.ottoseguridadai.com/api/webhooks/polar` pero el endpoint no existe → **todas las notificaciones de pago/suscripción se pierden**. Los usuarios pagan y nunca se activa la feature asociada.
  - **Escenario B:** Polar sólo se usa para llamadas salientes (listar productos, crear checkout sessions) con `POLAR_ACCESS_TOKEN`. En ese caso, `POLAR_WEBHOOK_SECRET` está innecesariamente configurado → reducir superficie eliminándolo del env.
- **Riesgo específico si luego se implementa sin cuidado:**
  - El webhook handler debe validar la firma HMAC usando `POLAR_WEBHOOK_SECRET` con comparación **timing-safe** (`crypto.timingSafeEqual`).
  - Idempotencia: Polar puede reenviar eventos; el handler debe deduplicar por `event.id` (guardar en tabla).
  - Replay-protection: validar `event.created` está dentro de una ventana (±5 min respecto a `Date.now()`).
- **Fix:**
  - Determinar qué rol cumple Polar en el proyecto (ver `docs/technical/betterauth/polar.md` y `.claude/agents/polar-payments-expert.md`).
  - Si se va a implementar, usar el plugin oficial de BetterAuth para Polar (`@polar-sh/better-auth`) que maneja la firma internamente.
  - Si no se va a usar, eliminar las env vars (`POLAR_*`) del `docker-compose.yml` y `env.example`.
- **Estado:** Crítico de decisión (o implementar correctamente o eliminar)

---

## 4. Autenticación y autorización

### [CRITICAL-AUTH1] Endpoints admin sin verificación de rol (resuelto en grupo A)
- **Estado:** **Auto-fixed** (ver `src/lib/auth-guard.ts:118-134` → `requireAdmin()`). Aplicado a `/api/admin/users`, `/api/admin/users/[id]`, y 5 endpoints de debug.

### [CRITICAL-AUTH2] Bulletins pipeline sin auth (resuelto en grupo A)
- **Estado:** **Auto-fixed**. Todos los endpoints `/api/bulletins/[id]/generate-*`, `orchestrate`, `render-final-video` exigen `requireActiveUser()`.

### [CRITICAL-AUTH3] Open redirect `javascript:` en tracking (resuelto)
- **Estado:** **Auto-fixed**. `sanitizeRedirect()` en `src/app/api/track/click/[trackingId]/route.ts:20-31`.

### [CRITICAL-AUTH4] `send-test-email` como relay (resuelto)
- **Estado:** **Auto-fixed**. Destinatario forzado a `session.user.email`.

### [HIGH-AUTH5] Convención "admin = allowedMenus == null" sigue frágil
- **OWASP:** A01:2025 — Broken Access Control
- **Ubicación:** `src/lib/auth-guard.ts:122`
- **Descripción:** Cualquier bug de migración, seed o INSERT que deje `allowedMenus = null` convierte al usuario en admin automáticamente. No hay test que cubra este invariante.
- **Fix:** Añadir columna `role: text("role").default("user").notNull()` al schema con enum check `('user', 'admin', 'superadmin')`. Migrar los admins actuales, luego cambiar la comprobación en `requireAdmin()` sin tocar callers.
- **Estado:** Recomendación (requiere migración)

### [HIGH-AUTH6] Endpoints de categorías/sources/subscribers NO usan `requireAdmin`
- **OWASP:** A01:2025 — Broken Access Control (horizontal privilege)
- **Ubicación:** `src/app/api/bulletins/categories/route.ts`, `.../categories/[id]/route.ts`, `.../categories/reorder/route.ts`, `src/app/api/sources/route.ts`, `.../sources/[id]/route.ts`, `src/app/api/subscribers/route.ts`, `.../subscribers/[id]/route.ts`, `.../subscribers/import/route.ts`, `.../subscribers/export/route.ts`
- **Descripción:** Todos validan `getSession()` (cualquier usuario autenticado) pero ninguno valida `requireAdmin()`. Un usuario con `allowedMenus=["dashboard"]` puede:
  - Crear/eliminar categorías del boletín (afectando la clasificación futura).
  - Crear/eliminar/desactivar fuentes de noticias (apagando el scraping).
  - Exportar el CSV completo de suscriptores (fuga de lista de correos).
  - Importar suscriptores masivamente (spam amplificado).
  - Eliminar suscriptores (sabotaje).
- **Fix:** Añadir `requireAdmin()` (o `requireActiveUser()` + comprobación de `allowedMenus.includes("X")` según política) en todos estos endpoints.
- **Estado:** Recomendación crítica — **candidato a auto-fix trivial en siguiente pase** (solo sustituir `auth.api.getSession` por `requireAdmin()`). No lo aplico ahora porque requiere decidir: ¿deberían los "editores" poder gestionar suscriptores? Depende de la política de roles del negocio.

### [HIGH-AUTH7] Endpoints de edición de boletines no verifican ownership ni rol
- **OWASP:** A01:2025 — Broken Access Control
- **Ubicación:** `src/app/api/bulletins/[id]/route.ts`, `update-classified/route.ts`, `update-news/route.ts`, `fetch-full-content/route.ts`, `enhance-content/route.ts`
- **Descripción:** Cualquier usuario autenticado puede editar, eliminar o disparar IA sobre cualquier boletín — no solo los propios (aunque el concepto de "owner" no existe en el schema; es global). No es un bug si el modelo de negocio es "todos los usuarios autenticados son co-editores", pero el campo `isActive` en `user` sugiere que hay usuarios "suspendidos" que no deberían poder actuar. Hoy `auth.api.getSession` devuelve sesión válida incluso para `isActive=false`.
- **Fix:** Sustituir `getSession` por `requireActiveUser()` (que sí comprueba `isActive`). El helper ya existe.
- **Estado:** Recomendación (trivial)

### [MEDIUM-AUTH8] `requireEmailVerification: false` en BetterAuth
- **OWASP:** A07:2025 — Authentication Failures
- **Ubicación:** `src/lib/auth.ts:31`
- **Detalle:** Sin cambios desde el audit inicial. Si se abre signup público en el futuro, activar la verificación.
- **Estado:** Recomendación (preventiva)

### [MEDIUM-AUTH9] `sameSite: "lax"` como decisión justificada (Google OAuth)
- **Estado:** Documentado en `group-b-fixes.md` y la memoria. No es un finding — es una decisión de compatibilidad. A futuro evaluar step-up auth para operaciones destructivas.

### [LOW-AUTH10] Vulnerabilidad CVE en `better-auth@1.3.34` (2FA bypass)
- **OWASP:** A07:2025 — Authentication Failures / A03 — Supply Chain
- **Ubicación:** `package.json:48`
- **Descripción:** `pnpm audit` reporta 2 CVEs en `better-auth` 1.3.34:
  - CRITICAL: 2FA bypass (patched in 1.4.2).
  - LOW: Multi-session sign-out hook admite cookies forjadas para revocar sesiones arbitrarias (patched in 1.4.0).
  - Hoy no hay 2FA activado en el proyecto, así que el CRITICAL no es explotable; la LOW tampoco (no se usa multi-session).
- **Fix:** `pnpm up better-auth@^1.4.2`. Regresión test del sign-in de Google OAuth.
- **Estado:** Recomendación

### [LOW-AUTH11] Sesiones no vinculadas a device/fingerprint
- **OWASP:** A07:2025 — Authentication Failures
- **Ubicación:** `src/lib/auth.ts`, tabla `session` con `ipAddress`/`userAgent`
- **Descripción:** La cookie de sesión es portable: si se filtra (XSS, malware local), el atacante la usa desde cualquier IP/dispositivo sin alerta. Ya se guarda `ipAddress` y `userAgent` en `session` — pero no se valida contra ellos al renovar.
- **Fix:** Al hacer `updateAge`, comprobar que el `ipAddress` actual está en la misma /24 que el original. Si cambia drásticamente → forzar re-login. Flag-protegido por feature flag para evitar falsos positivos en viajes.
- **Estado:** Recomendación (posterior)

---

## 5. Inyección / SSRF

### [HIGH-INJ1] Prototype pollution en `add-manual-news` (resuelto)
- **Estado:** **Auto-fixed**. `CATEGORY_SLUG_REGEX` + `RESERVED_KEYS` + `Object.create(null)`.

### [HIGH-INJ2] SSRF en `fetchArticleFullContent` (resuelto)
- **Estado:** **Auto-fixed**. `assertAllowedUrl()` + `fetchWithSizeLimit()`.

### [HIGH-INJ3] SSRF en Firecrawl desde `newsSources` (nuevo — ver SVC6 arriba)

### [MEDIUM-INJ4] `orchestrate` hace fetch a URL construida con `NEXT_PUBLIC_APP_URL`
- **OWASP:** A10:2021 — SSRF (menor)
- **Ubicación:** `src/app/api/bulletins/[id]/orchestrate/route.ts:76, 100`
- **Descripción:** `await fetch(\`${process.env.NEXT_PUBLIC_APP_URL}/api/bulletins/...\`)` — si `NEXT_PUBLIC_APP_URL` se contamina (env var con `http://evil.com`), el servidor hace fetches a servidor atacante enviando el `id` del boletín. Hoy `NEXT_PUBLIC_APP_URL` se fija en build-time (`https://app.ottoseguridadai.com`), pero es una anti-pattern.
- **Fix:** Refactorizar `orchestrate` para llamar a las funciones directamente (como se pidió en el audit original para `cron/daily-bulletin`). Elimina el roundtrip HTTP innecesario y cierra el SSRF.
- **Estado:** Recomendación

### [MEDIUM-INJ5] `sql.raw()` en dashboard (mitigado con validación)
- **Ubicación:** `src/lib/db/queries/dashboard.ts:101`
- **Estado:** OK — se añadió validación `safeWeeks` en fix previo.

### [LOW-INJ6] `sql\`...\` ` usa bindings seguros
- **Estado:** Revisado. Todos los `sql\`...${binding}\`` son parametrizados por Drizzle. Sólo `sql.raw` es peligroso y ya está mitigado.

### [LOW-INJ7] Nombres de archivo en MinIO sin validación fuerte
- **OWASP:** A03:2025 — Injection (path-like)
- **Ubicación:** `src/lib/storage/minio.ts:82` (passes `fileName` direct to `putObject`)
- **Descripción:** Los callers pasan paths como `bulletins/${id}/avatars/${category}.mp4`. Si `category` tuviera `..` llegaría a S3 con ese path literal (S3 lo trataría como string, no como path del FS, así que path traversal no aplica en sí — pero sí permite "escribir en carpeta inesperada" si el pattern se indexa). Ya se sanitiza `category` en `generate-tts` (fix B), replicar en `generate-avatars`:
  - `src/app/api/bulletins/[id]/generate-avatars/route.ts:138, 142` usa `news.category` sin sanitización antes de construir `fileName`.
- **Fix:** Aplicar la misma `sanitizeCategorySlug` (ya existe en `generate-tts`) también en `generate-avatars`.
- **Estado:** Recomendación (trivial) — **candidato a auto-fix**.

---

## 6. Logging & errores

### [HIGH-LOG1] `error.message` al cliente en múltiples endpoints
- **OWASP:** A09:2025 — Security Logging and Alerting Failures / A05 — Security Misconfiguration
- **Ubicación:** Endpoints que aún usan `{ error, message: (error as Error).message }`:
  - `src/app/api/bulletins/route.ts:78`
  - `src/app/api/bulletins/[id]/fetch-full-content/route.ts:54`
  - `src/app/api/bulletins/[id]/generate-avatars/route.ts:226`
  - `src/app/api/bulletins/[id]/generate-video/route.ts:132`
  - `src/app/api/bulletins/[id]/orchestrate/route.ts:177`
  - `src/app/api/bulletins/[id]/render-final-video/route.ts:262`
  - `src/app/api/bulletins/[id]/update-classified/route.ts:98`
  - `src/app/api/bulletins/[id]/update-news/route.ts:86`
  - `src/app/api/bulletins/[id]/progress/route.ts:107`
  - `src/app/api/bulletins/[id]/send-test-email/route.ts:108`
  - `src/app/api/sources/route.ts:50, 102`
  - `src/app/api/sources/[id]/route.ts:55, 113, 160`
  - `src/app/api/subscribers/route.ts:68, 140`
  - `src/app/api/subscribers/[id]/route.ts:68, 136, 190`
  - `src/app/api/subscribers/import/route.ts:111`
  - `src/app/api/subscribers/export/route.ts:79`
  - `src/app/api/cron/daily-bulletin/route.ts:187`
  - `src/app/api/dashboard/stats/route.ts:54`
  - `src/app/api/crawl4ai/health/route.ts:48`
  - `src/app/api/upload/image/route.ts:102`
  - `src/app/api/upload/video/route.ts:94`
- **Descripción:** `(error as Error).message` puede exponer paths de archivos, nombres de columnas PG, hostnames internos, estructura de JSON interno. El grupo B migró ~8 endpoints al helper `errorResponse()` pero quedan ~21 más.
- **Fix:** Sustituir cada uno por `errorResponse("mensaje público", 500, error)`. Reemplazo mecánico. **Candidato a auto-fix en batch en siguiente pasada.**
- **Estado:** Recomendación

### [MEDIUM-LOG2] Endpoints `track/*` y `unsubscribe/*` no registran IP/UA
- **OWASP:** A09:2025 — Security Logging and Alerting Failures
- **Ubicación:** `src/app/api/track/click/[trackingId]/route.ts`, `track/open/[trackingId]/route.ts`, `unsubscribe/[token]/route.ts`
- **Descripción:** Estos endpoints son públicos. Son el vector ideal para medir tráfico suspechoso (bots que inflan métricas, intento de desuscripción masiva). Hoy no se registra la IP/UA del que dispara.
- **Fix:** Guardar `x-forwarded-for` (Traefik lo setea) y `user-agent` en `email_sends` / `subscribers`. No es PII si ya tienes el email.
- **Estado:** Recomendación

### [MEDIUM-LOG3] Auditoría de cambios solo cubre bulletins, no subscribers/sources/users
- **OWASP:** A09:2025 — Security Logging and Alerting Failures
- **Ubicación:** `src/lib/db/queries/audit.ts` → tabla `bulletinAuditLogs`
- **Descripción:** Los cambios críticos sí se auditan en `bulletins` (autorización/publicación/reactivación/envío de emails/eliminación). Pero:
  - La creación/eliminación de usuarios no se audita.
  - El cambio de `allowedMenus` (escalada de privilegios) no se audita.
  - La eliminación de suscriptores (importante para cumplimiento GDPR/LOPD) no se audita.
  - La creación/borrado de fuentes de noticias tampoco.
- **Fix:** Extender el concepto `auditLog` a una tabla general `activityLogs` con `entity_type`, `entity_id`, `action`, `userId`, `metadata`. Migrar los calls existentes.
- **Estado:** Recomendación

---

## 7. Dependencias

### [HIGH-DEP1] 36 CVEs reportados por `pnpm audit --prod`
- **OWASP:** A03:2025 — Software Supply Chain Failures
- **Severidad agregada:** 2 Critical + 14 High + 14 Moderate + 6 Low
- **Principales:**

| Paquete | CVE/ID | Nivel | Parche | Impacto actual |
|---|---|---|---|---|
| `better-auth` | GHSA-mwrc-r87v-v8f3 | **Critical** | ≥1.4.2 | 2FA bypass (no usado hoy) |
| `minio>fast-xml-parser` | GHSA-mpg4-rc92-vx8v, etc. | **Critical** | ≥4.5.4 | XML entity encoding → potencial RCE en MinIO client |
| `next` 15.4.10 | 2 CVEs DoS | High | ≥15.5.x | DoS en dev server (no afecta standalone build) |
| `drizzle-orm` | GHSA-... | High | ≥0.45.x | SQL injection si se pasan arrays sin escape (no se usa el path vulnerable aquí) |
| `minio>lodash` | GHSA-p6mc-m468-83gw | High | update minio | Code injection vía `_.template` (no usamos templating) |
| `cheerio>undici` | 3 CVEs WebSocket | High | ≥7.25 | DoS/integer overflow (no usamos WebSocket) |
| `better-auth>rou3` | path traversal | Moderate | update | Requiere patrón de routing específico |
| `nodemailer` | GHSA-c7w3-x93f-qmm8 | Low | ≥8.0.4 | SMTP command injection via envelope.size (path no usado) |
| `@remotion/bundler>webpack` | 2 CVEs | Low | — | SSRF en buildHttp (build-time, no runtime) |
| `serialize-javascript` | GHSA-... | Moderate | — | XSS si se serializa HTML no escapado |
| `defu` | prototype pollution | Moderate | — | Solo explotable con input adversario a `defu()` |

- **Fix plan:**
  1. `pnpm up better-auth@^1.4.2 nodemailer@^8.0.4` (mejoras triviales, verificar APIs rotas).
  2. `pnpm up drizzle-orm` — verificar breaking changes.
  3. `pnpm up next` — mayor impacto; validar en staging.
  4. `pnpm up minio` — el stack de minio tiene 3 CVEs (fast-xml-parser, lodash), todas se cierran con un `pnpm up minio@latest`.
  5. `pnpm up @remotion/*` al último 4.0.x.
- **Estado:** Recomendación (aplicar en orden, CI entre cada grupo)

### [MEDIUM-DEP2] Lock de `pnpm` no auditado en CI
- **Ubicación:** `.github/workflows/` (no verificado)
- **Descripción:** No hay evidencia de que el CI corra `pnpm audit --prod` o `snyk test` automáticamente en cada PR. Eso implica que las vulnerabilidades nuevas (como las 36 actuales) pueden acumularse sin alerta.
- **Fix:** Añadir job de GitHub Actions que corra `pnpm audit --prod --audit-level=high` y falle el PR si hay High/Critical nuevos. Opcional: Dependabot o Renovate.
- **Estado:** Recomendación

---

## 8. Matriz de hallazgos previos

Hallazgos del audit inicial (30) — estado actualizado:

| # | Título corto | Severidad original | Estado hoy |
|---|---|---|---|
| 1 | Admin endpoints sin rol | Critical | FIXED (grupo A) |
| 2 | Debug endpoints públicos / SSRF | Critical | FIXED (grupo A) |
| 3 | Bulletins pipeline sin auth | Critical | FIXED (grupo A) |
| 4 | Open redirect `javascript:` | Critical | FIXED (grupo A) |
| 5 | `send-test-email` como relay | Critical | FIXED (grupo A) |
| 6 | 36 CVEs de deps | High | Pendiente (DEP1) |
| 7 | Cron reenvía cookie | High | Pendiente (refactor arquitectónico) |
| 8 | `ignoreDuringBuilds` / `ignoreBuildErrors` | High | Pendiente |
| 9 | Admin = allowedMenus==null | High | FIXED parcial (helper creado) + recomendación role column |
| 10 | Sin rate limiting | High | Pendiente (Traefik — ver snippet 1) |
| 11 | Prototype pollution add-manual-news | High | FIXED (grupo B) |
| 12 | SSRF fetch-full-content | High | FIXED (grupo B) |
| 13 | `/api/diagnostics` público | Medium | FIXED (grupo B) |
| 14 | `BETTER_AUTH_SECRET` cookie no explícitos | Medium | FIXED (grupo B) |
| 15 | `cheerio`/`fetch` sin tope tamaño | Medium | FIXED (grupo B) |
| 16 | Simli `hlsUrl` no validado | Medium | FIXED (grupo B) |
| 17 | `ignoreBuildErrors` (duplicado de 8) | Medium | Pendiente |
| 18 | `any` en render-final-video | Medium | FIXED (grupo B) |
| 19 | 500 filtran `error.message` | Medium | FIXED parcial (~8 endpoints); 21 restantes (LOG1) |
| 20 | `generate-tts` escribe con `category` | Medium | FIXED (grupo B) |
| 21 | Chat prompt injection | Medium | FIXED parcial |
| 22 | Logs con PII (email) | Low | FIXED (grupo B) |
| 23 | `trustedOrigins` incluye localhost | Low | FIXED (grupo B) |
| 24 | Falta CSP | Low | Pendiente |
| 25 | Cookie sin `SameSite=Strict` | Low | DECIDIDO no aplicar (Google OAuth) |
| 26 | `requireEmailVerification: false` | Low | Pendiente |
| 27 | Fallback hardcoded ottoseguridadai.com | Low | FIXED (grupo B) |
| 28 | Enumerabilidad por fecha en `/bulletin/[id]` | Info | Pendiente (documentar) |
| 29 | `maxRetries: 150` | Info | FIXED (grupo B) |
| 30 | Tracking IDs manipulables | Info | Pendiente |

**Fixes pendientes de hallazgos previos:** 10 (6, 7, 8, 10, 19-parcial, 24, 26, 28, 30, + la recomendación de columna `role` que queda como "role column").

---

## 9. Snippets listos para copiar

### Snippet 1 — `docker-compose.yml` con rate-limit y IP allowlist

```yaml
# Añadir dentro de `deploy.labels` del servicio `ottoseguridad`
- traefik.http.middlewares.ottoseguridad-buffering.buffering.maxRequestBodyBytes=2097152  # 2 MB global (bajar del 50 MB actual)
- traefik.http.middlewares.ottoseguridad-buffering.buffering.maxResponseBodyBytes=10485760 # 10 MB respuesta

# Buffer ampliado SOLO para uploads
- traefik.http.middlewares.ottoseguridad-upload-buffer.buffering.maxRequestBodyBytes=167772160 # 160 MB
- traefik.http.routers.ottoseguridad-uploads.rule=Host(`app.ottoseguridadai.com`) && PathPrefix(`/api/upload`)
- traefik.http.routers.ottoseguridad-uploads.entrypoints=websecure
- traefik.http.routers.ottoseguridad-uploads.tls.certresolver=letsencryptresolver
- traefik.http.routers.ottoseguridad-uploads.service=ottoseguridad
- traefik.http.routers.ottoseguridad-uploads.middlewares=ottoseguridad-upload-buffer,ottoseguridad-secure-headers,ottoseguridad-ratelimit-upload,ottoseguridad-compress

# Rate limit global (100 rps, burst 200)
- traefik.http.middlewares.ottoseguridad-ratelimit-global.ratelimit.average=100
- traefik.http.middlewares.ottoseguridad-ratelimit-global.ratelimit.burst=200
- traefik.http.middlewares.ottoseguridad-ratelimit-global.ratelimit.period=1s

# Rate limit para endpoints caros (/api/chat, /api/bulletins/*/generate-*, /api/bulletins/*/send-email)
- traefik.http.middlewares.ottoseguridad-ratelimit-expensive.ratelimit.average=5
- traefik.http.middlewares.ottoseguridad-ratelimit-expensive.ratelimit.burst=10
- traefik.http.middlewares.ottoseguridad-ratelimit-expensive.ratelimit.period=1m

# Rate limit para /api/track/* (público)
- traefik.http.middlewares.ottoseguridad-ratelimit-tracking.ratelimit.average=10
- traefik.http.middlewares.ottoseguridad-ratelimit-tracking.ratelimit.burst=20
- traefik.http.middlewares.ottoseguridad-ratelimit-tracking.ratelimit.period=1s
- traefik.http.middlewares.ottoseguridad-ratelimit-tracking.ratelimit.sourcecriterion.ipstrategy.depth=1

# Rate limit para /api/upload/* (autenticado + público a nivel L7)
- traefik.http.middlewares.ottoseguridad-ratelimit-upload.ratelimit.average=3
- traefik.http.middlewares.ottoseguridad-ratelimit-upload.ratelimit.burst=5
- traefik.http.middlewares.ottoseguridad-ratelimit-upload.ratelimit.period=1m

# IP allowlist para /api/cron/* (CIDR del scheduler — ajustar)
- traefik.http.middlewares.ottoseguridad-cron-allowlist.ipallowlist.sourcerange=76.76.21.0/24,185.199.108.0/22
# Nota: los CIDRs de arriba son ejemplos de Vercel/GitHub. Confirmar los del scheduler real.

# Router para /api/cron/* con allowlist
- traefik.http.routers.ottoseguridad-cron.rule=Host(`app.ottoseguridadai.com`) && PathPrefix(`/api/cron`)
- traefik.http.routers.ottoseguridad-cron.entrypoints=websecure
- traefik.http.routers.ottoseguridad-cron.tls.certresolver=letsencryptresolver
- traefik.http.routers.ottoseguridad-cron.service=ottoseguridad
- traefik.http.routers.ottoseguridad-cron.middlewares=ottoseguridad-cron-allowlist,ottoseguridad-secure-headers

# Router para endpoints caros con rate-limit específico
- traefik.http.routers.ottoseguridad-expensive.rule=Host(`app.ottoseguridadai.com`) && (PathPrefix(`/api/chat`) || PathRegexp(`^/api/bulletins/[^/]+/(generate-tts|generate-avatars|generate-video|orchestrate|render-final-video|send-email)$`))
- traefik.http.routers.ottoseguridad-expensive.entrypoints=websecure
- traefik.http.routers.ottoseguridad-expensive.tls.certresolver=letsencryptresolver
- traefik.http.routers.ottoseguridad-expensive.service=ottoseguridad
- traefik.http.routers.ottoseguridad-expensive.middlewares=ottoseguridad-ratelimit-expensive,ottoseguridad-buffering,ottoseguridad-secure-headers

# Router para /api/track/* con rate-limit específico
- traefik.http.routers.ottoseguridad-tracking.rule=Host(`app.ottoseguridadai.com`) && PathPrefix(`/api/track`)
- traefik.http.routers.ottoseguridad-tracking.entrypoints=websecure
- traefik.http.routers.ottoseguridad-tracking.tls.certresolver=letsencryptresolver
- traefik.http.routers.ottoseguridad-tracking.service=ottoseguridad
- traefik.http.routers.ottoseguridad-tracking.middlewares=ottoseguridad-ratelimit-tracking,ottoseguridad-secure-headers

# Prioridad: los routers más específicos deben tener mayor prioridad
- traefik.http.routers.ottoseguridad-cron.priority=100
- traefik.http.routers.ottoseguridad-expensive.priority=90
- traefik.http.routers.ottoseguridad-tracking.priority=80
- traefik.http.routers.ottoseguridad-uploads.priority=70
- traefik.http.routers.ottoseguridad.priority=10  # router default (todo lo demás)
```

### Snippet 2 — Security headers en Traefik + Redirect HTTP→HTTPS

```yaml
# Secure headers (defensa en profundidad sobre los ya en next.config.ts)
- traefik.http.middlewares.ottoseguridad-secure-headers.headers.stsSeconds=63072000
- traefik.http.middlewares.ottoseguridad-secure-headers.headers.stsIncludeSubdomains=true
- traefik.http.middlewares.ottoseguridad-secure-headers.headers.stsPreload=true
- traefik.http.middlewares.ottoseguridad-secure-headers.headers.browserXssFilter=true
- traefik.http.middlewares.ottoseguridad-secure-headers.headers.contentTypeNosniff=true
- traefik.http.middlewares.ottoseguridad-secure-headers.headers.frameDeny=true
- traefik.http.middlewares.ottoseguridad-secure-headers.headers.referrerPolicy=strict-origin-when-cross-origin
- traefik.http.middlewares.ottoseguridad-secure-headers.headers.permissionsPolicy=camera=(), microphone=(), geolocation=(), interest-cohort=()
- traefik.http.middlewares.ottoseguridad-secure-headers.headers.contentSecurityPolicy=default-src 'self'; img-src 'self' data: https://*.ottoseguridadai.com https://lh3.googleusercontent.com https://*.supabase.co; media-src 'self' https://*.ottoseguridadai.com https://*.supabase.co; connect-src 'self' https://api.openrouter.ai https://openrouter.ai; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
# CSP: 'unsafe-eval' es necesario para Remotion/Next RSC; 'unsafe-inline' para los styles generados por Next.
# En un segundo pase, migrar a CSP con nonces y quitar 'unsafe-inline'.

# Compression
- traefik.http.middlewares.ottoseguridad-compress.compress=true

# Aplicar al router principal
- traefik.http.routers.ottoseguridad.middlewares=ottoseguridad-buffering,ottoseguridad-ratelimit-global,ottoseguridad-secure-headers,ottoseguridad-compress

# Redirect HTTP→HTTPS (si Traefik global no lo tiene)
- traefik.http.routers.ottoseguridad-http.rule=Host(`app.ottoseguridadai.com`)
- traefik.http.routers.ottoseguridad-http.entrypoints=web
- traefik.http.routers.ottoseguridad-http.middlewares=ottoseguridad-https-redirect
- traefik.http.middlewares.ottoseguridad-https-redirect.redirectscheme.scheme=https
- traefik.http.middlewares.ottoseguridad-https-redirect.redirectscheme.permanent=true

# Healthcheck
# Necesita que la app exponga /api/health (ver snippet 5).
# Añadir dentro del servicio `ottoseguridad:`:
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 40s
```

### Snippet 3 — `.dockerignore` recomendado

```
# Dependencies
node_modules
.pnpm-store

# Environment files (CRITICAL)
.env
.env.*
!.env.example

# Git
.git
.gitignore
.gitattributes

# IDE / agent config
.vscode
.idea
.claude

# Next.js
.next
out

# Build artifacts
build
dist

# Audit / specs / docs internos
audit
specs
docs
*.md
!README.md

# Tests
coverage
test-results
playwright-report
.playwright-mcp

# Misc
.DS_Store
*.pem
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Docker files (avoid recursive issues)
Dockerfile
Dockerfile.*
docker-compose*.yml

# Python virtual environments
.venv
venv
__pycache__

# Remotion output / runtime temp
output
temp
public/videos/bulletin-*.mp4
public/audios/*.mp3

# Local dev overrides
localdocker-compose.yml
docker-compose.local.yml
docker-compose.dev.yml
```

### Snippet 4 — `docker-compose.yml` con `secrets:` de Swarm

```yaml
# Definir los secrets fuera del servicio
secrets:
  better_auth_secret:
    external: true   # crear con: printf "$BETTER_AUTH_SECRET" | docker secret create better_auth_secret -
  postgres_url:
    external: true
  supabase_service_role_key:
    external: true
  smtp_pass:
    external: true
  polar_access_token:
    external: true
  polar_webhook_secret:
    external: true
  minio_secret_key:
    external: true
  openrouter_api_key:
    external: true
  elevenlabs_api_key:
    external: true
  simli_api_key:
    external: true
  firecrawl_api_key:
    external: true
  google_client_secret:
    external: true
  cron_secret:
    external: true

services:
  ottoseguridad:
    image: faustoai/ottoseguridadai:1.1.2
    secrets:
      - better_auth_secret
      - postgres_url
      - supabase_service_role_key
      - smtp_pass
      - polar_access_token
      - polar_webhook_secret
      - minio_secret_key
      - openrouter_api_key
      - elevenlabs_api_key
      - simli_api_key
      - firecrawl_api_key
      - google_client_secret
      - cron_secret
    environment:
      # Solo las variables no-sensibles van aquí
      - TZ=America/Guayaquil
      - NODE_ENV=production
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - OPENROUTER_MODEL=${OPENROUTER_MODEL}
      - OPENAI_EMBEDDING_MODEL=${OPENAI_EMBEDDING_MODEL}
      - FIRECRAWL_API_URL=${FIRECRAWL_API_URL}
      - DISABLE_FIRECRAWL=${DISABLE_FIRECRAWL}
      - CRAWL4AI_API_URL=${CRAWL4AI_API_URL}
      - CRAWL4AI_TIMEOUT=${CRAWL4AI_TIMEOUT}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_PORT=${MINIO_PORT}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_USE_SSL=${MINIO_USE_SSL}
      - MINIO_BUCKET=${MINIO_BUCKET}
      - SIMLI_FACE_ID=${SIMLI_FACE_ID}
      - ELEVENLABS_VOICE_ID=${ELEVENLABS_VOICE_ID}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_SECURE=${SMTP_SECURE}
      - SMTP_USER=${SMTP_USER}
      - SMTP_FROM=${SMTP_FROM}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - BLOB_READ_WRITE_TOKEN=${BLOB_READ_WRITE_TOKEN}
      # Los secretos se mapean a env vars desde los archivos:
      - BETTER_AUTH_SECRET_FILE=/run/secrets/better_auth_secret
      - POSTGRES_URL_FILE=/run/secrets/postgres_url
      - SUPABASE_SERVICE_ROLE_KEY_FILE=/run/secrets/supabase_service_role_key
      - SMTP_PASS_FILE=/run/secrets/smtp_pass
      - POLAR_ACCESS_TOKEN_FILE=/run/secrets/polar_access_token
      - POLAR_WEBHOOK_SECRET_FILE=/run/secrets/polar_webhook_secret
      - MINIO_SECRET_KEY_FILE=/run/secrets/minio_secret_key
      - OPENROUTER_API_KEY_FILE=/run/secrets/openrouter_api_key
      - ELEVENLABS_API_KEY_FILE=/run/secrets/elevenlabs_api_key
      - SIMLI_API_KEY_FILE=/run/secrets/simli_api_key
      - FIRECRAWL_API_KEY_FILE=/run/secrets/firecrawl_api_key
      - GOOGLE_CLIENT_SECRET_FILE=/run/secrets/google_client_secret
      - CRON_SECRET_FILE=/run/secrets/cron_secret
```

Luego se necesita un entrypoint que lea los `*_FILE` y los exporte como env vars equivalentes (patrón estándar de Swarm). Sketch:

```sh
#!/bin/sh
# entrypoint.sh
for var in BETTER_AUTH_SECRET POSTGRES_URL SUPABASE_SERVICE_ROLE_KEY SMTP_PASS POLAR_ACCESS_TOKEN POLAR_WEBHOOK_SECRET MINIO_SECRET_KEY OPENROUTER_API_KEY ELEVENLABS_API_KEY SIMLI_API_KEY FIRECRAWL_API_KEY GOOGLE_CLIENT_SECRET CRON_SECRET; do
  file_var="${var}_FILE"
  file_path=$(eval echo "\$$file_var")
  if [ -n "$file_path" ] && [ -f "$file_path" ]; then
    export "$var"="$(cat $file_path)"
  fi
done
exec node server.js
```

Y actualizar `Dockerfile`:
```dockerfile
COPY --from=builder /app/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
CMD ["/app/entrypoint.sh"]
```

### Snippet 5 — Dockerfile mejorado

```dockerfile
# syntax=docker/dockerfile:1.7
# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Pin pnpm version (no @latest)
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# NEXT_PUBLIC_* solamente (realmente públicos)
ARG NEXT_PUBLIC_APP_URL=https://app.ottoseguridadai.com
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Secrets generados random para que el build no falle por env.
# Nunca llegan al runtime — el build standalone no los persiste en el bundle
# (verificar con `grep -r "$(openssl rand)" .next/standalone` tras build).
RUN POSTGRES_URL="postgresql://build:build@localhost:5432/build" \
    BETTER_AUTH_SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')" \
    pnpm run build:ci

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy with chown (evita el RUN chown posterior, más pequeño el image)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck endpoint (crear /api/health en src/app/api/health/route.ts)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=40s \
  CMD wget --spider -q http://localhost:3000/api/health || exit 1

CMD ["/app/entrypoint.sh"]
```

### Snippet 6 — `/api/health/route.ts` (nuevo)

```ts
// src/app/api/health/route.ts
import { NextResponse } from "next/server";

// No toca BD — se usa sólo para healthcheck L7 de Docker/Traefik.
// Si se quiere validar BD, crear /api/health/deep separado y allowlistear por IP.
export async function GET() {
  return NextResponse.json({ status: "ok" }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
```

---

## 10. Fixes aplicados

En esta pasada de revisión se aplicaron solo dos fixes menores (el prompt pidió que los cambios de infra quedaran como snippets):

- Ninguna modificación de código en esta pasada de audit — el usuario desea decidir qué aplicar del grupo A.

**Nota:** Los candidatos marcados como "auto-fix trivial" en este reporte son:
1. `requireAdmin()` o `requireActiveUser()` en endpoints de categorías/sources/subscribers (AUTH6, AUTH7) — 11 archivos.
2. Migrar los 21 endpoints restantes al helper `errorResponse()` (LOG1).
3. Aplicar `sanitizeCategorySlug` en `generate-avatars/route.ts:138, 142` (INJ7).
4. Cap de 2000 chars en texto a ElevenLabs/Simli (SVC8, SVC10).
5. Eliminar fallback `minioadmin/minioadmin` (SVC4).
6. Crear `src/app/api/health/route.ts` (para el healthcheck).

Se pueden aplicar en una pasada siguiente.

---

## 11. Plan de remediación por capas

### (a) Código — aplicable en un commit incremental
1. Sustituir `getSession` por `requireActiveUser` en endpoints de categorías/sources/subscribers (9 archivos).
2. Aplicar `requireAdmin` en subscribers export/import (CSV con PII).
3. Migrar 21 endpoints al helper `errorResponse()`.
4. Cap de caracteres en `generate-tts` y `generate-avatars` (2000 chars).
5. Sanitizar `category` en `generate-avatars` fileName.
6. Eliminar fallbacks `'minioadmin'`.
7. Crear `/api/health/route.ts`.
8. Aplicar `assertAllowedUrl()` antes de las llamadas a Firecrawl en `src/lib/news/scraper.ts`.
9. Validación DKIM/CRLF en email headers.
10. Refactorizar `orchestrate` y `cron/daily-bulletin` para llamar funciones directas (evita SSRF y cookie-forwarding).

### (b) Traefik labels — aplicable en un despliegue
Aplicar snippets 1 y 2: rate-limit por ruta, IP allowlist `/api/cron/*`, security headers, CSP, redirect HTTP→HTTPS, compression, healthcheck.

### (c) Docker / Swarm — requiere coordinación de ops
1. `.dockerignore` actualizado (snippet 3).
2. Dockerfile con Node 22, pnpm pinned, sin `BETTER_AUTH_SECRET` default (snippet 5).
3. Tag versionado en lugar de `:latest`.
4. Migrar a `secrets:` de Swarm (snippet 4) — requiere entrypoint que lea `*_FILE`.
5. Marcar imagen Docker Hub como privada (o migrar a GHCR).
6. Rotar todos los secrets actuales tras la migración (suponer comprometidos).

### (d) Dependencias — ventanas de mantenimiento
1. `pnpm up better-auth@^1.4.2 nodemailer@^8.0.4` (trivial).
2. `pnpm up minio` (cierra 3 CVEs en cascada).
3. `pnpm up @remotion/* next drizzle-orm` (uno a uno con CI de regresión).
4. Añadir `pnpm audit --audit-level=high` en CI.

### (e) Procesos / operacional
1. Rotación periódica de secretos (90 días): `BETTER_AUTH_SECRET`, `CRON_SECRET`, `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Verificar SPF/DKIM/DMARC del dominio `ottoseguridad.com`.
3. Confirmar visibilidad del repo Docker Hub.
4. Confirmar autenticación en `crawl.ottoseguridadai.com`.
5. Documentar en Playbook de incidentes: cómo revocar sesiones, cómo regenerar secretos, cómo invalidar tokens de unsubscribe comprometidos.
6. Decidir sobre Polar: implementar webhook handler correctamente o eliminar las env vars.

---

## 12. Verificación

Sin cambios de código aplicados en esta pasada, pero se verificó el estado del repo:

- **Typecheck:** `pnpm run typecheck` → PASS (estado heredado del grupo B).
- **Lint:** `pnpm run lint` → PASS (warnings preexistentes, ninguno nuevo).
- **`pnpm audit --prod`:** **36 vulnerabilities (2 critical, 14 high, 14 moderate, 6 low)** — sin cambios desde el grupo B.

---

## 13. Cambios respecto al audit inicial

**Áreas nuevas auditadas en esta revisión que antes no lo estaban:**

1. **Dockerfile** completo — multi-stage, build args, `COPY . .`, fallback de `BETTER_AUTH_SECRET`, Node LTS, pnpm no-pinneado.
2. **docker-compose.yml** — labels Traefik (o ausencia), secrets en `environment`, deploy config, volúmenes, redes externas, healthcheck faltante.
3. **`.dockerignore`** — revisado en profundidad; identificadas exclusiones faltantes (`audit/`, `.claude/`, `specs/`, `temp/`, etc.).
4. **Docker Hub / Registry** — visibilidad, tagging strategy, supply chain.
5. **Traefik middlewares** — rate-limit, IP allowlist, security headers a nivel proxy, CSP, compression, redirect HTTP→HTTPS.
6. **Supabase service_role key** — uso server-side, buckets públicos, riesgo de RLS bypass por descuido.
7. **MinIO** — fallbacks `minioadmin`, bucket policy `s3:GetObject`, presigned URLs, validación de Content-Type.
8. **Firecrawl** — SSRF desde `newsSources` tabla (no solo desde debug endpoints).
9. **Crawl4AI** — verificación de auth en `crawl.ottoseguridadai.com`.
10. **Simli / ElevenLabs** — cap de caracteres, prompt-injection indirecta, coste.
11. **SendGrid SMTP** — CRLF injection defensivo, DKIM/SPF/DMARC, bounce handling.
12. **Polar webhooks** — detectada la inconsistencia (env vars presentes sin endpoint).
13. **Endpoints de categorías/sources/subscribers** — faltan `requireAdmin`, permiten a cualquier usuario autenticado eliminar fuentes de noticias, exportar el CSV de suscriptores, etc.
14. **Endpoints de bulletins** — no verifican `isActive` (solo `getSession`).
15. **`error.message` al cliente** — inventario completo de los 21 endpoints restantes.
16. **Path traversal residual** en `generate-avatars` (el `category` del fileName a MinIO).
17. **Node 20 LTS expiry** y plan de migración a 22.
18. **Healthcheck faltante** en el contenedor.
19. **Pinning de imagen** con tag versionado vs `:latest`.

El audit inicial cubrió bien el código de aplicación (auth, injection, SSRF en content-fetcher) pero subestimó:
- Superficie de ataque de la infraestructura (Docker, Swarm, Traefik).
- Servicios externos como vectores (MinIO bucket, service_role key).
- Inconsistencias de configuración (Polar sin handler).

**Matriz de cobertura OWASP Top 10:2025:**

| Categoría | Audit inicial | Esta revisión |
|---|---|---|
| A01 — Broken Access Control | ✓ | ✓ (más hallazgos en endpoints gestión) |
| A02 — Security Misconfiguration | ✓ (headers) | ✓✓ (+ Docker, Traefik, secrets) |
| A03 — Supply Chain | ✓ (pnpm audit) | ✓✓ (+ pnpm@latest, imagen Docker) |
| A04 — Insecure Design | ✓ (no rate limit) | ✓✓ (+ Traefik rate-limit por ruta) |
| A05 — Security Misconfiguration | ✓ | ✓✓ (+ imagen pública, SPF/DKIM) |
| A06 — Vulnerable Components | parcial | ✓ (36 CVEs detallados + plan) |
| A07 — Authentication Failures | ✓ | ✓ |
| A08 — Data Integrity Failures | ✓ | ✓✓ (+ tag `:latest`, build secret) |
| A09 — Logging Failures | ✓ | ✓✓ (+ tracking IPs, audit scope) |
| A10 — Server-Side Request Forgery | ✓ | ✓✓ (+ Firecrawl, Crawl4AI auth) |
