---
name: Reusable auth guards
description: Guards centralizados en src/lib/auth-guard.ts para validación de sesión en API routes
type: project
---

Se añadió `src/lib/auth-guard.ts` en el audit de 2026-04-18 con tres helpers:
- `requireSession()` → 401 si no hay sesión
- `requireActiveUser()` → además verifica `user.isActive`
- `requireAdmin()` → además verifica `allowedMenus == null`

Patrón de uso:
```ts
const guard = await requireAdmin();
if (!guard.ok) return guard.response;
// continuar, `guard.session` y `guard.userRecord` disponibles
```

**Why:** Antes del audit cada endpoint repetía `const session = await auth.api.getSession({ headers: await headers() })` con distintos niveles de verificación (o sin ninguna). Esto causó múltiples fallos Critical por endpoints que sólo validaban sesión pero no privilegios.

**How to apply:**
- Nuevos endpoints bajo `/api/admin/*` → `requireAdmin()`.
- Endpoints que consumen APIs pagas (OpenRouter, ElevenLabs, Simli) → mínimo `requireActiveUser()`.
- Endpoints de escritura de datos de usuario → `requireActiveUser()`.
- Endpoints de lectura genéricos → `requireSession()`.
- Endpoints públicos (tracking, unsubscribe) → sin guard pero con validación de input estricta.
