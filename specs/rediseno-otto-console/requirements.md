# Requirements: Rediseño OttoSeguridad Console

## Qué se hace

Aplicar un **rediseño visual completo** a las 7 pantallas del admin de OttoSeguridad usando la propuesta **Opción B "Bold institucional"** del bundle de claude.ai/design (`/tmp/design-extract/otto/project/otto-app/`). El rediseño cubre:

- **Operación**: Hoy (dashboard) · Boletines (lista) · Generar boletín
- **Audiencia**: Suscriptores
- **Configuración**: Fuentes · Categorías · Usuarios

## Por qué

El UI actual es genérico: ícono Newspaper + gradiente azul, primary OkLCh naranja-amarillo, no transmite la identidad institucional roja de OttoSeguridad ni el ADN de empresa de seguridad. El nuevo diseño:

- Refuerza marca con paleta roja `#d62828` + sidebar negro `#0e0e10`
- Tipografía técnica (Space Grotesk + Inter + JetBrains Mono) que transmite precisión
- Sidebar agrupado por Operación / Audiencia / Configuración (mejor IA que header plano)
- Dashboard "Hoy" como módulo accionable con pipeline en vivo y CTA principal
- Densidad y jerarquía visual editorial — alineada con producto de noticias

## Restricción crítica

**Cero cambios funcionales.** Toda la lógica de negocio existente queda intacta:

- API routes (`/api/subscribers`, `/api/sources`, `/api/admin/users`, `/api/news/scrape`, `/api/bulletins/*`, etc.)
- Server queries (`getDashboardKPIs`, `getAllBulletins`, `getBulletinTrend`, etc.)
- Auth + permisos (Better Auth, layout guards, role checks)
- Estado de cliente (useState, useEffect, hooks de fetch)
- Pipelines (scraping, clasificación, resumen, video, envío)
- Dialogs de form existentes (`SubscriberFormDialog`, `SourceFormDialog`, `ImportCsvDialog`)
- Drag-and-drop de categorías (`@dnd-kit`)

Solo cambia: tokens CSS, fonts, layout shell del dashboard, JSX/clases visuales de cada pantalla.

## Acceptance criteria

- [ ] `/dashboard` muestra hero negro con acento rojo, pipeline de 5 pasos, 4 KPIs (1 featured), panel "Últimos boletines" + panel "Próximos pasos"
- [ ] `/dashboard/bulletin` muestra lista agrupada por semana con filter tabs y open rate visible
- [ ] `/dashboard/bulletin/generate` muestra stepper de 5 pasos + grid de noticias con checkboxes + summary card sticky
- [ ] `/dashboard/subscribers` muestra stats row, segment tabs, tabla densa con engagement bars y bulk actions
- [ ] `/dashboard/settings/sources` muestra grid 2-col con favicons coloreados, toggles y status pills
- [ ] `/dashboard/settings/categories` muestra grid 3-col con accent bars de color, emojis y keyword tags
- [ ] `/dashboard/settings/users` muestra 3 cards de roles (Admin/Editor/Viewer) + tabla con avatares coloreados
- [ ] Sidebar negro fijo a la izquierda visible en todas las pantallas de `/dashboard/*` con grupos Operación / Audiencia / Configuración
- [ ] Topline (breadcrumbs + search + avatar) consistente en todas las pantallas
- [ ] Todas las API calls existentes siguen funcionando exactamente igual (verificar Network tab)
- [ ] `pnpm lint && pnpm typecheck` pasa sin errores nuevos
- [ ] Visualmente coincide con los HTML del bundle de diseño en `/tmp/design-extract/otto/project/otto-app/`

## Dependencias

- **Existente y reusable**: shadcn/ui (Button, Card, Tabs, Table, Dialog, Badge, Avatar, Switch, Input, Select), `next-themes`, Better Auth, `@dnd-kit`
- **A agregar**: fuentes Space Grotesk y JetBrains Mono via `next/font/google`
- **Bundle de referencia** (no editar): `/tmp/design-extract/otto/project/otto-app/{shell.css, sidebar.html, hoy.html, boletines.html, generar.html, suscriptores.html, fuentes.html, categorias.html, usuarios.html}`

## Flujo de aprobación

El usuario debe **confirmar el cierre de cada fase** antes de pasar a la siguiente. Las tareas se marcan con `[x]` conforme se completan; al cerrar todas las tareas de una fase se pausa para revisión y luz verde.
