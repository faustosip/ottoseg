# Implementation Plan: Auditoría de Boletines, Email Corporativo y Dashboard

## Overview

Implementar auditoría de acciones sobre boletines, configurar email corporativo Outlook con tracking de aperturas/clics, rediseñar el template de email con branding profesional, y construir un dashboard ejecutivo con métricas para gerencia. Incluye limpieza de UI existente, desuscripción funcional, prevención de envío duplicado y botón de prueba.

**Dominios:**
- Remitente email: `informacion2@ottoseguridad.com.ec` (SMTP Outlook)
- Plataforma/links: `https://ottoseguridadai.com`

---

## Phase 1: Limpieza de UI del boletín

Ocultar el botón "Exportar JSON" y condicionar "Compartir Link Público" para que solo aparezca después de autorizar.

### Tasks

- [x] Eliminar el botón "Exportar JSON" y el import `Download` de `src/app/dashboard/bulletin/[id]/page.tsx`
- [x] Cambiar la condición del `ShareButton` para que solo se muestre en estado `authorized` o `published`
- [x] Ejecutar `pnpm run lint && pnpm run typecheck` para verificar

### Technical Details

**Archivo:** `src/app/dashboard/bulletin/[id]/page.tsx`

Eliminar líneas 90-94 (botón Exportar JSON):
```tsx
// ELIMINAR este bloque completo:
<Button variant="outline" className="gap-2">
  <Download className="h-4 w-4" />
  Exportar JSON
</Button>
```

Limpiar import `Download` de lucide-react en línea 5.

Cambiar condición del ShareButton (línea 86):
```tsx
// ANTES:
{(bulletin.status === "ready" || bulletin.status === "authorized" || bulletin.status === "published") && bulletin.classifiedNews ? (

// DESPUÉS:
{(bulletin.status === "authorized" || bulletin.status === "published") && bulletin.classifiedNews ? (
```

---

## Phase 2: Tabla de auditoría en BD

Crear la tabla `bulletin_audit_logs` para registrar quién autoriza, publica y elimina boletines.

### Tasks

- [x] Agregar tabla `bulletin_audit_logs` en `src/lib/schema.ts` después de `bulletinLogs`
- [x] Agregar types TypeScript (`BulletinAuditLog`, `NewBulletinAuditLog`) al final de schema.ts
- [x] Crear archivo de queries `src/lib/db/queries/audit.ts` con funciones `createAuditLog`, `getAuditLogsByBulletin`, `getRecentAuditLogs`
- [x] Generar y aplicar migración con `pnpm run db:generate && pnpm run db:push`

### Technical Details

**Archivo:** `src/lib/schema.ts`

Agregar después de la tabla `bulletinLogs` (después de línea 228):
```typescript
/**
 * Tabla de Auditoría de Boletines
 * Registra quién autorizó, publicó o eliminó cada boletín
 */
export const bulletinAuditLogs = pgTable("bulletin_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  bulletinId: uuid("bulletin_id")
    .notNull()
    .references(() => bulletins.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // "authorized", "published", "deleted"
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  metadata: jsonb("metadata"), // datos extra opcionales
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Types al final del archivo junto a los demás:
```typescript
// Bulletin Audit Logs table
export type BulletinAuditLog = typeof bulletinAuditLogs.$inferSelect;
export type NewBulletinAuditLog = typeof bulletinAuditLogs.$inferInsert;
```

---

**Archivo nuevo:** `src/lib/db/queries/audit.ts`

```typescript
import { db } from "@/lib/db";
import { bulletinAuditLogs } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import type { BulletinAuditLog } from "@/lib/schema";

interface AuditUser {
  id: string;
  name: string;
  email: string;
}

export async function createAuditLog(
  bulletinId: string,
  action: string,
  user: AuditUser,
  metadata?: Record<string, unknown>
): Promise<BulletinAuditLog> {
  const [log] = await db
    .insert(bulletinAuditLogs)
    .values({
      bulletinId,
      action,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      metadata,
    })
    .returning();
  return log;
}

export async function getAuditLogsByBulletin(bulletinId: string): Promise<BulletinAuditLog[]> {
  return db
    .select()
    .from(bulletinAuditLogs)
    .where(eq(bulletinAuditLogs.bulletinId, bulletinId))
    .orderBy(desc(bulletinAuditLogs.createdAt));
}

