# Implementation Plan: Rediseño OttoSeguridad Console

## Overview

Rediseño visual completo de las 7 pantallas del admin (`/dashboard/*`) aplicando la propuesta **Opción B Bold institucional** del bundle de claude.ai/design: paleta roja `#d62828`, sidebar negro, Space Grotesk + Inter + JetBrains Mono. **Cero cambios funcionales** — solo capa visual: tokens CSS, layout shell, JSX/clases de cada página.

**Mapeo 1:1** rutas existentes → pantallas de diseño:

| Diseño        | Ruta                                     |
| ------------- | ---------------------------------------- |
| Hoy           | `src/app/dashboard/page.tsx`             |
| Boletines     | `src/app/dashboard/bulletin/page.tsx`    |
| Generar       | `src/app/dashboard/bulletin/generate/`   |
| Suscriptores  | `src/app/dashboard/subscribers/page.tsx` |
| Fuentes       | `src/app/dashboard/settings/sources/`    |
| Categorías    | `src/app/dashboard/settings/categories/` |
| Usuarios      | `src/app/dashboard/settings/users/`      |

**Reglas de aprobación**: Cada fase se cierra cuando todas sus tareas están en `[x]`. **No se avanza a la siguiente fase sin luz verde explícita del usuario.**

---

## Phase 1: Foundation — Tokens, fuentes y shell del dashboard

Sentar las bases del nuevo sistema visual: variables CSS de marca, fuentes nuevas, sidebar + topline reutilizables. Todo lo demás depende de esta fase.

### Tasks

- [x] Agregar fuentes `Space_Grotesk` y `JetBrains_Mono` desde `next/font/google` en `src/app/layout.tsx` con variables CSS `--font-space-grotesk` y `--font-jetbrains-mono`
- [x] Agregar bloque de tokens OttoSeguridad en `src/app/globals.css` (variables `--otto-*`)
- [x] Re-mapear `--primary` y `--ring` de shadcn (en `:root` y `.dark`) al rojo `#d62828` para que Buttons y focus rings hereden la marca
- [x] Agregar utilities globales `.font-display` y `.font-mono-otto` en `globals.css`
- [x] Crear `src/components/dashboard/sidebar.tsx` (Client) con grupos Operación/Audiencia/Configuración, `usePathname()` para active state, badges live/1.2k, bloque "Pipeline activo"
- [x] Crear `src/components/dashboard/topline.tsx` (breadcrumbs + search ⌘K + avatar con iniciales del usuario via `useSession()`)
- [x] Crear `src/components/dashboard/page-header.tsx` (H1 con `<em>` rojo opcional + lede + slot de acciones)
- [x] Crear `src/components/dashboard/footer-note.tsx`
- [x] Modificar `src/app/dashboard/layout.tsx` para envolver `{children}` en grid `[240px 1fr]` con `<Sidebar />` + `<main>` (mantener auth guard existente)
- [x] Condicionar `SiteHeader` y `SiteFooter` globales en `src/app/layout.tsx` para que NO se rendericen dentro de `/dashboard/*`

### Technical Details

**Fuentes nuevas en `src/app/layout.tsx`:**

```tsx
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

// En <html>: className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ...`}
```

**Tokens en `globals.css`** (agregar dentro de `:root` después de las shadcn vars):

```css
:root {
  /* OttoSeguridad — Bold institucional */
  --otto-bg: #f6f6f4;
  --otto-surface: #ffffff;
  --otto-ink: #0e0e10;
  --otto-ink-2: #3c3c40;
  --otto-muted: #6c6c72;
  --otto-rule: #e6e5e1;
  --otto-rule-2: #efedea;
  --otto-primary: #d62828;
  --otto-primary-ink: #7a1414;
  --otto-primary-soft: #fde2e2;
  --otto-primary-soft-2: #fbcdcd;
  --otto-ok: #0a7d3d;
  --otto-ok-soft: #daefdf;
  --otto-warn: #b06b00;
  --otto-warn-soft: #f6e4c0;
  --otto-err: #9b1c2d;
  --otto-err-soft: #f6d8d6;
  --otto-shadow-1: 0 1px 2px rgba(14,14,16,.04), 0 4px 14px rgba(14,14,16,.04);
  --otto-shadow-2: 0 4px 24px rgba(14,14,16,.08);

  /* Re-map shadcn primary to brand red — cualquier Button default hereda */
  --primary: oklch(0.5854 0.2098 27.32);  /* equivalente a #d62828 */
  --ring: oklch(0.5854 0.2098 27.32);
}

.dark {
  --primary: oklch(0.5854 0.2098 27.32);
  --ring: oklch(0.5854 0.2098 27.32);
}

