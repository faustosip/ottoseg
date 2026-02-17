# Implementation Plan: Mejoras del Boletín V2

## Overview

Transformar el boletín de Otto Seguridad: agregar categorías dinámicas, layout de 3 columnas (Video | Noticias | Última Hora), upload de video MP4, login con email/password sin Sign Up público, link móvil a Última Hora, y eliminar sección dedicada de Mapa Vial.

---

## Phase 1: Categorías Dinámicas (Base de datos + API + UI Admin)

Crear la infraestructura para categorías dinámicas que reemplace las 6 categorías hardcoded. Esta fase es prerequisito para las demás.

### Tasks

- [x] 1.1 Agregar tabla `bulletin_categories` al schema de Drizzle [complex]
  - [x] Definir tabla con campos: id, name (slug), displayName, displayOrder, isDefault, isActive, createdAt, updatedAt
  - [x] Exportar tipos TypeScript
  - [x] Generar migración con `pnpm run db:generate`
  - [x] Aplicar migración con `pnpm run db:migrate`
- [x] 1.2 Crear script/seed para insertar las 6 categorías default
- [x] 1.3 Crear queries CRUD para categorías en `src/lib/db/queries/bulletins.ts`
- [x] 1.4 Crear API route `src/app/api/bulletins/categories/route.ts` (GET + POST)
- [x] 1.5 Crear API route `src/app/api/bulletins/categories/[id]/route.ts` (PUT + DELETE)
- [x] 1.6 Crear página admin de categorías `src/app/dashboard/settings/categories/page.tsx` [complex]
  - [x] Lista de categorías con orden numérico
  - [x] Botón "Agregar Categoría" con form inline
  - [x] Toggle activar/desactivar
  - [x] No permitir eliminar las 6 defaults
- [x] 1.7 Actualizar `manual-news-form.tsx` para cargar categorías desde API
- [x] 1.8 Actualizar `editable-bulletin.tsx` para usar categorías dinámicas
- [x] 1.9 Actualizar `public-bulletin-view.tsx` para renderizar categorías dinámicas
- [x] 1.10 Ejecutar `pnpm run lint && pnpm run typecheck`

### Technical Details