export async function getRecentAuditLogs(limit = 50): Promise<BulletinAuditLog[]> {
  return db
    .select()
    .from(bulletinAuditLogs)
    .orderBy(desc(bulletinAuditLogs.createdAt))
    .limit(limit);
}
```

**Migración:**
```bash
pnpm run db:generate
pnpm run db:push
```

---

## Phase 3: Registrar auditoría en APIs y mostrar en UI

Agregar registro de auditoría en los endpoints de autorizar, publicar y eliminar. Mostrar los logs en la UI del boletín.

### Tasks

- [x] Modificar PATCH en `src/app/api/bulletins/[id]/route.ts` para registrar auditoría cuando `status` cambia a `authorized` o `published`
- [x] Modificar DELETE en `src/app/api/bulletins/[id]/route.ts` para registrar auditoría antes de eliminar
- [x] Modificar `src/app/dashboard/bulletin/[id]/page.tsx` para cargar audit logs y pasarlos al componente de tabs
- [x] Agregar sección de auditoría visible en `src/app/dashboard/bulletin/[id]/components/bulletin-detail-tabs.tsx`
- [x] Ejecutar `pnpm run lint && pnpm run typecheck`

### Technical Details

**Archivo:** `src/app/api/bulletins/[id]/route.ts`

Agregar import al inicio:
```typescript
import { createAuditLog } from "@/lib/db/queries/audit";
```

En el PATCH, después del `db.update().returning()` (después de línea 151), agregar:
```typescript
// Registrar auditoría para cambios de estado importantes
if (updates.status === "authorized" || updates.status === "published") {
  await createAuditLog(id, updates.status, {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  });
}
```

En el DELETE, antes del `db.delete()` (antes de línea 218), agregar:
```typescript
// Registrar auditoría antes de eliminar
await createAuditLog(id, "deleted", {
  id: session.user.id,
  name: session.user.name,
  email: session.user.email,
}, { previousStatus: existingBulletin.status });
```

---

**Archivo:** `src/app/dashboard/bulletin/[id]/page.tsx`

Agregar import y carga de audit logs:
```typescript
import { getAuditLogsByBulletin } from "@/lib/db/queries/audit";

// Dentro de la función, junto a la carga de logs:
const auditLogs = await getAuditLogsByBulletin(id);
```

Pasar `auditLogs` como prop a `BulletinDetailTabs`.

---

**Archivo:** `src/app/dashboard/bulletin/[id]/components/bulletin-detail-tabs.tsx`

Agregar sección visual de auditoría con:
- Icono por acción (CheckCircle para authorized, Send para published, Trash para deleted)
- Nombre del usuario y email
- Fecha/hora formateada en español
- Badge de color por acción (verde=autorizado, azul=publicado, rojo=eliminado)

---

## Phase 4: Configurar email SMTP Outlook y tablas de tracking

Cambiar credenciales SMTP a Outlook corporativo, crear tablas para tracking de emails y agregar prevención de envío duplicado.

### Tasks

- [x] Actualizar variables de entorno SMTP en `.env` con credenciales de Outlook
- [x] Agregar tabla `email_sends` en `src/lib/schema.ts` para registrar cada envío individual
- [x] Agregar tabla `email_clicks` en `src/lib/schema.ts` para registrar clics en links
- [x] Agregar campo `emailSentAt` a la tabla `bulletins` en `src/lib/schema.ts` para prevención de duplicados
- [x] Agregar types TypeScript al final de schema.ts
- [x] Crear queries en `src/lib/db/queries/email-tracking.ts`
- [x] Generar y aplicar migración `pnpm run db:generate && pnpm run db:push`
- [ ] Verificar conectividad SMTP con las nuevas credenciales

### Technical Details

**Archivo:** `.env`

Actualizar credenciales SMTP:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=informacion2@ottoseguridad.com.ec
SMTP_PASS=Info2@2026.
SMTP_FROM="OttoSeguridad <informacion2@ottoseguridad.com.ec>"
```

---

**Archivo:** `src/lib/schema.ts`