.font-display { font-family: var(--font-space-grotesk); letter-spacing: -.02em; }
.font-mono-otto {
  font-family: var(--font-jetbrains-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 600;
}
```

**Sidebar (`src/components/dashboard/sidebar.tsx`):** Replicar `/tmp/design-extract/otto/project/otto-app/sidebar.html`. Estructura:

```tsx
'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, List, Plus, Users, RefreshCw, LayoutGrid, UserCog } from 'lucide-react';

const NAV = [
  { group: 'Operación', items: [
    { href: '/dashboard',           label: 'Hoy',          icon: Home,        badge: 'live' },
    { href: '/dashboard/bulletin',  label: 'Boletines',    icon: List },
    { href: '/dashboard/bulletin/generate', label: 'Generar', icon: Plus },
  ]},
  { group: 'Audiencia', items: [
    { href: '/dashboard/subscribers', label: 'Suscriptores', icon: Users, badge: '1.2k' },
  ]},
  { group: 'Configuración', items: [
    { href: '/dashboard/settings/sources',     label: 'Fuentes',     icon: RefreshCw },
    { href: '/dashboard/settings/categories',  label: 'Categorías',  icon: LayoutGrid },
    { href: '/dashboard/settings/users',       label: 'Usuarios',    icon: UserCog },
  ]},
];
```

**Layout dashboard (`src/app/dashboard/layout.tsx`):**

```tsx
import { Sidebar } from '@/components/dashboard/sidebar';
// mantener auth guard existente
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ... auth check existente
  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: '240px 1fr', background: 'var(--otto-bg)' }}>
      <Sidebar />
      <main className="px-8 pt-6 pb-16 max-w-[1280px] w-full min-w-0">{children}</main>
    </div>
  );
}
```

**Condicionar SiteHeader/Footer:** En `src/app/layout.tsx`, no se puede usar `usePathname` en Server Component. Opciones:

1. Mover `<SiteHeader />` y `<SiteFooter />` a un Client wrapper que lo oculte en `/dashboard/*`.
2. Crear `src/app/(public)/layout.tsx` que incluya header/footer y mover páginas públicas allí.

Preferir **opción 1** (menos refactor): crear `src/components/conditional-shell.tsx` (Client) que use `usePathname()` y solo renderice `SiteHeader/SiteFooter` si NO empieza con `/dashboard`.

**Archivos creados en esta fase:**

- `src/components/dashboard/sidebar.tsx`
- `src/components/dashboard/topline.tsx`
- `src/components/dashboard/page-header.tsx`
- `src/components/dashboard/footer-note.tsx`
- `src/components/conditional-shell.tsx` (si se elige opción 1)

**Archivos modificados:**

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/dashboard/layout.tsx`

**Referencia de diseño:** `/tmp/design-extract/otto/project/otto-app/shell.css` (lines 1-152), `sidebar.html`.

---

> ⏸ **CHECKPOINT**: Esperar luz verde del usuario antes de Fase 2.

---

## Phase 2: Pantalla "Hoy" (dashboard)

Rediseñar la página principal con hero negro, pipeline en vivo, KPIs y paneles de últimos boletines + próximos pasos. **Conserva** todas las queries del Server Component actual (`getDashboardKPIs`, `getBulletinTrend`, `getEmailPerformanceByBulletin`, etc.).

### Tasks

- [x] Crear `src/components/dashboard/hero.tsx` con gradiente negro + radial rojo, tag "Edición · {fecha}", H2, meta, CTAs
- [x] Crear `src/components/dashboard/pipeline-steps.tsx` (5 pasos: Scraping/Clasif/Resumen/Video/Enviar) con states `done|now|pending` y subtítulo de duración
- [x] Crear `src/components/dashboard/kpi-card.tsx` con variantes `default | featured` (negro), delta up/down/flat y sparkline opcional
- [x] Crear `src/components/dashboard/last-bulletins-panel.tsx` (5 filas con date/title/stat/pill)
- [x] Crear `src/components/dashboard/next-steps-panel.tsx` (lista numerada con título + descripción)
- [x] Reescribir el JSX de `src/app/dashboard/page.tsx` para usar los componentes nuevos. **No tocar las llamadas a queries existentes**, solo cómo se renderizan.
- [x] Derivar el estado del pipeline desde el boletín de hoy (`getTodayBulletin()`): `raw_news_count > 0` → Scraping done; `classified_at` → Clasif done; `summarized_at` → Resumen done; `video_status` → Video; `sent_at` → Enviar.
- [x] Verificar visualmente contra `/tmp/design-extract/otto/project/otto-app/hoy.html`

### Technical Details

**Hero:**

```tsx
<section className="relative overflow-hidden rounded-[18px] p-7 mb-6 text-white"
  style={{ background: 'linear-gradient(135deg,#0e0e10 0%,#1d1d20 100%)', boxShadow: 'var(--otto-shadow-2)' }}>
  <div className="absolute -right-[90px] -top-[90px] w-[300px] h-[300px] rounded-full opacity-55"
       style={{ background: 'radial-gradient(circle, var(--otto-primary) 0%, transparent 65%)' }} />
  <div className="grid grid-cols-[1.3fr_1fr] gap-8 items-center relative z-10">
    {/* left: tag + h2 + meta + ctas */}
    {/* right: <PipelineSteps /> embebido */}
  </div>
</section>
```

**KPIs grid:**

```tsx
<div className="grid grid-cols-4 gap-3.5 mb-6">
  <KpiCard featured h="Apertura · último envío" v="41" suffix="%" delta={{ dir: 'up', text: '+3 pts vs. prom 7d' }} sparkline={[30,45,38,60,52,70,85]} />
  <KpiCard h="Suscriptores netos · 7d" v="+18" delta={{ dir: 'up', text: '7 nuevos · 0 bajas' }} />
  <KpiCard h="Rebote · 7d" v="2.1" suffix="%" delta={{ dir: 'down', text: '+0.4 pts — revisar' }} />
  <KpiCard h="Pipeline · prom." v="8:40" delta={{ dir: 'up', text: 'vs objetivo 10:00' }} />
