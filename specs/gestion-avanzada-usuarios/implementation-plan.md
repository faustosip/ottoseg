# Implementation Plan: Gestión Avanzada de Usuarios

## Overview

Agregar cambio de contraseña, estado activo/inactivo y permisos de menú al módulo de usuarios. Implica cambios en el esquema de BD, nuevas APIs, reescritura de la UI de usuarios y filtrado de navegación.

## Phase 1: Esquema y migración de BD

Agregar los campos necesarios a la tabla `user` y aplicar la migración.

### Tasks

- [ ] Agregar campos `isActive` (boolean) y `allowedMenus` (jsonb) a la tabla `user` en `src/lib/schema.ts`
- [ ] Generar y aplicar migración con `pnpm run db:generate && pnpm run db:push`

### Technical Details

**Archivo:** `src/lib/schema.ts` - tabla `user`

Campos a agregar después de `image`:
```typescript
isActive: boolean("is_active").default(true).notNull(),
allowedMenus: jsonb("allowed_menus").$type<string[] | null>(),
```

- `isActive`: default `true` para que usuarios existentes sigan funcionando
- `allowedMenus`: `null` = acceso total (retrocompatibilidad). Cuando tiene valor, es un array de slugs:
  ```json
  ["boletines", "fuentes", "suscriptores", "categorias", "usuarios", "dashboard"]
  ```

**Migración:**
```bash
pnpm run db:generate
pnpm run db:push
```

---

## Phase 2: APIs de backend

Crear las APIs necesarias para editar usuarios y obtener datos del usuario actual.

### Tasks

- [ ] Actualizar `GET /api/admin/users` para incluir `isActive` y `allowedMenus` en el select
- [ ] Crear `PUT /api/admin/users/[id]` para actualizar `isActive`, `allowedMenus` y opcionalmente `password`
- [ ] Crear `GET /api/admin/users/me` para obtener `isActive` y `allowedMenus` del usuario logueado

### Technical Details

**Archivo:** `src/app/api/admin/users/route.ts` (modificar)

En el GET, agregar al select:
```typescript
isActive: user.isActive,
allowedMenus: user.allowedMenus,
```

---

**Archivo nuevo:** `src/app/api/admin/users/[id]/route.ts`

Endpoint PUT:
- Body schema (Zod):
  ```typescript
  const updateUserSchema = z.object({
    isActive: z.boolean().optional(),
    allowedMenus: z.array(z.string()).nullable().optional(),
    password: z.string().min(8).optional(),
  });
  ```
- Para `isActive` y `allowedMenus`: update directo en tabla `user` con Drizzle
- Para `password`: BetterAuth almacena hashes en la tabla `account` (campo `password`). Usar la misma librería de hash que usa BetterAuth internamente. BetterAuth usa `better-auth/crypto` con `hashPassword`/`verifyPassword`:
  ```typescript
  import { hashPassword } from "better-auth/crypto";
  const hash = await hashPassword(password);
  // Actualizar en tabla account donde providerId = 'credential' y userId = id
  await db.update(account).set({ password: hash }).where(
    and(eq(account.userId, id), eq(account.providerId, "credential"))
  );
  ```
- Requiere autenticación

---

**Archivo nuevo:** `src/app/api/admin/users/me/route.ts`

Endpoint GET (ligero, para el header):
- Obtiene sesión actual
- Retorna `{ isActive, allowedMenus }` del usuario logueado
- Query: `select({ isActive, allowedMenus }).from(user).where(eq(user.id, session.user.id))`

---

## Phase 3: Reescribir UI de gestión de usuarios

Ampliar la página de usuarios con todas las funcionalidades nuevas.

### Tasks

- [ ] Reescribir `src/app/dashboard/settings/users/page.tsx` con panel expandible por usuario [complex]
  - [ ] Switch activo/inactivo en cada fila (llama PUT /api/admin/users/[id])
  - [ ] Panel expandible al clicar un usuario con: cambio de contraseña y checkboxes de permisos de menú
  - [ ] Guardar permisos de menú (llama PUT /api/admin/users/[id])

### Technical Details

**Archivo:** `src/app/dashboard/settings/users/page.tsx`

Interface actualizada:
```typescript
interface UserInfo {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isActive: boolean;
  allowedMenus: string[] | null;
  createdAt: string;
}
```

Menús disponibles (constante compartida):
```typescript
const AVAILABLE_MENUS = [
  { slug: "boletines", label: "Boletines", href: "/dashboard/bulletin" },
  { slug: "fuentes", label: "Fuentes", href: "/dashboard/settings/sources" },
  { slug: "suscriptores", label: "Suscriptores", href: "/dashboard/subscribers" },
  { slug: "categorias", label: "Categorías", href: "/dashboard/settings/categories" },
  { slug: "usuarios", label: "Usuarios", href: "/dashboard/settings/users" },
  { slug: "dashboard", label: "Dashboard", href: "/dashboard" },
];
```

Componentes UI: `Switch` para activo/inactivo, shadcn `Checkbox` para permisos, `Input` type password para nueva contraseña.

Estado expandido: `expandedUserId: string | null` - solo un usuario expandido a la vez.

---

## Phase 4: Filtrar navegación y bloquear login

Hacer que el header respete los permisos y que usuarios inactivos no puedan loguearse.

### Tasks

- [ ] Convertir `src/components/site-header.tsx` a Client Component y filtrar menú según `allowedMenus` del usuario
- [ ] Modificar `src/app/login/page.tsx` para verificar si el usuario está activo tras login exitoso

### Technical Details

**Archivo:** `src/components/site-header.tsx`

- Agregar `"use client"` al inicio
- Usar `useSession()` de `@/lib/auth-client` para saber si hay usuario
- Fetch `/api/admin/users/me` para obtener `allowedMenus`
- Reusar la constante `AVAILABLE_MENUS` (extraerla a un archivo compartido `src/lib/menu-items.ts`)
- Si `allowedMenus` es `null`, mostrar todos los links
- Si es un array, filtrar: `AVAILABLE_MENUS.filter(m => allowedMenus.includes(m.slug))`

---

**Archivo:** `src/app/login/page.tsx`

Tras `signIn.email()` exitoso:
```typescript
// Verificar si usuario está activo
const meRes = await fetch("/api/admin/users/me");
if (meRes.ok) {
  const meData = await meRes.json();
  if (!meData.isActive) {
    await signOut();
    setError("Tu cuenta ha sido desactivada. Contacta al administrador.");
    return;
  }
}
```

---

## Archivos resumen

| Archivo | Acción |
|---------|--------|
| `src/lib/schema.ts` | Modificar - agregar `isActive`, `allowedMenus` |
| `src/lib/menu-items.ts` | **Nuevo** - constante AVAILABLE_MENUS |
| `src/app/api/admin/users/route.ts` | Modificar - incluir nuevos campos en GET |
| `src/app/api/admin/users/[id]/route.ts` | **Nuevo** - PUT editar usuario |
| `src/app/api/admin/users/me/route.ts` | **Nuevo** - GET datos usuario actual |
| `src/app/dashboard/settings/users/page.tsx` | Reescribir - UI completa |
| `src/components/site-header.tsx` | Modificar - filtrar menú |
| `src/app/login/page.tsx` | Modificar - validar usuario activo |