Tabla de envíos individuales (después de `bulletinAuditLogs`):
```typescript
/**
 * Tabla de Envíos de Email
 * Registra cada email individual enviado a cada suscriptor
 */
export const emailSends = pgTable("email_sends", {
  id: uuid("id").defaultRandom().primaryKey(),
  bulletinId: uuid("bulletin_id")
    .notNull()
    .references(() => bulletins.id, { onDelete: "cascade" }),
  subscriberId: uuid("subscriber_id")
    .references(() => subscribers.id, { onDelete: "set null" }),
  subscriberEmail: text("subscriber_email").notNull(),
  status: text("status").notNull().default("sent"), // sent, failed, bounced
  trackingId: text("tracking_id").notNull().unique(), // UUID único para tracking
  openedAt: timestamp("opened_at"),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Tabla de Clics en Email
 * Registra cada clic individual en links del email
 */
export const emailClicks = pgTable("email_clicks", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailSendId: uuid("email_send_id")
    .notNull()
    .references(() => emailSends.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
});
```

Agregar campo a tabla `bulletins` para prevención de duplicados:
```typescript
// Agregar en la tabla bulletins, junto a publishedAt:
emailSentAt: timestamp("email_sent_at"), // null = no se ha enviado, con valor = ya se envió
```

Types al final:
```typescript
// Email tracking tables
export type EmailSend = typeof emailSends.$inferSelect;
export type NewEmailSend = typeof emailSends.$inferInsert;
export type EmailClick = typeof emailClicks.$inferSelect;
export type NewEmailClick = typeof emailClicks.$inferInsert;
```

---

**Archivo nuevo:** `src/lib/db/queries/email-tracking.ts`

Funciones:
```typescript
// Registrar un envío individual
export async function createEmailSend(
  bulletinId: string,
  subscriberId: string | null,
  subscriberEmail: string,
  trackingId: string
): Promise<EmailSend>

// Marcar email como abierto (incrementar openCount, setear openedAt si es primera vez)
export async function recordEmailOpen(trackingId: string): Promise<void>

// Registrar clic en un link
export async function recordEmailClick(emailSendId: string, url: string): Promise<void>

// Obtener emailSend por trackingId (para los endpoints de tracking)
export async function getEmailSendByTrackingId(trackingId: string): Promise<EmailSend | null>

// Stats agregadas por boletín (para UI del boletín)
export async function getEmailStatsByBulletin(bulletinId: string): Promise<{
  totalSent: number;
  totalFailed: number;
  totalOpened: number;
  totalClicks: number;
  openRate: number;
}>

// Stats globales (para dashboard)
export async function getOverallEmailStats(): Promise<{
  totalSent: number;
  totalOpened: number;
  openRate: number;
  totalClicks: number;
  clickRate: number;
}>
```

**Migración:**
```bash
pnpm run db:generate
pnpm run db:push
```

---

## Phase 5: Rediseño del template de email

Rediseñar el template de email con branding profesional, saludo personalizado, imágenes por categoría, botón CTA, footer corporativo y desuscripción funcional.

### Tasks

- [x] Crear endpoint público `GET /api/unsubscribe/[token]` que desactive al suscriptor
- [x] Crear página pública de confirmación de desuscripción en `src/app/unsubscribe/[token]/page.tsx`
- [x] Agregar campo `unsubscribeToken` a la tabla `subscribers` en `src/lib/schema.ts`
- [x] Generar y aplicar migración `pnpm run db:generate && pnpm run db:push`
- [x] Reescribir `src/lib/email/templates/bulletin.ts` con diseño profesional [complex]
  - [x] Header con logos (búho + OttoSeguridad) sobre gradiente azul corporativo
  - [x] Saludo personalizado ("Buenos días, María")
  - [x] Imagen destacada por categoría (primera noticia con imagen)
  - [x] Botón CTA "Ver Boletín Completo" apuntando a `ottoseguridadai.com`
  - [x] Footer profesional con contacto, redes y link de desuscripción
  - [x] Pixel de tracking invisible al final (se activa en Phase 6)
- [x] Ejecutar `pnpm run lint && pnpm run typecheck`

### Technical Details

**Archivo:** `src/lib/schema.ts`