**Schema (src/lib/schema.ts):**
```ts
export const bulletinCategories = pgTable("bulletin_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // slug: "economia", "ultima_hora"
  displayName: text("display_name").notNull(), // "Economía", "Última Hora"
  displayOrder: integer("display_order").notNull().default(0),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

**6 categorías default seed:**
```
economia (order: 1), politica (2), sociedad (3), seguridad (4), internacional (5), vial (6)
```

**API endpoints:**
- `GET /api/bulletins/categories` - Lista todas las categorías activas
- `POST /api/bulletins/categories` - Crear nueva categoría `{ name, displayName, displayOrder }`
- `PUT /api/bulletins/categories/[id]` - Actualizar categoría
- `DELETE /api/bulletins/categories/[id]` - Eliminar (solo no-default)

**Archivos a modificar:**
- `src/lib/schema.ts` - Nueva tabla
- `src/lib/db/queries/bulletins.ts` - CRUD queries
- `src/components/bulletin/manual-news-form.tsx` (línea 28-35: reemplazar `CATEGORIES` hardcoded)
- `src/components/bulletin/editable-bulletin.tsx` (línea 107-114: reemplazar `categoryNames`)
- `src/components/bulletin/public-bulletin-view.tsx` (línea 13-20: reemplazar `categoryNames`)

**CLI:**
```bash
pnpm run db:generate
pnpm run db:migrate
```

---

## Phase 2: Upload de Video MP4

Agregar soporte para subir videos MP4 al boletín y almacenarlos en Supabase Storage.

### Tasks

- [x] 2.1 Agregar campo `manualVideoUrl` a tabla `bulletins` en schema
- [x] 2.2 Generar y aplicar migración
- [x] 2.3 Crear/ampliar storage service para soportar videos
- [x] 2.4 Crear API route `src/app/api/upload/video/route.ts`
- [x] 2.5 Agregar sección "Video del Boletín" en `editable-bulletin.tsx` [complex]
  - [x] Upload drag & drop para MP4
  - [x] Preview con `<video>` tag
  - [x] Botón eliminar video
- [x] 2.6 Actualizar query `updateBulletin` para guardar `manualVideoUrl`
- [x] 2.7 Ejecutar `pnpm run lint && pnpm run typecheck`

### Technical Details

**Schema (agregar a bulletins):**
```ts
manualVideoUrl: text("manual_video_url"), // URL del video MP4 subido manualmente
```

**API route (src/app/api/upload/video/route.ts):**
- Basado en `src/app/api/upload/image/route.ts` (mismo patrón)
- Tipos permitidos: `["video/mp4"]`
- Tamaño máximo: 50MB (`50 * 1024 * 1024`)
- Reutiliza `uploadFile()` de `src/lib/storage/supabase-storage.ts`
- Bucket: `bulletin-videos` (nuevo bucket, o ampliar el existente)

**Storage (src/lib/storage/supabase-storage.ts):**
- Crear función `uploadVideoFile()` o parametrizar `uploadFile()` para aceptar bucket name
- Nuevo bucket `bulletin-videos` con `allowedMimeTypes: ["video/mp4"]` y `fileSizeLimit: 50MB`

**CLI:**
```bash
pnpm run db:generate
pnpm run db:migrate
```

---

## Phase 3: Layout 3 Columnas + Eliminar Mapa Vial

Reestructurar la vista pública del boletín a 3 columnas y eliminar la sección dedicada de mapa.

### Tasks

- [x] 3.1 Reestructurar `public-bulletin-view.tsx` a layout de 3 columnas [complex]
  - [x] Columna izquierda (~25%): Título "VIDEO" + `<video>` player sticky
  - [x] Columna centro (~50%): Categorías de noticias (contenido actual)
  - [x] Columna derecha (~25%): "ULTIMA HORA" con noticias de esa categoría, sticky
  - [x] Responsive: Desktop 3 col, Tablet 2 col, Mobile 1 col stack
- [x] 3.2 Eliminar render especial de `roadClosureMapUrl` en `public-bulletin-view.tsx` (líneas 323-344)
- [x] 3.3 Eliminar sección "Mapa de Cierres Viales (Imagen)" de `editable-bulletin.tsx` (líneas 498-660)
- [x] 3.4 Agregar id="ultima-hora" a la sección de Última Hora para ancla móvil
- [x] 3.5 Ejecutar `pnpm run lint && pnpm run typecheck`

### Technical Details

**Layout Desktop (>1024px) en public-bulletin-view.tsx:**
```
┌──────────────┬────────────────────────┬──────────────┐
│   VIDEO      │   NOTICIAS (centro)    │ ULTIMA HORA  │
│   (left)     │   1. Economía          │  (right)     │
│              │   2. Política          │              │
│  <video>     │   3. Sociedad          │  Detalle de  │
│  MP4 player  │   etc.                 │  noticias    │
│  sticky      │                        │  sticky      │
└──────────────┴────────────────────────┴──────────────┘
```

**CSS Grid:**
```tsx
// Desktop: 3 columnas
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8 max-w-[1400px] mx-auto px-6">
  {/* Left: Video */}
  <aside className="hidden lg:block">
    <div className="sticky top-8">
      <h2>VIDEO</h2>
      <video src={bulletin.manualVideoUrl} controls />
    </div>
  </aside>

  {/* Center: Noticias */}
  <main>{/* categorías actuales */}</main>

  {/* Right: Última Hora */}
  <aside className="hidden lg:block">
    <div className="sticky top-8" id="ultima-hora">
      <h2>ULTIMA HORA</h2>
      {/* noticias de categoría ultima_hora */}
    </div>
  </aside>
