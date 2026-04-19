---
name: Admin role convention in OttoSeguridad
description: Cómo el proyecto identifica administradores sin tener un campo role explícito
type: project
---

El schema (`src/lib/schema.ts`) no tiene campo `role`. Un usuario se considera admin cuando `user.allowedMenus == null`. Los usuarios con `allowedMenus` restringidos (array de slugs) son usuarios limitados. La página `src/app/dashboard/page.tsx` y `src/app/login/page.tsx` también consultan `isActive`.

**Why:** Convención heredada de la migración de menús dinámicos. Ningún PR agregó `role` explícito aunque ya hay 3 "tipos" de usuario implícitos (admin, limitado, desactivado).

**How to apply:**
- Al proteger rutas admin, usar `requireAdmin()` de `src/lib/auth-guard.ts` (añadido abril 2026).
- Si se propone añadir `role` al schema, migrar `requireAdmin()` sin tocar callers.
- No confundir `session.user` (BetterAuth) con el registro en la tabla `user`: `allowedMenus` vive solo en DB, hay que hacer select.