Agregar campo a tabla `subscribers`:
```typescript
// Agregar en la tabla subscribers:
unsubscribeToken: text("unsubscribe_token").unique(), // Token único para desuscripción
```

---

**Archivo nuevo:** `src/app/api/unsubscribe/[token]/route.ts`

```typescript
// GET /api/unsubscribe/[token]
// Endpoint PÚBLICO (sin autenticación)
// 1. Buscar suscriptor por unsubscribeToken
// 2. Si existe y está activo, desactivarlo (isActive = false)
// 3. Redirigir a página de confirmación
```

---

**Archivo nuevo:** `src/app/unsubscribe/[token]/page.tsx`

Página pública simple que muestra:
- Logo OttoSeguridad
- Mensaje: "Te has desuscrito exitosamente"
- "Ya no recibirás los boletines diarios de OttoSeguridad"
- Botón opcional: "Volver a suscribirme"

---

**Archivo:** `src/lib/email/templates/bulletin.ts`

Reescribir `generateBulletinEmail()` con nueva firma:
```typescript
export function generateBulletinEmail(
  bulletin: Bulletin,
  options?: {
    webViewUrl?: string;
    unsubscribeUrl?: string;
    subscriberName?: string; // NUEVO - para saludo personalizado
    trackingPixelUrl?: string; // NUEVO - pixel de tracking
    trackingBaseUrl?: string; // NUEVO - base URL para reescritura de links
    trackingId?: string; // NUEVO - ID de tracking para este envío
  }
): { html: string; text: string; subject: string }
```

Estructura del nuevo HTML:
1. **Header:** Tabla con fondo gradiente `#004aad` → `#1a62ff`, logos búho + otto como imágenes con URL absoluta `https://ottoseguridadai.com/buho-seguridad.png`, título "RESUMEN DIARIO DE NOTICIAS", línea roja accent, fecha formateada
2. **Saludo:** "Buenos días, {nombre}." o "Buenos días." si no hay nombre
3. **Categorías:** Cada una con número circled, emoji, título azul, imagen destacada (si existe en `classifiedNews`), texto del resumen
4. **Mapa vial:** Si existe `roadClosureMapUrl`, botón azul
5. **CTA:** Botón grande azul "Ver Boletín Completo en la Web" → `https://ottoseguridadai.com/bulletin/{fecha}`
6. **Footer:** Logo búho pequeño, "OttoSeguridad", email de contacto `informacion2@ottoseguridad.com.ec`, copyright, link "Cancelar suscripción"
7. **Tracking:** `<img src="{trackingPixelUrl}" width="1" height="1" style="display:none" />`

Todos los links `<a href="...">` se reescriben si `trackingBaseUrl` está presente:
```
href original → https://ottoseguridadai.com/api/track/click/{trackingId}?url={encodeURIComponent(original)}
```

---

## Phase 6: Tracking de emails y botón de prueba

Implementar endpoints de tracking (pixel apertura + clics), modificar el envío para usar tracking individual, y agregar botón de envío de prueba.

### Tasks

- [x] Crear endpoint público `GET /api/track/open/[trackingId]` que devuelve pixel 1x1 y registra apertura
- [x] Crear endpoint público `GET /api/track/click/[trackingId]` que registra clic y redirige a URL original
- [x] Modificar `src/app/api/bulletins/[id]/send-email/route.ts` para envío individual con tracking [complex]
  - [x] Verificar que el boletín no haya sido enviado previamente (`emailSentAt`)
  - [x] Para cada suscriptor: generar `trackingId`, crear registro `emailSends`, generar HTML personalizado con tracking, enviar email individual
  - [x] Marcar `emailSentAt` en el boletín tras completar el envío
  - [x] Registrar auditoría del envío
- [x] Crear endpoint `POST /api/bulletins/[id]/send-test-email` para enviar prueba al usuario actual
- [x] Agregar botón "Enviar Prueba" en `src/app/dashboard/bulletin/[id]/components/bulletin-actions.tsx`
- [x] Ejecutar `pnpm run lint && pnpm run typecheck`

### Technical Details

**Archivo nuevo:** `src/app/api/track/open/[trackingId]/route.ts`