</div>
```

**Mapeo de datos reales** (los valores arriba son ejemplos del mockup — usar las queries existentes):

- `getDashboardKPIs()` ya devuelve `openRate`, `subscriberDelta`, `bounceRate`, etc. Mapear cada campo a un `<KpiCard>`.
- Sparkline: usar `getBulletinTrend()` (últimos 7 días de open rate).
- "Últimos boletines": usar `getAllBulletins(5)` o el query equivalente que ya está en page.tsx.

**Pipeline-steps signature:**

```tsx
type Step = { label: string; sub: string; status: 'done' | 'now' | 'pending' };
export function PipelineSteps({ steps }: { steps: Step[] }) { /* ... */ }
```

**Referencia de diseño:** `/tmp/design-extract/otto/project/otto-app/hoy.html` (lines 9-76 estilos, 89-189 markup).

**Archivos creados:**

- `src/components/dashboard/hero.tsx`
- `src/components/dashboard/pipeline-steps.tsx`
- `src/components/dashboard/kpi-card.tsx`
- `src/components/dashboard/last-bulletins-panel.tsx`
- `src/components/dashboard/next-steps-panel.tsx`

**Archivos modificados:**

- `src/app/dashboard/page.tsx` (solo el JSX render — NO las queries server-side)

---

> ⏸ **CHECKPOINT**: Esperar luz verde del usuario antes de Fase 3.

---

## Phase 3: Boletines (lista)

Convertir la lista plana de boletines en un timeline agrupado por semana con filter tabs y open rates visibles. **Conserva** `getAllBulletins`, `getTodayBulletin` y el componente `BulletinList` (este se refactoriza con un `mode` prop).

### Tasks

- [x] Crear `src/components/bulletin/bulletins-toolbar.tsx` con filter tabs (Todos/Enviados/Borradores/Errores) + count badges + date picker + botón "Exportar"
- [x] Crear `src/components/bulletin/bulletin-week-section.tsx` (header de semana con stats agregadas: enviados, suscriptores, apertura promedio)
- [x] Crear `src/components/bulletin/bulletin-card-row.tsx` (grid: día grande / título+meta / stat / status pill)
- [x] Refactor de `BulletinList` para aceptar `mode: 'cards' | 'rows'` (o crear nuevo componente `BulletinTimeline` que use la misma data)
- [x] Reescribir JSX de `src/app/dashboard/bulletin/page.tsx`: `<PageHeader>` con CTA "Generar boletín" → `/dashboard/bulletin/generate`, `<BulletinsToolbar>`, render agrupado por semana
- [x] Lógica de agrupación por semana: derivar en cliente con `date-fns` o equivalente (Lun 00:00 → Dom 23:59 según `sent_at` o `created_at`)
- [x] Filter tabs aplican filtro client-side sobre el array de boletines (sin nuevas API calls)
- [x] Verificar visualmente contra `/tmp/design-extract/otto/project/otto-app/boletines.html`

### Technical Details

**Toolbar:**

```tsx
<div className="flex items-center justify-between gap-4 mb-5">
  <div className="flex items-center gap-1 border border-[var(--otto-rule)] rounded-[10px] p-1 bg-white">
    {['Todos','Enviados','Borradores','Errores'].map(t => (
      <button className={cn('px-3 py-1.5 rounded-md text-sm', active && 'bg-[var(--otto-primary-soft)] text-[var(--otto-primary-ink)]')}>
        {t} <span className="font-mono-otto">{count}</span>
      </button>
    ))}
  </div>
  <div className="flex gap-2">
    <DatePicker /> <Button variant="outline">Exportar</Button>
  </div>
</div>
```

**Week section:**

```tsx
<div className="mb-6">
  <div className="flex items-baseline justify-between border-b border-[var(--otto-rule)] pb-2 mb-3">
    <h3 className="font-display text-base font-bold">Sem 17 · 21–27 abr 2026</h3>
    <span className="font-mono-otto text-[var(--otto-muted)]">5 enviados · 1284 suscriptores · 39% apertura</span>
  </div>
  {bulletins.map(b => <BulletinCardRow key={b.id} {...b} />)}
