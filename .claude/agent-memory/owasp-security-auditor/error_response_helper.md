---
name: Error response helper
description: Helper errorResponse() en src/lib/http/error-response.ts esconde detalles en prod
type: project
---

Se añadió `src/lib/http/error-response.ts` en el grupo B del audit (2026-04-18).
Helper `errorResponse(userMessage, status, error?, extra?)` que devuelve un
`NextResponse.json` incluyendo `message: error.message` SOLO cuando
`process.env.NODE_ENV === "development"`.

**Why:** Antes varios endpoints devolvían `{ error, message: (error as Error).message }` en 500s sin filtrar por entorno, filtrando stack-like hints a cualquier cliente en producción (OWASP A09 + A05).

**How to apply:**
- En todos los `catch` de route handlers que devuelvan 500, preferir
  `return errorResponse("Mensaje amigable", 500, error)` a construir el
  NextResponse.json manualmente.
- No lo uses para errores 4xx (ahí el detalle al usuario sí es valioso).
- Si necesitas campos extra (p.ej. `bulletinId`, `timing`), pásalos en
  `extra`: `errorResponse("...", 500, error, { timing })`.

**HIGH-LOG1 barrido mecánico (2026-04-18):** se aplicó el helper en 22
endpoints que aún devolvían `message: (error as Error).message` o
`details: error instanceof Error ? error.message : ...` dentro de
respuestas 500. La verificación `grep -rE "message:\s*\(error as Error\)\.message" src/app/api/`
debe seguir devolviendo cero. Los endpoints con bloque `isDev`-gated
preexistente (ej: `bulletins/[id]/route.ts`, `enhance-content`,
`generate-tts`, `debug/test-*`) se dejaron intactos porque ya cumplen
el contrato del helper.

**Caso especial cron:** en `cron/daily-bulletin/route.ts` el pipeline
interno acumula `pipeline.{step}.error` con detalles que se incluían en
el body 500. Se sanitiza en producción eliminando el campo `error` de
cada step mediante `delete copy.error` para evitar fugas equivalentes.