```typescript
// GET /api/track/open/[trackingId]
// Endpoint PÚBLICO (sin autenticación)
// 1. Registrar apertura con recordEmailOpen(trackingId) - fire-and-forget
// 2. Devolver imagen 1x1 pixel transparente GIF
// 3. Headers: Cache-Control: no-store para evitar caching

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request, context) {
  const { trackingId } = await context.params;
  recordEmailOpen(trackingId).catch(() => {}); // fire-and-forget
  return new Response(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
```

---

**Archivo nuevo:** `src/app/api/track/click/[trackingId]/route.ts`

```typescript
// GET /api/track/click/[trackingId]?url=encoded_url
// Endpoint PÚBLICO (sin autenticación)
// 1. Extraer trackingId y url del query param
// 2. Buscar emailSend por trackingId
// 3. Si existe, registrar clic con recordEmailClick()
// 4. Redirigir (302) a la URL original
// 5. Si no hay url válida, redirigir a https://ottoseguridadai.com

export async function GET(request, context) {
  const { trackingId } = await context.params;
  const url = new URL(request.url).searchParams.get("url");

  // Registrar clic (fire-and-forget)
  if (url) {
    const emailSend = await getEmailSendByTrackingId(trackingId);
    if (emailSend) {
      recordEmailClick(emailSend.id, url).catch(() => {});
    }
  }

  return Response.redirect(url || "https://ottoseguridadai.com", 302);
}
```

---

**Archivo:** `src/app/api/bulletins/[id]/send-email/route.ts`

Reescribir el flujo de envío:
```typescript
// 1. Verificar que emailSentAt sea null (prevención de duplicados)
if (bulletin.emailSentAt) {
  return NextResponse.json({
    error: "Este boletín ya fue enviado por email",
    sentAt: bulletin.emailSentAt,
  }, { status: 400 });
}

// 2. Para cada suscriptor:
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ottoseguridadai.com";
for (const subscriber of subscribers) {
  const trackingId = crypto.randomUUID();
  const unsubscribeUrl = `${appUrl}/api/unsubscribe/${subscriber.unsubscribeToken}`;
  const trackingPixelUrl = `${appUrl}/api/track/open/${trackingId}`;

  // Crear registro en email_sends
  await createEmailSend(bulletin.id, subscriber.id, subscriber.email, trackingId);

  // Generar HTML personalizado con tracking
  const { html, text, subject } = generateBulletinEmail(bulletin, {
    webViewUrl: `${appUrl}/bulletin/${bulletin.id}`,
    unsubscribeUrl,
    subscriberName: subscriber.name || undefined,
    trackingPixelUrl,
    trackingBaseUrl: `${appUrl}/api/track/click/${trackingId}`,
    trackingId,
  });

  // Enviar email individual
  await sendEmail({ to: subscriber.email, subject, html, text });
  await delay(100); // rate limiting
}

// 3. Marcar boletín como enviado
await db.update(bulletins).set({ emailSentAt: new Date() }).where(eq(bulletins.id, id));

// 4. Registrar auditoría
await createAuditLog(id, "email_sent", {
  id: session.user.id,
  name: session.user.name,
  email: session.user.email,
}, { subscriberCount: subscribers.length });
```

---

**Archivo nuevo:** `src/app/api/bulletins/[id]/send-test-email/route.ts`

```typescript
// POST /api/bulletins/[id]/send-test-email
// Requiere autenticación
// 1. Obtener email del usuario actual (session.user.email)
// 2. Generar HTML con tracking desactivado (sin pixel ni URL rewriting)
// 3. Enviar UN solo email al usuario actual
// 4. Retornar { success: true, sentTo: session.user.email }
```

---

**Archivo:** `src/app/dashboard/bulletin/[id]/components/bulletin-actions.tsx`

Agregar botón "Enviar Prueba" visible cuando el boletín está `authorized`:
```tsx
<Button variant="outline" onClick={handleSendTest} disabled={isSendingTest}>
  <Mail className="h-4 w-4" />
  Enviar Prueba
</Button>
```

---

## Phase 7: Dashboard ejecutivo con métricas [complex]

Construir el dashboard con métricas y gráficos para gerencia.

### Tasks