</div>
```

**Card row layout:** grid `[64px_1fr_auto_auto_auto]` — día grande / título+meta / counts / open rate / status pill.

**Referencia de diseño:** `/tmp/design-extract/otto/project/otto-app/boletines.html`.

**Archivos creados:**

- `src/components/bulletin/bulletins-toolbar.tsx`
- `src/components/bulletin/bulletin-week-section.tsx`
- `src/components/bulletin/bulletin-card-row.tsx`

**Archivos modificados:**

- `src/app/dashboard/bulletin/page.tsx`
- `src/components/bulletin/bulletin-list.tsx` (agregar `mode` prop sin romper otros consumidores)

---

> ⏸ **CHECKPOINT**: Esperar luz verde del usuario antes de Fase 4.

---

## Phase 4: Generar boletín

Reestilizar la página de generación como wizard de 5 pasos con news grid + summary card sticky. **Conserva** todas las API calls (`POST /api/news/scrape`, `GET /api/bulletins/today`), `PipelineProgress`, toasts, estado de selección.

### Tasks

- [x] Crear `src/components/bulletin/generate-stepper.tsx` (5 pasos: Scraping / Clasif. / Selección [N] / Video / Envío) con estado derivado del state actual
- [x] Crear `src/components/bulletin/news-card.tsx` con checkbox + título + fuente + excerpt + categoría tag, estado `.selected` con border + bg rojo soft
- [x] Crear `src/components/bulletin/generate-summary-card.tsx` (sticky right): edition info, send time, recipients, video duration, total seleccionado, CTAs "Autorizar y enviar" + "Guardar borrador"
- [x] Reescribir JSX de `src/app/dashboard/bulletin/generate/page.tsx`: layout 2-col (`grid-cols-[1fr_360px]`), izquierda news grid agrupada por categoría, derecha summary card
- [x] Mantener flujo de generación: botón "Iniciar pipeline" → fetch → `PipelineProgress` → render de noticias seleccionables
- [x] Reusar `NewsEditor` si ya tiene la lógica de selección — solo cambiar el wrapper visual
- [x] Verificar visualmente contra `/tmp/design-extract/otto/project/otto-app/generar.html`

### Technical Details

**Stepper:**

```tsx
type StepperStep = { label: string; status: 'done' | 'now' | 'pending'; count?: number };
<div className="flex items-center gap-3 p-4 bg-white border border-[var(--otto-rule)] rounded-xl mb-5">
  {steps.map((s, i) => (
    <div className="flex items-center gap-2">
      <span className={cn('w-7 h-7 rounded-full flex items-center justify-center font-mono-otto text-xs',
        s.status === 'done' && 'bg-[var(--otto-ok)] text-white',
        s.status === 'now' && 'bg-[var(--otto-primary)] text-white shadow-[0_0_0_5px_rgba(214,40,40,.25)]',
        s.status === 'pending' && 'bg-[var(--otto-rule-2)] text-[var(--otto-muted)]')}>
        {s.status === 'done' ? '✓' : s.count ?? i+1}
      </span>
      <span className="text-sm font-medium">{s.label}</span>
      {i < steps.length - 1 && <span className="flex-1 h-px bg-[var(--otto-rule)]" />}
    </div>
  ))}
</div>
```

**News card:**

```tsx
<button onClick={toggle} className={cn('text-left p-4 border rounded-xl transition-all',
  selected ? 'border-[var(--otto-primary)] bg-[var(--otto-primary-soft)]/40' : 'border-[var(--otto-rule)] bg-white hover:border-[var(--otto-ink-2)]')}>
  <div className="flex items-start gap-3">
    <Checkbox checked={selected} />
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono-otto text-[var(--otto-primary)]">{category}</span>
        <span className="font-mono-otto text-[var(--otto-muted)]">· {source}</span>
      </div>
      <h4 className="font-display text-base font-semibold mb-1">{title}</h4>
      <p className="text-sm text-[var(--otto-muted)] line-clamp-2">{excerpt}</p>
    </div>
  </div>