</div>
```

**Mobile (<768px):**
- Video primero (ancho completo)
- Link "Ir a Última Hora"
- Categorías principales
- Última Hora al final con id="ultima-hora"

**Tablet (768-1024px):**
- Video arriba (ancho completo)
- 2 columnas: Noticias | Última Hora

**Secciones a eliminar:**
- `public-bulletin-view.tsx` líneas 323-344: Render del mapa de cierres viales
- `editable-bulletin.tsx` líneas 498-660: Sección completa "Mapa de Cierres Viales (Imagen)"

---

## Phase 4: Login Email/Password (BetterAuth)

Configurar autenticación por email/password, eliminar Sign Up público, y crear panel admin para gestión de usuarios.

### Tasks

- [x] 4.1 Configurar BetterAuth con `emailAndPassword` habilitado en `src/lib/auth.ts`
- [x] 4.2 Modificar `src/components/auth/sign-in-button.tsx` a formulario email/password [complex]
  - [x] Campos: Email + Password
  - [x] Botón "Iniciar Sesión"
  - [x] Manejo de errores (credenciales incorrectas)
  - [x] NO mostrar botón Sign Up
- [x] 4.3 Crear API route admin para crear usuarios `src/app/api/admin/users/route.ts`
- [x] 4.4 Crear página admin de usuarios `src/app/dashboard/settings/users/page.tsx` [complex]
  - [x] Form: nombre, email, contraseña
  - [x] Lista de usuarios existentes
  - [x] Solo accesible por admin autenticado
- [x] 4.5 Ejecutar `pnpm run lint && pnpm run typecheck`

### Technical Details

**Auth config (src/lib/auth.ts):**
```ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
})
```

**Sign-in component (src/components/auth/sign-in-button.tsx):**
- Cambiar de `signIn.social({ provider: "google" })` a `signIn.email({ email, password })`
- Formulario con campos email y password
- Sin botón "Sign Up"

**Admin crear usuario:**
- Usar `auth.api.signUpEmail()` desde el server-side
- O llamar la API de BetterAuth: `POST /api/auth/sign-up/email`
- La página admin usa fetch al API route propio que internamente usa BetterAuth

**Archivos a modificar:**
- `src/lib/auth.ts` - Agregar `emailAndPassword`
- `src/components/auth/sign-in-button.tsx` - Formulario email/password
- `src/components/auth/user-profile.tsx` - Verificar que no muestre Sign Up

---

## Phase 5: Link Móvil "Última Hora"

Agregar navegación rápida en mobile hacia la sección de Última Hora.

### Tasks

- [x] 5.1 Agregar banner/link móvil en `public-bulletin-view.tsx` debajo del header
- [x] 5.2 Solo visible en mobile (`lg:hidden`)
- [x] 5.3 Scroll suave a `#ultima-hora`
- [x] 5.4 Ejecutar `pnpm run lint && pnpm run typecheck`

### Technical Details

**Componente en public-bulletin-view.tsx (después del header, antes del main):**
```tsx
{/* Link móvil a Última Hora - solo visible en mobile */}
<div className="lg:hidden sticky top-0 z-40 bg-red-600 text-white py-3 px-4 text-center">
  <a
    href="#ultima-hora"
    onClick={(e) => {
      e.preventDefault();
      document.getElementById('ultima-hora')?.scrollIntoView({ behavior: 'smooth' });
    }}
    className="font-bold text-sm flex items-center justify-center gap-2"
  >
    Ir a Última Hora
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  </a>
</div>
```

---

## Phase 6: Verificación Final

Verificar que todo funciona correctamente end-to-end.

### Tasks

- [x] 6.1 Verificar: Crear categoría "Última Hora" desde admin
- [x] 6.2 Verificar: Agregar noticia manual con categoría "Última Hora"
- [x] 6.3 Verificar: Subir video MP4 desde editor
- [x] 6.4 Verificar: Vista pública muestra 3 columnas en desktop
- [x] 6.5 Verificar: Vista pública muestra stack vertical en mobile
- [x] 6.6 Verificar: Link "Ir a Última Hora" funciona en mobile
- [x] 6.7 Verificar: Sección de mapa ya no aparece en editor
- [x] 6.8 Verificar: Login con email/password funciona
- [x] 6.9 Verificar: No hay botón Sign Up visible
- [x] 6.10 Ejecutar `pnpm run lint && pnpm run typecheck` final