- [x] Instalar Recharts: `pnpm add recharts`
- [x] Crear queries de dashboard en `src/lib/db/queries/dashboard.ts` [complex]
  - [x] `getDashboardKPIs()` — boletines publicados, suscriptores, tasa apertura, noticias
  - [x] `getBulletinTrend(weeks)` — boletines por semana (últimas 12 semanas)
  - [x] `getEmailPerformanceByBulletin(limit)` — enviados vs abiertos por boletín
  - [x] `getNewsByCategory()` — distribución de noticias por categoría
  - [x] `getNewsBySource()` — artículos por fuente
  - [x] `getPipelinePerformance()` — tiempo promedio por etapa del pipeline
- [x] Crear API `GET /api/dashboard/stats` que retorne todos los KPIs y datos de gráficos
- [x] Reescribir `src/app/dashboard/page.tsx` como dashboard real (ya no redirect) [complex]
  - [x] Fila de 4 KPI cards: Boletines Publicados, Suscriptores Activos, Tasa de Apertura Email, Noticias Procesadas
  - [x] Gráfico de línea: boletines por semana (últimas 12 semanas)
  - [x] Gráfico de barras agrupadas: emails enviados vs abiertos (últimos 10 boletines)
  - [x] Gráfico de dona: distribución de noticias por categoría
  - [x] Gráfico de barras horizontales: artículos por fuente
  - [x] Tabla: últimos 5 eventos de auditoría (quién, qué, cuándo)
  - [x] Tabla: rendimiento del pipeline (tiempo promedio por etapa)
- [x] Ejecutar `pnpm run lint && pnpm run typecheck`

### Technical Details

**Dependencia nueva:**
```bash
pnpm add recharts
```

---

**Archivo nuevo:** `src/lib/db/queries/dashboard.ts`

Queries de agregación con Drizzle ORM:

```typescript
export async function getDashboardKPIs() {
  // Boletines
  const totalBulletins = await db.select({ count: count() }).from(bulletins);
  const publishedBulletins = await db.select({ count: count() }).from(bulletins).where(eq(bulletins.status, "published"));
  const failedBulletins = await db.select({ count: count() }).from(bulletins).where(eq(bulletins.status, "failed"));
  // Tasa de éxito: published / (published + failed) * 100

  // Suscriptores
  const totalSubscribers = await db.select({ count: count() }).from(subscribers);
  const activeSubscribers = await db.select({ count: count() }).from(subscribers).where(eq(subscribers.isActive, true));
  // Nuevos esta semana: createdAt > 7 días atrás

  // Email
  const totalEmailsSent = await db.select({ count: count() }).from(emailSends).where(eq(emailSends.status, "sent"));
  const totalEmailsOpened = await db.select({ count: count() }).from(emailSends).where(isNotNull(emailSends.openedAt));
  // Tasa apertura: opened / sent * 100

  // Noticias
  // sum(totalNews) y avg(totalNews) de la tabla bulletins

  return { bulletins: {...}, subscribers: {...}, email: {...}, news: {...} };
}

export async function getBulletinTrend(weeks = 12) {
  // SQL: GROUP BY date_trunc('week', created_at) ORDER BY week
  // Retorna: [{ week: "2026-02-17", count: 5 }, ...]
}

export async function getEmailPerformanceByBulletin(limit = 10) {
  // JOIN emailSends con bulletins, GROUP BY bulletinId
  // Retorna: [{ bulletinDate: "26 Feb", sent: 85, opened: 58 }, ...]
}

export async function getNewsByCategory() {
  // Parsear classifiedNews (jsonb) de boletines publicados
  // Contar noticias por categoría
  // Retorna: [{ category: "Economía", count: 340 }, ...]
}

export async function getNewsBySource() {
  // Parsear rawNews o classifiedNews para extraer fuentes
  // Retorna: [{ source: "Primicias", count: 340 }, ...]
}

export async function getPipelinePerformance() {
  // Promediar duration de bulletinLogs agrupado por step
  // Retorna: [{ step: "scraping", avgDuration: 45000, status: "normal" }, ...]
}
```

---

**Archivo nuevo:** `src/app/api/dashboard/stats/route.ts`