</button>
```

**Summary card:** sticky con `position: sticky; top: 1.5rem`. Lista de info rows + total + acciones.

**Referencia de diseño:** `/tmp/design-extract/otto/project/otto-app/generar.html`.

**Archivos creados:**

- `src/components/bulletin/generate-stepper.tsx`
- `src/components/bulletin/news-card.tsx`
- `src/components/bulletin/generate-summary-card.tsx`

**Archivos modificados:**

- `src/app/dashboard/bulletin/generate/page.tsx`

---

> ⏸ **CHECKPOINT**: Esperar luz verde del usuario antes de Fase 5.

---

## Phase 5: Suscriptores

Convertir grid de cards en tabla densa con segments, engagement bars y bulk actions. **Conserva** `SubscriberFormDialog`, `ImportCsvDialog`, todas las API calls (`/api/subscribers/*`).

### Tasks

- [x] Crear `src/components/subscribers/stats-row.tsx` (4 cards: Total / Engagement % / Rebote / Bajas) — datos calculados client-side sobre el array existente
- [x] Crear `src/components/subscribers/segment-tabs.tsx` (Todos / Engaged 30d / VIP / Frío / Rebote / Bajas) — derivar segmentos en cliente con heurística sobre `last_open_at`, `bounce_count`, etc.
- [x] Crear `src/components/subscribers/bulk-bar.tsx` (oculto, aparece con `selectedIds.length > 0`)
- [x] Crear `src/components/subscribers/subscribers-table.tsx`: checkbox / email+name / segment chips / engagement bar / last open / join date / menu
- [x] Crear `src/components/subscribers/segment-chip.tsx` (variantes engaged/vip/cold)
- [x] Crear `src/components/subscribers/engagement-bar.tsx` (barra horizontal + %)
- [x] Reescribir JSX de `src/app/dashboard/subscribers/page.tsx` para usar la tabla. **Conservar** todo el estado y los handlers existentes.
- [x] **Mantener** `SubscriberCard` exportado por si lo usa otra ruta (no eliminar)
- [x] Verificar visualmente contra `/tmp/design-extract/otto/project/otto-app/suscriptores.html`

### Technical Details

**Segment derivation (client-side):**

```ts
function getSegments(s: Subscriber): SegmentTag[] {
  const tags: SegmentTag[] = [];
  const last = s.last_open_at ? new Date(s.last_open_at) : null;
  const days = last ? (Date.now() - last.getTime()) / 86400000 : Infinity;
  if (days <= 30) tags.push('engaged');
  if (s.is_vip) tags.push('vip');
  if (days > 90) tags.push('cold');
  if (s.bounce_count > 0) tags.push('bounce');
  return tags;
}
```

**Engagement bar:**

```tsx
<div className="flex items-center gap-2 w-32">
  <div className="flex-1 h-1.5 bg-[var(--otto-rule-2)] rounded-full overflow-hidden">
    <div className="h-full bg-[var(--otto-primary)]" style={{ width: `${pct}%` }} />
  </div>
  <span className="font-mono-otto text-xs">{pct}%</span>
</div>
```

**Bulk bar:**

```tsx
{selectedIds.length > 0 && (
  <div className="bg-[var(--otto-ink)] text-white p-3 rounded-lg flex items-center gap-3 mb-3">
    <span className="font-mono-otto text-xs">{selectedIds.length} seleccionados</span>
    <Button size="sm" variant="ghost">Etiquetar</Button>
    <Button size="sm" variant="ghost">Exportar</Button>
    <Button size="sm" variant="destructive">Eliminar</Button>
  </div>
)}
```

**Referencia de diseño:** `/tmp/design-extract/otto/project/otto-app/suscriptores.html`.

**Archivos creados:**

- `src/components/subscribers/stats-row.tsx`
- `src/components/subscribers/segment-tabs.tsx`
- `src/components/subscribers/bulk-bar.tsx`
- `src/components/subscribers/subscribers-table.tsx`
- `src/components/subscribers/segment-chip.tsx`
- `src/components/subscribers/engagement-bar.tsx`

**Archivos modificados:**

- `src/app/dashboard/subscribers/page.tsx` (solo JSX y estado de UI; sin tocar API calls)

---

> ⏸ **CHECKPOINT**: Esperar luz verde del usuario antes de Fase 6.

---

## Phase 6: Fuentes

Convertir grid de cards de fuentes en grid 2-col con favicons coloreados, toggles y status. **Conserva** todas las API calls de `/api/sources/*` y `SourceFormDialog`.

### Tasks

- [x] Crear `src/components/sources/sources-stats-row.tsx` (4 cards: Activas / Tasa captura / Última corrida / Errores 24h)
- [x] Crear `src/components/sources/source-favicon.tsx` (square con iniciales y bg de color hash sobre el nombre)
- [x] Crear `src/components/sources/source-card-otto.tsx` con grid 3-col: favicon | nombre+URL+meta | toggle+pill. Borde rojo izquierdo si está en error.
- [x] Reescribir JSX de `src/app/dashboard/settings/sources/page.tsx`: `<PageHeader>` con CTA "+ Fuente", stats row, grid 2-col de cards
- [x] **Mantener** `SourceCard` original exportado para no romper otros consumidores (revisar dónde se usa antes)
- [x] Reusar `SourceFormDialog` tal cual
- [x] Verificar visualmente contra `/tmp/design-extract/otto/project/otto-app/fuentes.html`

### Technical Details

**Favicon con hash de color:**

```tsx
const COLORS = ['#d62828','#0a7d3d','#b06b00','#9b1c2d','#1d4ed8','#7c3aed','#0891b2','#be185d','#65a30d','#ea580c','#0f766e'];
function colorForName(name: string) {
  const h = [...name].reduce((a,c) => a + c.charCodeAt(0), 0);
  return COLORS[h % COLORS.length];
}
<div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-display font-bold"
     style={{ background: colorForName(name) }}>{name.slice(0,1).toUpperCase()}</div>
```

**Source card layout:**

```tsx
<div className={cn('grid grid-cols-[48px_1fr_auto] gap-4 p-4 bg-white border rounded-xl items-center',
  hasError ? 'border-l-4 border-l-[var(--otto-err)]' : 'border-[var(--otto-rule)]')}>
  <SourceFavicon name={source.name} />
  <div>
    <div className="font-display font-semibold">{source.name}</div>
    <div className="font-mono-otto text-[var(--otto-muted)] text-xs">{source.url}</div>
    <div className="font-mono-otto text-[var(--otto-muted)] text-[10px] mt-1">12 art · prom 4.2/día · ult 18:42</div>
  </div>
  <div className="flex items-center gap-3">
    <Switch checked={source.active} onCheckedChange={...} />
    <span className={cn('pill', source.active ? 'ok' : 'muted')}>{source.active ? 'activa' : 'pausada'}</span>
  </div>
</div>
```

**Referencia de diseño:** `/tmp/design-extract/otto/project/otto-app/fuentes.html`.

**Archivos creados:**

- `src/components/sources/sources-stats-row.tsx`
- `src/components/sources/source-favicon.tsx`
- `src/components/sources/source-card-otto.tsx`

**Archivos modificados:**

- `src/app/dashboard/settings/sources/page.tsx`

---

> ⏸ **CHECKPOINT**: Esperar luz verde del usuario antes de Fase 7.

---

## Phase 7: Categorías

Convertir lista drag-and-drop en grid 3-col de cards con accent bars de color, emojis y keyword tags. **Conserva** `@dnd-kit`, `SortableCategoryRow`, todas las API calls.

### Tasks

- [x] Crear `src/components/categories/categories-stats-row.tsx` (Total / Cobertura keywords)
- [x] Crear `src/components/categories/category-card.tsx` con accent bar izquierdo de color, emoji, título, descripción, keyword tags, stats footer (7d count, last update, status)
- [x] Crear mapa `CATEGORY_VISUALS` (slug → `{ emoji, color }`): política→⚖ rojo, seguridad→🛡 verde, economía→📈 ámbar, internacional→🌎 morado, deportes→⚽ teal, cultura→🎭 cyan, ambiente→🌱 verde-claro, **fallback** genérico
- [x] Crear `src/components/categories/keyword-tags.tsx` (flex wrap de pequeños badges mono)
- [x] Refactor de drag-and-drop: envolver `<CategoryCard>` con `useSortable` de `@dnd-kit/sortable`. Si el grid 3-col rompe el cursor de drag, agregar handle dedicado (icono `GripVertical` arriba-derecha de cada card)
- [x] Reescribir JSX de `src/app/dashboard/settings/categories/page.tsx`: `<PageHeader>` con CTA "+ Categoría", stats row, grid 3-col
- [x] Mantener form de "Agregar categoría" — moverlo a `Dialog` si ahora estorba al diseño grid
- [x] Verificar visualmente contra `/tmp/design-extract/otto/project/otto-app/categorias.html`

### Technical Details

**Visuales por categoría:**

```ts
export const CATEGORY_VISUALS: Record<string, { emoji: string; color: string }> = {
  politica:      { emoji: '⚖', color: '#d62828' },
  seguridad:     { emoji: '🛡', color: '#0a7d3d' },
  economia:      { emoji: '📈', color: '#b06b00' },
  internacional: { emoji: '🌎', color: '#7c3aed' },
  deportes:      { emoji: '⚽', color: '#0891b2' },
  cultura:       { emoji: '🎭', color: '#06b6d4' },
  ambiente:      { emoji: '🌱', color: '#65a30d' },
};
const fallback = { emoji: '📰', color: '#6c6c72' };
function visualFor(slug: string) {
  return CATEGORY_VISUALS[slug.toLowerCase()] ?? fallback;
}
```

**Card con accent bar:**

```tsx
<div className="relative bg-white border border-[var(--otto-rule)] rounded-xl p-5 group">
  <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r" style={{ background: color }} />
  <div className="pl-2">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-2xl">{emoji}</span>
      <h3 className="font-display font-semibold">{name}</h3>
    </div>
    <p className="text-sm text-[var(--otto-muted)] mb-3">{description}</p>
    <KeywordTags keywords={keywords} />
    <div className="mt-3 pt-3 border-t border-[var(--otto-rule)] flex items-center justify-between font-mono-otto text-[10px]">
      <span>{count7d} not · 7d</span>
      <span>{lastUpdate}</span>
      <span className={cn('pill', active ? 'ok' : 'muted')}>{active ? 'activa' : 'pausada'}</span>
    </div>
    <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100" aria-label="Editar"><Edit className="w-4 h-4" /></button>
  </div>
</div>
```

**Drag-and-drop con grid:**

```tsx
import { DndContext, useSortable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

<DndContext onDragEnd={handleReorder}>
  <SortableContext items={categories.map(c => c.id)} strategy={rectSortingStrategy}>
    <div className="grid grid-cols-3 gap-4">
      {categories.map(c => <SortableCategoryCard key={c.id} category={c} />)}
    </div>
  </SortableContext>
</DndContext>
```

`rectSortingStrategy` está hecha para grids.

**Referencia de diseño:** `/tmp/design-extract/otto/project/otto-app/categorias.html`.

**Archivos creados:**

- `src/components/categories/categories-stats-row.tsx`
- `src/components/categories/category-card.tsx`
- `src/components/categories/keyword-tags.tsx`
- `src/lib/categories/visuals.ts` (mapa CATEGORY_VISUALS)

**Archivos modificados:**

- `src/app/dashboard/settings/categories/page.tsx`
- `src/components/categories/sortable-category-row.tsx` (renombrar o adaptar)

---

> ⏸ **CHECKPOINT**: Esperar luz verde del usuario antes de Fase 8.

---

## Phase 8: Usuarios

Reestilizar página de usuarios con cards de roles arriba (Admin/Editor/Viewer) y tabla densa de usuarios con avatares coloreados. **Conserva** todas las API calls de `/api/admin/users/*`, password reset, permisos de menú.

### Tasks

- [x] Crear `src/components/users/permissions-grid.tsx` (3 cards: Admin / Editor / Viewer) con lista de capabilities (✓/×) y conteo de usuarios por rol
- [x] Crear `src/components/users/user-avatar.tsx` (circulo 36px con iniciales + bg de color hash sobre nombre)
- [x] Crear `src/components/users/role-pill.tsx` (3 variantes: admin oscuro / editor primary-soft / viewer gris)
- [x] Crear `src/components/users/users-table.tsx`: avatar+name+email / role pill / last activity / status / join date / menu (`...`)
- [x] Crear `src/components/users/user-form-dialog.tsx` (mover el form expandible actual a Dialog)
- [x] El panel expandible de password/permissions: mantener como expand-on-row O mover a Dialog/Sheet — elegir lo que rompa menos lógica
- [x] Reescribir JSX de `src/app/dashboard/settings/users/page.tsx`: `<PageHeader>` con CTA "+ Usuario" → abre Dialog, permissions grid, tabla
- [x] Verificar visualmente contra `/tmp/design-extract/otto/project/otto-app/usuarios.html`

### Technical Details

**Permissions grid:**

```tsx
const ROLE_DEFS = [
  { key: 'admin',  title: 'Admin',  desc: 'Control total',     perms: { 'Crear/editar/eliminar': true, 'Ver auditoría': true, 'Configurar sistema': true, 'Enviar boletín': true } },
  { key: 'editor', title: 'Editor', desc: 'Gestión editorial', perms: { 'Crear/editar/eliminar': true, 'Ver auditoría': false, 'Configurar sistema': false, 'Enviar boletín': true } },
  { key: 'viewer', title: 'Viewer', desc: 'Solo lectura',      perms: { 'Crear/editar/eliminar': false, 'Ver auditoría': false, 'Configurar sistema': false, 'Enviar boletín': false } },
];
```

**Avatar con color hash:** mismo patrón que `source-favicon` pero círculo 36px.

**Role pill:**

```tsx
<span className={cn('font-mono-otto text-[10px] px-2 py-1 rounded',
  role === 'admin' && 'bg-[var(--otto-ink)] text-white',
  role === 'editor' && 'bg-[var(--otto-primary-soft)] text-[var(--otto-primary-ink)]',
  role === 'viewer' && 'bg-[var(--otto-rule-2)] text-[var(--otto-muted)]')}>
  {role}
</span>
```

**Referencia de diseño:** `/tmp/design-extract/otto/project/otto-app/usuarios.html`.

**Archivos creados:**

- `src/components/users/permissions-grid.tsx`
- `src/components/users/user-avatar.tsx`
- `src/components/users/role-pill.tsx`
- `src/components/users/users-table.tsx`
- `src/components/users/user-form-dialog.tsx`

**Archivos modificados:**

- `src/app/dashboard/settings/users/page.tsx`

---

> ⏸ **CHECKPOINT**: Esperar luz verde del usuario antes de Fase 9.

---

## Phase 9: Pulido y verificación

Aplicar el shell nuevo a las rutas extra dentro de `/dashboard/*` que no se rediseñaron, smoke pass visual contra el bundle, lint/typecheck.

### Tasks

- [x] Aplicar shell visual a `src/app/dashboard/bulletin/[id]/page.tsx` (sin tocar contenido — solo `<PageHeader>` + container styling)
- [x] Aplicar shell visual a `src/app/dashboard/bulletin/[id]/edit/page.tsx`
- [x] Aplicar shell visual a `src/app/dashboard/manual/page.tsx`
- [x] Confirmar que `SiteHeader` global no se renderiza dentro de `/dashboard/*`
- [x] Smoke pass por las 7 pantallas comparando contra los HTML del bundle (`/tmp/design-extract/otto/project/otto-app/*.html`)
- [x] `pnpm lint` sin errores nuevos
- [x] `pnpm typecheck` sin errores nuevos
- [x] El usuario corre `pnpm dev` y verifica cada pantalla manualmente; reporta visuales que falten

### Technical Details

**Verificación de regresión funcional**: en cada pantalla, abrir DevTools → Network y confirmar que las mismas API calls (mismas URLs, mismos métodos, mismos payloads) que antes del rediseño siguen ocurriendo.

**Lint/typecheck**:

```bash
pnpm lint && pnpm typecheck
```

**Build (opcional, para confirmar producción):**

```bash
pnpm build
```

(Esto ejecuta `db:migrate` primero — verificar que no haya migraciones pendientes).

---

## Phase 10: Pulido editorial pro (post-rediseño)

**Goal**: Iteraciones de UX pro sobre detalle de boletín — modo lectura editorial, modo edición denso tipo admin tool, sanitización de contenido y UX crítica del editor.

### 10.1 — Modo lectura clásico/moderno: nivel pro

- [x] Reescribir `src/components/bulletin/classic-bulletin-v2.tsx` con patrón editorial: max-width 720px, banner con `object-cover` 180px, header con tag rojo + Space Grotesk + stats line "X NOTAS · Y SECCIONES", TOC con anchor links (`#cat-{slug}`), categorías con mono editorial tag "▬ ECONOMÍA · 01", domain attribution + reading time por artículo, drop cap en primer párrafo, aspect ratios 21/9 (primera) y 16/9 (resto), ornament separator entre categorías, footer con logo búho + tagline
- [x] Upgrade `src/components/bulletin/modern-bulletin-layout.tsx`: hero con gradiente negro `#0e0e10 → #1d1d20` + glow rojo radial + grid pattern, stats line con números grandes Space Grotesk, filter pills con count badges en mono, news cards con imágenes 21/9 (featured) y 16/9 (resto), ranking badge `01`/`02` overlay con backdrop-blur, meta row `[CATEGORÍA] · DOMINIO.COM · X MIN`, hover `-translate-y-1` + image scale 1.03, footer matching classic
- [x] Reemplazar todo color azul hardcoded (`rgb(0, 74, 173)`, `rgb(26, 98, 255)`, `text-blue-700`, `text-blue-600`) por tokens otto (`var(--otto-primary)`, `var(--otto-ink)`)
- [x] Ajustar logo del sidebar: 52×52 caja negra con `object-contain w-[48px]`, título "Console" sin "· v2"

### 10.2 — Modo edición: refactor a admin tool denso

- [x] Refactorizar `src/components/bulletin/editable-bulletin.tsx` quitando layout editorial vertical (imagen 16:9 full-width)
- [x] Implementar **modo display compacto tipo Linear/Notion**: fila horizontal con thumbnail lateral 180×112, meta + título 16px line-clamp-2 + extracto line-clamp-2, acciones siempre visibles
- [x] Implementar **modo edición expandido**: solo la card editada se expande vertical con todos los campos (imagen preview ≤420px, título Input, textarea resumen, URL/Fuente lado a lado), borde rojo + sombra como indicador
- [x] Header sticky pro: chip mono "● MODO EDICIÓN", título Space Grotesk con stats line `X NOTAS · Y SECCIONES`, jerarquía clara de botones (primary "Guardar", outlines secundarios)
- [x] Headers de categoría con patrón editorial (`▬ ECONOMÍA · 01` mono rojo + contador de notas)
- [x] Ranking como prefijo del título `#01 · ECONOMÍA · PRIMICIAS` (no badge sobre imagen)
- [x] Banner "cambios sin guardar" yellow legacy → flotante blanco con dot rojo pulsante

### 10.3 — Sanitización y estructura de contenido

- [x] Crear `src/lib/bulletin/content-sanitizer.ts`: `stripSpamTail()` corta marcadores ("Contenido Patrocinado", "Voces de la Ciudad", "Test:", "Especialistas analizan", "Ed Sheeran", "Geely presenta", "Te puede interesar", etc.); `splitIntoParagraphs()` divide texto continuo en párrafos lógicos cada N oraciones; `wordCount()` y `processArticleBody()` pipeline
- [x] Crear `src/components/bulletin/article-body.tsx`: componente reutilizable con drop cap en primer párrafo, body en párrafos estructurados, `text-wrap: pretty` + `hyphens: auto`, **colapsable "Mostrar nota completa ↓"** si excede ~220 palabras con fade-out gradient
- [x] Aplicar `<ArticleBody>` en `classic-bulletin-v2.tsx` (variant classic, drop cap en primera de cada categoría)
- [x] Aplicar `stripSpamTail()` en `modern-bulletin-layout.tsx` para excerpts de cards

### 10.4 — Pulido visual del detalle

- [x] Tabs (Resúmenes / Noticias / Editar / Auditoría) rediseñados: underline activo en otto-primary, `font-mono-otto` uppercase, sin pill-style con bg
- [x] Crear `src/components/ui/empty-state.tsx` reutilizable: ícono circular outline + Space Grotesk title + helper + CTA otto-primary
- [x] Reemplazar empty states inline (gris/azul) en `bulletin-detail-tabs.tsx` por `<EmptyState>` consistentes
- [x] Banner amarillo "missing fullContent" → otto-primary-soft con copy editorial + CTA otto-primary
- [x] Audit log con badges otto-primary-soft uniformes (no rainbow de greens/blues/reds)
- [x] Crear `src/app/dashboard/bulletin/[id]/loading.tsx` con skeletons (header + tabs + filas tipo row compacto)

### 10.5 — UX crítica del editor

- [x] Drag & drop con `@dnd-kit` para reordenar noticias dentro de cada categoría
- [x] Crear sub-componente `SortableNewsItem` con handle visible en hover (a la izquierda fuera del card)
- [x] Selección múltiple con checkbox que aparece en hover (o cuando ya hay otras seleccionadas)
- [x] Card seleccionada tinted con `otto-primary-soft` y borde rojo
- [x] Barra flotante de bulk actions (bottom-center): contador + Mejorar IA en lote (`PUT /enhance-content`) + Eliminar en lote + Cancelar
- [x] `bulkEnhance()` y `bulkDelete()` reutilizan los endpoints existentes — sin tocar la API

### Technical Details

**Files created**:

- `src/lib/bulletin/content-sanitizer.ts`
- `src/components/bulletin/article-body.tsx`
- `src/components/ui/empty-state.tsx`
- `src/app/dashboard/bulletin/[id]/loading.tsx`

**Files modified**:

- `src/components/bulletin/classic-bulletin-v2.tsx` (rewrite editorial pro + ArticleBody)
- `src/components/bulletin/modern-bulletin-layout.tsx` (hero pro, cards con imágenes, sanitizer)
- `src/components/bulletin/editable-bulletin.tsx` (refactor a admin tool: row compacto + dnd-kit + bulk + inputs styled)
- `src/components/dashboard/sidebar.tsx` (logo búho 52×52)
- `src/lib/bulletin/design-system.ts` (BRAND_COLORS rojo + Space Grotesk en MODERN heading)
- `src/app/dashboard/bulletin/[id]/components/bulletin-detail-tabs.tsx` (tabs underline, empty states, audit pro)

**Verificación**:

- `pnpm typecheck` ✅ sin errores nuevos
- `pnpm lint` ✅ sin warnings nuevos en archivos tocados (preexistentes en otros archivos)

---

## Resumen de archivos

**Creados** (~30 componentes nuevos en `src/components/dashboard/`, `src/components/bulletin/`, `src/components/subscribers/`, `src/components/sources/`, `src/components/categories/`, `src/components/users/`).

**Modificados:**

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/bulletin/page.tsx`
- `src/app/dashboard/bulletin/generate/page.tsx`
- `src/app/dashboard/subscribers/page.tsx`
- `src/app/dashboard/settings/sources/page.tsx`
- `src/app/dashboard/settings/categories/page.tsx`
- `src/app/dashboard/settings/users/page.tsx`

**Referencia (no editar):**

- `/tmp/design-extract/otto/project/otto-app/{shell.css, sidebar.html, hoy.html, boletines.html, generar.html, suscriptores.html, fuentes.html, categorias.html, usuarios.html}`
