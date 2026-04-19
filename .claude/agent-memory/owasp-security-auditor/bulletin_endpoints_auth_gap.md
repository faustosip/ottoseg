---
name: Bulletin endpoints inconsistent auth coverage
description: Patrón recurrente — endpoints nuevos bajo /api/bulletins/[id]/* olvidan validar sesión
type: feedback
---

Varios endpoints bajo `src/app/api/bulletins/[id]/*` fueron agregados sin llamadas a `auth.api.getSession`. Los detectados en el audit de 2026-04-18: `generate-tts`, `generate-avatars`, `generate-video`, `render-final-video`, `orchestrate`. Otros cercanos (añadidos después) sí tienen auth (`send-email`, `process`, `enhance-content`).

**Why:** El pipeline de video se desarrolló en una fase donde se priorizó velocidad de iteración sobre seguridad, y como los endpoints se llamaban desde un cliente ya autenticado, se asumió implícitamente que quedaban protegidos.

**How to apply:**
- Cualquier endpoint nuevo bajo `/api/bulletins/*`, `/api/news/*`, o que consuma APIs pagas debe empezar con `const guard = await requireActiveUser(); if (!guard.ok) return guard.response;`.
- Al hacer code-review de rutas en este proyecto, buscar específicamente `await context.params` / `await params.id` sin una llamada previa a `requireSession`/`requireActiveUser`/`requireAdmin` — ese patrón es síntoma del bug.
- El audit dejó fixes, pero si se añaden nuevos endpoints `[id]/...` hay que replicar el patrón.