```typescript
// GET /api/dashboard/stats
// Requiere autenticación
// Llama a todas las funciones de dashboard.ts
// Retorna JSON con todos los datos para el dashboard
```

---

**Archivo:** `src/app/dashboard/page.tsx`

Reescribir completamente como Server Component:

```typescript
// Ya NO redirige a /bulletin
// Carga datos del dashboard server-side
// Renderiza grid responsivo con:

// 1. FILA KPIs (4 cards, grid-cols-4)
// - Boletines Publicados: icono FileText, número grande, "+X esta semana"
// - Suscriptores Activos: icono Users, número, "+X este mes"
// - Tasa Apertura Email: icono MailOpen, porcentaje, "↑X% vs anterior"
// - Noticias Procesadas: icono Newspaper, total, "~X por boletín"

// 2. GRÁFICOS (grid-cols-2)
// - Recharts LineChart: boletines por semana (12 semanas)
// - Recharts BarChart: emails enviados vs abiertos (10 boletines)

// 3. GRÁFICOS (grid-cols-2)
// - Recharts PieChart/DonutChart: distribución por categoría
// - Recharts BarChart horizontal: artículos por fuente

// 4. TABLAS (grid-cols-2)
// - Actividad Reciente: últimos 5 audit logs con badge de color
// - Rendimiento Pipeline: tabla con step, avgDuration, status indicator
```

Componentes Recharts a usar:
- `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`
- `BarChart`, `Bar`
- `PieChart`, `Pie`, `Cell`

Colores del dashboard:
- Azul corporativo: `#004aad` (principal)
- Azul claro: `#1a62ff` (secundario)
- Verde: `#10b981` (positivo/éxito)
- Rojo: `#ef4444` (negativo/fallo)
- Amarillo: `#f59e0b` (alerta/lento)
- Gris: `#6b7280` (neutral)

---

## Archivos resumen

| Archivo | Acción | Fase |
|---------|--------|------|
| `src/app/dashboard/bulletin/[id]/page.tsx` | Modificar — eliminar Exportar JSON, condicionar ShareButton, cargar audit logs | 1, 3 |
| `src/lib/schema.ts` | Modificar — agregar tablas `bulletin_audit_logs`, `email_sends`, `email_clicks`, campos `emailSentAt`, `unsubscribeToken` | 2, 4, 5 |
| `src/lib/db/queries/audit.ts` | **Nuevo** — queries de auditoría | 2 |
| `src/app/api/bulletins/[id]/route.ts` | Modificar — registrar auditoría en PATCH y DELETE | 3 |
| `src/app/dashboard/bulletin/[id]/components/bulletin-detail-tabs.tsx` | Modificar — mostrar audit logs en UI | 3 |
| `.env` | Modificar — credenciales SMTP Outlook | 4 |
| `src/lib/db/queries/email-tracking.ts` | **Nuevo** — queries de tracking de email | 4 |
| `src/lib/email/templates/bulletin.ts` | Reescribir — template profesional con logos, personalización, tracking | 5 |
| `src/app/api/unsubscribe/[token]/route.ts` | **Nuevo** — endpoint público desuscripción | 5 |
| `src/app/unsubscribe/[token]/page.tsx` | **Nuevo** — página confirmación desuscripción | 5 |
| `src/app/api/track/open/[trackingId]/route.ts` | **Nuevo** — endpoint público pixel tracking | 6 |
| `src/app/api/track/click/[trackingId]/route.ts` | **Nuevo** — endpoint público click tracking | 6 |
| `src/app/api/bulletins/[id]/send-email/route.ts` | Reescribir — envío individual con tracking y prevención duplicados | 6 |
| `src/app/api/bulletins/[id]/send-test-email/route.ts` | **Nuevo** — envío de prueba al usuario actual | 6 |
| `src/app/dashboard/bulletin/[id]/components/bulletin-actions.tsx` | Modificar — agregar botón "Enviar Prueba" | 6 |
| `src/lib/db/queries/dashboard.ts` | **Nuevo** — queries de métricas | 7 |
| `src/app/api/dashboard/stats/route.ts` | **Nuevo** — API de métricas | 7 |
| `src/app/dashboard/page.tsx` | Reescribir — dashboard real con gráficos Recharts | 7 |
