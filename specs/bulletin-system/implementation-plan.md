# Implementation Plan: Sistema de Boletines OttoSeguridad

## Resumen del Plan

Este plan divide la implementación en **10 fases** con tareas accionables. Cada tarea tiene un checkbox para seguimiento del progreso. El orden de las fases está optimizado para entregar valor incremental.

**Estrategia**: Frontend primero → Backend → Integración → Producción

**Tiempo estimado total**: 12-15 horas

---

## 📋 Fase 1: Foundation & Setup

**Objetivo**: Preparar el proyecto limpiando el boilerplate y configurando assets

**Tiempo estimado**: 30-45 minutos

### Tareas

#### 1.1 Limpieza del Boilerplate
- [x] Eliminar `src/components/setup-checklist.tsx`
- [x] Eliminar `src/components/starter-prompt-modal.tsx`
- [x] Eliminar `src/components/ui/github-stars.tsx`
- [x] Limpiar `src/app/page.tsx` (mantener solo estructura base)
- [x] Remover imports de componentes eliminados
- [x] Actualizar `src/components/site-header.tsx` para incluir link "Boletines"

#### 1.2 Configuración de Assets
- [x] Crear carpeta `public/bulletin-assets/`
- [x] Crear subcarpetas: `public/bulletin-assets/classic/` y `public/bulletin-assets/modern/`
- [ ] Subir imagen de header decorativo para diseño clásico
- [ ] Subir imagen de footer decorativo para diseño clásico
- [ ] Subir logo corporativo
- [ ] Optimizar imágenes (webp, tamaños apropiados)

#### 1.3 Configuración de Fuentes Custom
- [x] Agregar Canva Sans a `src/app/layout.tsx` (local o CDN)
- [x] Agregar Coco Gothic a `src/app/layout.tsx` (local o CDN)
- [x] Agregar Open Sans desde Google Fonts como fallback
- [x] Configurar font-display: swap para performance
- [x] Testear que las fuentes cargan correctamente

#### 1.4 Variables de Entorno
- [x] Agregar `FIRECRAWL_API_KEY` a `.env.example`
- [x] Agregar `CRON_SECRET` a `.env.example`
- [ ] Generar `CRON_SECRET` local: `openssl rand -base64 32`
- [x] Verificar que `OPENROUTER_API_KEY` esté en `.env`
- [x] Documentar variables nuevas en README

**Checkpoint**: El proyecto debe compilar sin errores, fuentes deben estar disponibles, assets deben ser accesibles.

---

## 🎨 Fase 2: Sistema de Diseño Dual

**Objetivo**: Crear el sistema de diseño con configuraciones para Clásico y Moderno

**Tiempo estimado**: 1-2 horas

### Tareas

#### 2.1 Interfaces y Tipos TypeScript
- [x] Crear archivo `src/lib/bulletin/design-system.ts`
- [x] Definir interface `DesignConfig` completa
- [x] Definir tipos para colores, tipografía, layout, componentes
- [x] Exportar tipos para uso en componentes

#### 2.2 Configuración Diseño Clásico
- [x] Crear constante `CLASSIC_DESIGN: DesignConfig`
- [x] Definir layout: maxWidth 1024px, padding 48px, spacing 60px
- [x] Definir typography: Coco Gothic, Open Sans, tamaños 42-44px
- [x] Definir colores: #004aad, #1a62ff, #c9c9c9, #ffffff, #000000
- [x] Definir components: números ON, imágenes ON, subrayados ON, separadores ON

#### 2.3 Configuración Diseño Moderno
- [x] Crear constante `MODERN_DESIGN: DesignConfig`
- [x] Definir layout: maxWidth 1200px, padding 24px, spacing 48px
- [x] Definir typography: Inter, tamaños 16-48px
- [x] Definir colores: mismos brand + grises modernos (#e5e7eb, #1f2937)
- [x] Definir components: números OFF, imágenes ON (lado), cards ON, rounded ON

#### 2.4 Función Helper
- [x] Crear función `getDesignConfig(version: 'classic' | 'modern'): DesignConfig`
- [x] Implementar lógica de switch para retornar config apropiada
- [x] Agregar validación y manejo de errores
- [x] Exportar función

#### 2.5 Constantes de Colores
- [x] Crear objeto `BRAND_COLORS` con paleta corporativa
- [x] Exportar para uso en Tailwind config si es necesario
- [x] Documentar uso de colores con comentarios

**Checkpoint**: `design-system.ts` debe compilar sin errores, configs deben ser completas y tipadas.

---

## 🔄 Fase 3: Componente Design Switcher

**Objetivo**: Crear el toggle para cambiar entre diseños

**Tiempo estimado**: 30-45 minutos

### Tareas

#### 3.1 Crear Componente Base
- [x] Crear archivo `src/components/bulletin/design-switcher.tsx`
- [x] Definir interface `DesignSwitcherProps` con props requeridas
- [x] Crear estructura del componente con useState

#### 3.2 Implementar Toggle
- [x] Usar shadcn/ui `Switch` o crear botones custom
- [x] Agregar labels: "Diseño Clásico" y "Diseño Moderno"
- [x] Implementar onChange handler que llame a `onDesignChange`
- [x] Agregar loading state durante transición

#### 3.3 Preview Miniatura
- [x] Crear miniaturas SVG o imágenes de preview de cada diseño
- [x] Mostrar preview al lado de cada opción
- [x] Agregar hover effects

#### 3.4 Persistencia
- [x] Implementar lectura de localStorage al montar componente
- [x] Guardar preferencia en localStorage al cambiar
- [x] Key: `bulletin-design-preference`

#### 3.5 Estilos y Accesibilidad
- [x] Agregar estilos con Tailwind CSS
- [x] Asegurar que sea accesible con teclado
- [x] Agregar tooltips explicativos
- [x] Hacer responsive (mobile: stack vertical)

**Checkpoint**: Switcher debe funcionar, guardar preferencia, y ser visualmente atractivo.

---

## 📰 Fase 4: Layout Clásico

**Objetivo**: Replicar exactamente el diseño HTML clásico proporcionado

**Tiempo estimado**: 1.5-2 horas

### Tareas

#### 4.1 Crear Componente Base
- [x] Crear archivo `src/components/bulletin/classic-bulletin-layout.tsx`
- [x] Definir interface `ClassicBulletinLayoutProps`
- [x] Importar diseño desde `design-system.ts`

#### 4.2 Implementar Header
- [x] Crear sección de header con imagen de fondo decorativa
- [x] Agregar título "RESUMEN DIARIO DE NOTICIAS" centrado
- [x] Usar Canva Sans Bold, tamaño 44px
- [x] Agregar fecha debajo del título con formato español
- [x] Implementar función de formato: "Martes 11 de Noviembre de 2025"

#### 4.3 Implementar Secciones de Categorías
- [x] Crear componente de separador horizontal gris (#c9c9c9)
- [x] Iterar sobre las 6 categorías
- [x] Para cada categoría:
  - [x] Número y nombre subrayado (ej: "1. Economía")
  - [x] Título de noticia principal en azul #004aad, 42px, bold
  - [x] Imagen centrada (max 450px width)
  - [x] Texto del resumen justificado, 37px
  - [x] Link "Leer más" en azul #1a62ff con underline

#### 4.4 Implementar Footer
- [x] Agregar separador final
- [x] Agregar imagen decorativa de footer
- [x] Agregar logo corporativo centrado
- [x] Agregar padding y spacing apropiados

#### 4.5 CSS Específico
- [x] Crear archivo `src/styles/classic-bulletin.css` si es necesario
- [x] Implementar clases: `.classic-bulletin`, `.classic-header`, `.classic-title`, etc.
- [x] Usar estilos inline o Tailwind para replicar exactamente el HTML
- [x] Asegurar text-align: justify en párrafos
- [x] Agregar line-height apropiado (1.4-1.5)

#### 4.6 Responsive
- [x] Ajustar para tablets (reducir font sizes)
- [x] Ajustar para mobile (stack vertical, imágenes 100% width)
- [x] Testear en diferentes tamaños de pantalla

**Checkpoint**: Layout clásico debe verse idéntico al HTML proporcionado en desktop.

---

## 🌐 Fase 5: Layout Moderno

**Objetivo**: Crear diseño web moderno y responsive

**Tiempo estimado**: 1.5-2 horas

### Tareas

#### 5.1 Crear Componente Base
- [x] Crear archivo `src/components/bulletin/modern-bulletin-layout.tsx`
- [x] Definir interface `ModernBulletinLayoutProps`
- [x] Importar diseño moderno desde `design-system.ts`

#### 5.2 Implementar Header Moderno
- [x] Crear header con gradiente: `linear-gradient(135deg, #004aad 0%, #1a62ff 100%)`
- [x] Agregar título centrado en blanco, 48px, bold
- [x] Agregar fecha en blanco con opacity 0.9, 14px
- [x] Border-radius de 16px
- [x] Padding de 48px vertical, 24px horizontal

#### 5.3 Sistema de Navegación de Categorías
- [x] Crear barra de badges/tabs de categorías
- [x] Usar flexbox con gap de 12px
- [x] Cada badge: padding 8x16, border-radius 20px, background #f3f4f6
- [x] Badge activo: background #004aad, color blanco
- [x] Overflow-x: auto para mobile
- [x] Implementar onClick para filtrar categorías

#### 5.4 Grid de Noticias
- [x] Crear grid responsive:
  - Desktop: `grid-template-columns: 300px 1fr`
  - Mobile: `grid-template-columns: 1fr`
- [x] Gap de 24px entre items

#### 5.5 Cards de Noticias
- [x] Crear componente de card para cada noticia
- [x] Background blanco, border-radius 12px
- [x] Box-shadow: `0 1px 3px rgba(0,0,0,0.1)`
- [x] Padding de 24px
- [x] Hover: `transform: translateY(-2px)` y sombra más fuerte
- [x] Transition suave de 0.2s

#### 5.6 Layout de Imagen + Contenido
- [x] Imagen con border-radius a la izquierda o arriba
- [x] Título de 28px, color #004aad
- [x] Texto de 16px, color #1f2937
- [x] Badge de categoría arriba (sin número)

#### 5.7 Animaciones
- [x] Fade-in al cargar
- [x] Hover effects en cards y botones
- [x] Smooth scroll si hay navegación interna

**Checkpoint**: Layout moderno debe ser visualmente atractivo, responsive, y con interacciones suaves.

---

## 🧩 Fase 6: Renderer Principal y Componentes Auxiliares

**Objetivo**: Crear el componente que decide qué layout usar y componentes reutilizables

**Tiempo estimado**: 1 hora

### Tareas

#### 6.1 Bulletin Renderer
- [x] Crear archivo `src/components/bulletin/bulletin-renderer.tsx`
- [x] Definir interface `BulletinRendererProps` con props: `bulletin`, `design`, `editable`
- [x] Implementar lógica de switch para renderizar layout apropiado
- [x] Pasar props necesarias a cada layout
- [x] Agregar fallback si design no es reconocido

#### 6.2 Componente Status Badge
- [x] Crear archivo `src/components/bulletin/status-badge.tsx`
- [x] Definir interface `StatusBadgeProps`
- [x] Mapear cada status a color:
  - draft: gray
  - scraping/classifying/summarizing: blue + spinner
  - ready: green
  - video_processing: purple + spinner
  - published: emerald
  - failed: red
- [x] Usar shadcn/ui Badge component
- [x] Agregar variants custom si es necesario
- [x] Agregar spinner de lucide-react para estados loading

#### 6.3 Componente Category Section
- [x] Crear archivo `src/components/bulletin/category-section.tsx`
- [x] Definir interface `CategorySectionProps`
- [x] Implementar icono por categoría (lucide-react):
  - Economía: DollarSign
  - Política: Landmark
  - Sociedad: Users
  - Seguridad: Shield
  - Internacional: Globe
  - Vial: Car
- [x] Mostrar título, icono, contenido, contador de palabras
- [x] Si `editable`, agregar botones "Editar" y "Regenerar"
- [x] Implementar modo edición con textarea inline

#### 6.4 Componente News Preview
- [x] Crear archivo `src/components/bulletin/news-preview.tsx`
- [x] Definir interface `NewsPreviewProps`
- [x] Mostrar título, snippet de contenido (primeras 150 chars)
- [x] Agregar badge de fuente (Primicias / La Hora)
- [x] Link a URL original (target="_blank")
- [x] Botón "Ver más" que abre modal con contenido completo

#### 6.5 Componente Generate Button
- [x] Crear archivo `src/components/bulletin/generate-button.tsx`
- [x] Definir interface `GenerateButtonProps`
- [x] Implementar estados: idle, loading, success, error
- [x] Mostrar progress steps durante generación:
  1. Scraping noticias... ✓
  2. Clasificando... ✓
  3. Generando resúmenes... ⏳
  4. Preparando video... ⏱️
- [x] Progress bar visual con porcentaje
- [x] Deshabilitado durante proceso
- [x] Toast notifications (usar shadcn/ui toast)
- [x] Error handling con botón "Reintentar"

#### 6.6 Componente Bulletin Card
- [x] Crear archivo `src/components/bulletin/bulletin-card.tsx`
- [x] Definir interface `BulletinCardProps`
- [x] Usar shadcn/ui Card component
- [x] Mostrar fecha grande (formato español: "Miércoles 12 de Noviembre")
- [x] Status badge con `<StatusBadge>`
- [x] Número total de noticias con icono
- [x] Status de video con icono + estado
- [x] Mini preview de categorías (6 iconos pequeños, colored si tiene contenido)
- [x] Timestamp de creación (relativo: "hace 2 horas")
- [x] Hover: elevación con shadow
- [x] onClick: navegar a `/dashboard/bulletin/[id]`

**Checkpoint**: Todos los componentes deben estar tipados, funcionales, y visualmente consistentes.

---

## 🗄️ Fase 7: Schema de Base de Datos

**Objetivo**: Extender el schema con las 5 nuevas tablas

**Tiempo estimado**: 45 minutos

### Tareas

#### 7.1 Extender Schema
- [x] Abrir archivo `src/lib/schema.ts`
- [x] Importar tipos necesarios de drizzle-orm/pg-core

#### 7.2 Tabla `bulletins`
- [x] Definir tabla con pgTable
- [x] Agregar campos:
  - id: uuid, primaryKey, defaultRandom
  - date: timestamp, notNull, defaultNow
  - status: text, notNull, default 'draft'
  - rawNews: jsonb
  - classifiedNews: jsonb
  - economia: text
  - politica: text
  - sociedad: text
  - seguridad: text
  - internacional: text
  - vial: text
  - totalNews: integer, default 0
  - videoUrl: text
  - videoStatus: text, default 'pending'
  - videoMetadata: jsonb
  - errorLog: jsonb
  - designVersion: text, default 'classic'
  - logoUrl: text
  - headerImageUrl: text
  - footerImageUrl: text
  - brandColors: jsonb
  - createdAt: timestamp, defaultNow
  - publishedAt: timestamp

#### 7.3 Tabla `news_sources`
- [x] Definir tabla con pgTable
- [x] Agregar campos:
  - id: uuid, primaryKey, defaultRandom
  - name: text, notNull
  - url: text, notNull
  - baseUrl: text, notNull
  - selector: text
  - scrapeConfig: jsonb
  - isActive: boolean, default true
  - lastScraped: timestamp
  - lastScrapedStatus: text
  - totalScraped: integer, default 0
  - createdAt: timestamp, defaultNow
  - updatedAt: timestamp, defaultNow

#### 7.4 Tabla `bulletin_templates`
- [x] Definir tabla con pgTable
- [x] Agregar campos:
  - id: uuid, primaryKey, defaultRandom
  - name: text, notNull
  - category: text, notNull
  - systemPrompt: text, notNull
  - userPromptTemplate: text, notNull
  - exampleOutput: text
  - maxWords: integer, default 50
  - tone: text, default 'profesional'
  - isActive: boolean, default true
  - version: integer, default 1
  - createdAt: timestamp, defaultNow
  - updatedAt: timestamp, defaultNow

#### 7.5 Tabla `bulletin_logs`
- [x] Definir tabla con pgTable
- [x] Agregar campos:
  - id: uuid, primaryKey, defaultRandom
  - bulletinId: uuid, references bulletins.id, onDelete cascade
  - step: text, notNull
  - status: text, notNull
  - message: text
  - metadata: jsonb
  - duration: integer
  - createdAt: timestamp, defaultNow

#### 7.6 Tabla `bulletin_designs`
- [x] Definir tabla con pgTable
- [x] Agregar campos:
  - id: uuid, primaryKey, defaultRandom
  - name: text, notNull
  - displayName: text, notNull
  - description: text
  - isActive: boolean, default true
  - cssTemplate: text
  - layoutConfig: jsonb
  - createdAt: timestamp, defaultNow
  - updatedAt: timestamp, defaultNow

#### 7.7 Exportar Tipos TypeScript
- [x] Exportar tipos inferidos: `export type Bulletin = typeof bulletins.$inferSelect`
- [x] Exportar para todas las tablas
- [x] Exportar tipos para inserts: `typeof bulletins.$inferInsert`

#### 7.8 Generar y Aplicar Migraciones
- [x] Ejecutar `pnpm run db:generate`
- [x] Revisar el archivo de migración generado
- [x] Ejecutar `pnpm run db:migrate`
- [x] Verificar que las tablas se crearon: `pnpm run db:studio`

**Checkpoint**: Todas las tablas deben existir en la BD, sin errores de migración.

---

## 📂 Fase 8: Queries de Base de Datos

**Objetivo**: Crear funciones helper para interactuar con la BD

**Tiempo estimado**: 1 hora

### Tareas

#### 8.1 Crear Estructura de Carpetas
- [x] Crear carpeta `src/lib/db/queries/`

#### 8.2 Queries de Bulletins
- [x] Crear archivo `src/lib/db/queries/bulletins.ts`
- [x] Implementar `createBulletin()`: crear boletín con status 'draft'
- [x] Implementar `getBulletinById(id)`: obtener boletín completo
- [x] Implementar `getAllBulletins(options)`: lista con filtros, paginación, ordenamiento
- [x] Implementar `updateBulletinStatus(id, status)`: actualizar solo status
- [x] Implementar `updateBulletinRawNews(id, rawNews, totalNews)`: actualizar noticias raw
- [x] Implementar `updateBulletinClassification(id, classifiedNews)`: actualizar clasificación
- [x] Implementar `updateBulletinSummaries(id, summaries)`: actualizar los 6 resúmenes
- [x] Implementar `updateBulletinVideo(id, videoData)`: actualizar info de video
- [x] Implementar `getBulletinsByDateRange(startDate, endDate)`: rango de fechas
- [x] Implementar `getTodayBulletin()`: boletín de hoy si existe
- [x] Implementar `getLatestBulletin()`: más reciente
- [x] Todas las funciones con try-catch y manejo de errores
- [x] Agregar comentarios JSDoc

#### 8.3 Logs de Bulletins
- [x] En `bulletins.ts` agregar `createBulletinLog(bulletinId, step, status, message, metadata)`
- [x] Implementar `getBulletinLogs(bulletinId)`: obtener logs ordenados por fecha
- [x] Calcular duración si startTime está en metadata

#### 8.4 Queries de Sources
- [x] Crear archivo `src/lib/db/queries/sources.ts`
- [x] Implementar `getActiveSources()`: todas las fuentes activas
- [x] Implementar `getSourceByName(name)`: obtener por nombre
- [x] Implementar `updateSourceLastScraped(id, status)`: actualizar última vez scrapeada
- [x] Implementar `createSource(data)`: crear nueva fuente
- [x] Implementar `updateSource(id, data)`: actualizar fuente

#### 8.5 Queries de Templates
- [x] Crear archivo `src/lib/db/queries/templates.ts`
- [x] Implementar `getActiveTemplates()`: todos los templates activos
- [x] Implementar `getTemplateByCategory(category)`: template de categoría específica
- [x] Implementar `createTemplate(data)`: crear nuevo template
- [x] Implementar `updateTemplate(id, data)`: actualizar template
- [x] Implementar `getTemplateHistory(category)`: historial de versiones

#### 8.6 Testing Manual
- [x] Testear cada query en un archivo de prueba temporal
- [x] Verificar que los datos se insertan/actualizan correctamente
- [x] Verificar que las relaciones FK funcionan
- [x] Verificar que los defaults se aplican

**Checkpoint**: Todas las queries deben funcionar sin errores y retornar datos esperados.

---

## 📄 Fase 9: Páginas del Dashboard

**Objetivo**: Crear las interfaces de usuario para gestionar boletines

**Tiempo estimado**: 2 horas

### Tareas

#### 9.1 Página Lista de Boletines
- [x] Crear archivo `src/app/dashboard/bulletin/page.tsx`
- [x] Crear Server Component que carga boletines iniciales
- [x] Implementar header con título "Boletines Diarios"
- [x] Agregar botón "Generar Nuevo Boletín"
- [x] Verificar si hay boletín de hoy en proceso (deshabilitar botón si existe)
- [ ] Implementar filtros:
  - Date range picker (usar shadcn/ui calendar)
  - Multi-select de status
  - Botón "Limpiar filtros"
- [x] Usar componente `<BulletinList>` para mostrar lista
- [ ] Implementar paginación (shadcn/ui pagination)
- [x] Agregar empty state con ilustración y mensaje
- [x] Loading states con skeletons

#### 9.2 Componente Bulletin List
- [x] Crear archivo `src/app/dashboard/bulletin/components/bulletin-list.tsx`
- [x] Recibir array de bulletins y renderizar con `<BulletinCard>`
- [x] Grid responsive (3 cols desktop, 2 tablet, 1 mobile)
- [x] Manejar lista vacía

#### 9.3 Modal de Confirmación para Generar
- [ ] Usar shadcn/ui Dialog
- [ ] Mostrar resumen de la acción
- [ ] Botones "Cancelar" y "Generar Boletín"
- [ ] Al confirmar, llamar a `<GenerateButton>` con lógica

#### 9.4 Lógica de Generación
- [ ] Crear función async que:
  1. POST a `/api/news/scrape`
  2. Obtener bulletinId de respuesta
  3. POST a `/api/news/classify` con bulletinId
  4. POST a `/api/news/summarize` con bulletinId
  5. Actualizar UI con cada paso
- [ ] Usar toast para notificar éxito/error en cada paso
- [ ] Usar SWR o React Query para revalidar lista después

#### 9.5 Página Detalle de Boletín
- [x] Crear archivo `src/app/dashboard/bulletin/[id]/page.tsx`
- [x] Cargar boletín completo en Server Component
- [x] Handle 404 si no existe
- [x] Implementar header con fecha y status badge

#### 9.6 Tabs del Detalle
- [x] Usar shadcn/ui Tabs component
- [x] Crear 5 tabs: Resúmenes, Noticias Raw, Clasificadas, Logs, Video

**Tab 1: Resúmenes**
- [x] Mostrar `<DesignSwitcher>` arriba
- [x] Renderizar `<BulletinRenderer>` con diseño seleccionado
- [ ] Si `editable`, permitir edición inline de resúmenes
- [ ] Botón "Guardar cambios" que hace PATCH a `/api/bulletins/[id]`

**Tab 2: Noticias Raw**
- [x] Usar shadcn/ui Accordion
- [x] Un accordion item por fuente (Primicias, La Hora)
- [ ] Listar artículos con `<NewsPreview>`
- [ ] Modal para ver contenido completo

**Tab 3: Noticias Clasificadas**
- [x] Usar Accordion por categoría
- [x] Mostrar noticias asignadas a cada categoría
- [x] Count de noticias en el título del accordion

**Tab 4: Logs**
- [x] Crear timeline vertical
- [x] Para cada log mostrar:
  - Icono según status (check, spinner, x)
  - Nombre del step
  - Status con color
  - Timestamp
  - Duración si está disponible
  - Mensaje/error si hay

**Tab 5: Video**
- [x] Si videoUrl existe: mostrar video player
- [x] Si está en proceso: progress bar
- [ ] Si no generado: botón "Generar Video"
- [x] Mostrar preview del script en accordion

#### 9.7 Acciones del Boletín
- [x] Botón "Publicar" (solo si status es 'ready')
  - Cambiar status a 'published'
  - Actualizar publishedAt
- [x] Botón "Eliminar" con confirmación
  - DELETE a `/api/bulletins/[id]`
- [x] Botón "Exportar JSON"
  - Descargar JSON completo del boletín

**Checkpoint**: Navegación completa por la UI, todas las vistas funcionan, datos se cargan correctamente.

---

## ⚙️ Fase 10: Backend - Módulos de Lógica

**Objetivo**: Implementar la lógica de negocio del sistema

**Tiempo estimado**: 2-3 horas

### Tareas

#### 10.1 AI Providers
- [x] Crear archivo `src/lib/ai/providers.ts`
- [x] Importar `openrouter` de `@openrouter/ai-sdk-provider`
- [x] Crear función `getClaudeModel()`:
  - Modelo: 'anthropic/claude-sonnet-4-20250514'
  - Temperature: 0.3
  - Max tokens: 4000
- [x] Crear función `getGPTModel()` como backup (GPT-4 Turbo)
- [x] Implementar retry logic con exponential backoff (3 intentos)
- [x] Implementar error handling centralizado
- [x] Agregar timeout de 60 segundos

#### 10.2 Prompts de AI
- [x] Crear archivo `src/lib/ai/prompts.ts`
- [x] Definir `CLASSIFICATION_SYSTEM_PROMPT` con:
  - Rol: clasificador experto de noticias ecuatorianas
  - Descripción de las 6 categorías
  - Reglas de clasificación
- [x] Definir `CLASSIFICATION_USER_PROMPT_TEMPLATE` con:
  - Placeholder `{{NEWS_DATA}}`
  - Instrucciones para responder con JSON
  - Estructura esperada del JSON
- [x] Definir `SUMMARIZATION_SYSTEM_PROMPT` con:
  - Rol: editor profesional ecuatoriano
  - Estilo y tono
  - Formato de salida
- [x] Definir `SUMMARIZATION_USER_PROMPT_TEMPLATE` con:
  - Placeholders: `{{CATEGORY}}`, `{{CLASSIFIED_NEWS}}`, `{{MAX_WORDS}}`, `{{EXAMPLE_OUTPUT}}`
  - Instrucciones claras
- [x] Definir `VIDEO_SCRIPT_SYSTEM_PROMPT` (para fase futura)
- [x] Exportar todas las constantes
- [x] Agregar comentarios explicativos

#### 10.3 Scraper
- [x] Crear archivo `src/lib/news/scraper.ts`
- [x] Importar queries de sources
- [x] Implementar función `scrapeAllSources()`:
  - Obtener fuentes activas con `getActiveSources()`
  - Para cada fuente, llamar a `scrapeSource(source)`
  - Agregar resultados a arrays por fuente
  - Retornar estructura: `{ primicias: [], laHora: [], metadata: {} }`
- [x] Implementar función `scrapeSource(source)`:
  - POST a Firecrawl API con config de la fuente
  - Headers: Authorization con FIRECRAWL_API_KEY
  - Body: { url, formats, onlyMainContent, waitFor, removeBase64Images }
  - Timeout de 30 segundos
  - Retry 3 veces con delays de 2s, 4s, 8s
- [x] Implementar función `parseFirecrawlResponse(response, sourceName)`:
  - Extraer markdown/html
  - Parsear contenido con regex para encontrar artículos
  - Identificar títulos (h1, h2, h3 tags)
  - Separar en artículos individuales
  - Extraer URLs completas (baseUrl + path)
  - Retornar array de artículos
- [x] Implementar función `validateArticle(article)`:
  - Verificar título min 10 chars
  - Verificar contenido min 50 chars
  - Verificar URL válida
  - Retornar boolean
- [x] Manejar errores: log detallado, continuar si una fuente falla
- [x] Actualizar `lastScraped` de cada fuente con `updateSourceLastScraped()`

#### 10.4 Clasificador
- [x] Crear archivo `src/lib/news/classifier.ts`
- [x] Importar `generateText` de 'ai'
- [x] Importar prompts y providers
- [x] Implementar función `classifyNews(rawNews, bulletinId)`:
  - Crear log de inicio con `createBulletinLog()`
  - Preparar prompt reemplazando `{{NEWS_DATA}}` con JSON.stringify(rawNews)
  - Llamar a `generateText()` con Claude model, system y user prompt
  - Parsear respuesta con `extractJSONFromResponse()`
  - Validar con `validateClassification()`
  - Si válido: actualizar bulletin con `updateBulletinClassification()`
  - Crear log de completado
  - Retornar clasificación
  - En catch: log de error, actualizar status a 'failed'
- [x] Implementar función `extractJSONFromResponse(text)`:
  - Buscar JSON entre ```json y ```
  - Si no, buscar entre { y }
  - Parsear con JSON.parse()
  - Si falla, usar regex para extraer
  - Retornar objeto o throw error
- [x] Implementar función `validateClassification(classified)`:
  - Verificar que tenga 6 propiedades
  - Verificar que cada una sea array
  - Verificar estructura de elementos
  - Retornar { valid: boolean, errors: string[] }

#### 10.5 Summarizer
- [x] Crear archivo `src/lib/news/summarizer.ts`
- [x] Importar generateText, prompts, providers, queries
- [x] Implementar función `summarizeByCategory(classifiedNews, bulletinId)`:
  - Crear log de inicio
  - Obtener templates activos con `getActiveTemplates()`
  - Crear objeto `summaries` vacío
  - Para cada categoría:
    - Obtener noticias de `classifiedNews[categoria]`
    - Si vacío: asignar "No hay información disponible..."
    - Si hay noticias:
      - Obtener template con `getTemplateByCategory(categoria)`
      - Preparar prompt reemplazando placeholders
      - Llamar a generateText con Claude
      - Validar resumen con `validateSummary()`
      - Asignar a `summaries[categoria]`
  - Actualizar bulletin con `updateBulletinSummaries()`
  - Crear log de completado
  - Retornar summaries
- [x] Implementar función `validateSummary(summary, maxWords)`:
  - Contar palabras: `summary.split(/\s+/).length`
  - Verificar que no exceda maxWords + 10%
  - Verificar min 20 palabras
  - Retornar { valid: boolean, wordCount: number, error?: string }
- [x] Implementar función `formatCategoryName(category)`:
  - Mapear a nombres bonitos: 'economia' → 'Economía', etc.
- [x] Manejar errores por categoría (continuar si una falla)

#### 10.6 Video Generator (Placeholder)
- [ ] Crear archivo `src/lib/news/video-generator.ts`
- [ ] Implementar función `prepareVideoScript(bulletin)`:
  - Generar intro con `generateIntro(bulletin.date)`
  - Para cada categoría, crear sección:
    - { category, title, content, duration }
  - Generar outro con `generateOutro()`
  - Calcular duración total
  - Retornar objeto script completo
- [ ] Implementar función `generateIntro(date)`:
  - Formato: "Buenos días, hoy es [fecha], y este es tu resumen de noticias del día."
  - Formatear fecha en español
- [ ] Implementar función `generateOutro()`:
  - Texto: "Esto es todo por hoy. Gracias por tu atención y que tengas un excelente día."
- [ ] Implementar función `estimateDuration(text)`:
  - Contar palabras
  - Fórmula: (palabras / 150) * 60 = segundos
  - Agregar 2 segundos por pausa entre secciones
  - Retornar duración en segundos
- [ ] Implementar función `generateVideoWithAPI(script, bulletinId)` como stub:
  - Comentarios indicando integración futura con ElevenLabs, Synthesia
  - Retornar Promise con objeto mock: `{ status: 'pending', message: '...', scriptPrepared: true }`

**Checkpoint**: Toda la lógica de negocio debe compilar, las funciones deben estar bien tipadas y documentadas.

---

## 🔌 Fase 11: API Routes

**Objetivo**: Crear los endpoints HTTP para el sistema

**Tiempo estimado**: 2-3 horas

### Tareas

#### 11.1 Endpoint de Scraping
- [x] Crear archivo `src/app/api/news/scrape/route.ts`
- [x] Exportar función `POST`
- [x] Validar autenticación con Better Auth
- [x] Validar body con Zod (opcional: array de sources)
- [x] Verificar si ya existe boletín de hoy con `getTodayBulletin()`
- [x] Si existe y está en proceso, retornar error 409
- [x] Crear nuevo bulletin con `createBulletin()`, status 'scraping'
- [x] Llamar a `scrapeAllSources()`
- [x] Actualizar bulletin con `updateBulletinRawNews()`
- [x] Actualizar status a 'draft'
- [x] Retornar response: `{ success, bulletinId, totalNews, sources }`
- [x] Catch errores, actualizar status a 'failed', retornar 500

#### 11.2 Endpoint de Clasificación
- [x] Crear archivo `src/app/api/news/classify/route.ts`
- [x] Exportar función `POST`
- [x] Validar autenticación
- [x] Validar body con Zod: `{ bulletinId: string }`
- [x] Obtener bulletin con `getBulletinById()`
- [x] Verificar que exista (404 si no)
- [x] Verificar que tenga rawNews (400 si no)
- [x] Actualizar status a 'classifying'
- [x] Llamar a `classifyNews(bulletin.rawNews, bulletinId)`
- [x] Si exitoso, actualizar status a 'classified'
- [x] Retornar response: `{ success, bulletinId, classified, totalClassified, breakdown }`
- [x] Catch errores, retornar apropiadamente

#### 11.3 Endpoint de Resúmenes
- [x] Crear archivo `src/app/api/news/summarize/route.ts`
- [x] Exportar función `POST`
- [x] Validar autenticación
- [x] Validar body: `{ bulletinId: string, streaming?: boolean }`
- [x] Obtener bulletin y verificar que tenga classifiedNews
- [x] Actualizar status a 'summarizing'
- [x] Si `streaming === false`:
  - Llamar a `summarizeByCategory()`
  - Actualizar status a 'ready'
  - Retornar JSON: `{ success, bulletinId, summaries }`
- [ ] Si `streaming === true`:
  - Implementar con `streamText()` (fase futura)
  - Retornar ReadableStream con SSE
- [x] Catch errores

#### 11.4 Endpoint de Video
- [ ] Crear archivo `src/app/api/news/generate-video/route.ts`
- [ ] Exportar función `POST`
- [ ] Validar autenticación
- [ ] Validar body: `{ bulletinId: string }`
- [ ] Obtener bulletin completo con summaries
- [ ] Verificar que status sea 'ready'
- [ ] Actualizar videoStatus a 'processing'
- [ ] Llamar a `prepareVideoScript(bulletin)`
- [ ] Guardar script en metadata
- [ ] Llamar a `generateVideoWithAPI()` (mock por ahora)
- [ ] Retornar: `{ success, bulletinId, videoStatus, script, message }`

#### 11.5 Endpoint Cron
- [x] Crear archivo `src/app/api/cron/daily-bulletin/route.ts`
- [x] Exportar función `GET`
- [x] Verificar header `Authorization: Bearer ${CRON_SECRET}`
- [x] Si no válido, retornar 401 Unauthorized
- [x] Verificar si ya hay boletín de hoy, si existe retornar early
- [x] Ejecutar pipeline completo:
  1. Fetch interno a `/api/news/scrape`
  2. Extraer bulletinId de respuesta
  3. Fetch interno a `/api/news/classify` con bulletinId
  4. Fetch interno a `/api/news/summarize` con bulletinId
  5. Fetch interno a `/api/news/generate-video` con bulletinId (omitido - fase futura)
- [x] Usar `fetch` con `${process.env.NEXT_PUBLIC_URL}/api/...`
- [x] Medir duración de cada paso
- [x] Retornar resultado: `{ success, bulletinId, executedAt, pipeline: {...} }`
- [x] Catch errores, log detallado, retornar qué funcionó y qué falló

#### 11.6 CRUD de Bulletins
- [x] Crear archivo `src/app/api/bulletins/route.ts`
- [x] Exportar función `GET`:
  - Validar autenticación
  - Parsear query params: page, limit, status, dateRange
  - Llamar a `getAllBulletins(options)`
  - Retornar lista paginada con metadata
- [x] Crear archivo `src/app/api/bulletins/[id]/route.ts`
- [x] Exportar función `GET`:
  - Validar autenticación
  - Obtener con `getBulletinById()`
  - Retornar bulletin completo
- [x] Exportar función `PATCH`:
  - Validar autenticación
  - Validar body con Zod (permitir actualizar summaries, designVersion)
  - Actualizar campos apropiados
  - Retornar bulletin actualizado
- [x] Exportar función `DELETE`:
  - Validar autenticación
  - Verificar que bulletin no esté en 'published' (opcional)
  - Eliminar de BD
  - Retornar success

**Checkpoint**: Todos los endpoints deben responder correctamente, validar inputs, manejar errores.

---

## 🌱 Fase 12: Seed Data

**Objetivo**: Poblar la BD con datos iniciales

**Tiempo estimado**: 30-45 minutos

### Tareas

#### 12.1 Crear Script de Seed
- [x] Crear archivo `src/lib/db/seed.ts`
- [x] Importar `db` y todos los schemas
- [x] Importar funciones de queries

#### 12.2 Seed de Fuentes
- [x] Definir array `sources` con 5 objetos:
  - Primicias: url, baseUrl, scrapeConfig
  - La Hora: url, baseUrl, scrapeConfig
  - El Comercio: url, baseUrl, scrapeConfig
  - Teleamazonas: url, baseUrl, scrapeConfig
  - ECU911: url, baseUrl, scrapeConfig
- [x] Verificar si ya existen con `getSourceByName()`
- [x] Si no existen, insertar con `createSource()`
- [x] Log cada inserción

#### 12.3 Seed de Templates
- [x] Definir array `templates` con 6 objetos (uno por categoría)
- [x] Para cada uno incluir:
  - name, category
  - systemPrompt: copiar de SUMMARIZATION_SYSTEM_PROMPT
  - userPromptTemplate: copiar de SUMMARIZATION_USER_PROMPT_TEMPLATE
  - exampleOutput: escribir ejemplo real para cada categoría
  - maxWords: 150
  - tone: 'profesional'
- [x] Verificar si ya existen
- [x] Insertar con `createTemplate()`

#### 12.4 Seed de Diseños
- [x] Definir array `designs` con 2 objetos:
  - Classic: name, displayName, description, layoutConfig
  - Modern: name, displayName, description, layoutConfig
- [x] Verificar si ya existen
- [x] Insertar en tabla `bulletin_designs`

#### 12.5 Hacer Idempotente
- [x] Wrappear todo en try-catch
- [x] Usar transacciones si es posible
- [x] Permitir ejecutar múltiples veces sin duplicar
- [x] Log de success/error claro

#### 12.6 Ejecutar Seed
- [x] Agregar script a `package.json`: `"db:seed": "tsx src/lib/db/seed.ts"`
- [x] Ejecutar: `pnpm run db:seed`
- [x] Verificar en Drizzle Studio que los datos se insertaron

**Checkpoint**: La BD debe tener fuentes, templates y diseños listos para usar.

---

## 🚀 Fase 13: Testing del Pipeline Completo

**Objetivo**: Probar que todo funciona end-to-end

**Tiempo estimado**: 1 hora

### Tareas

#### 13.1 Testing Local Manual
- [x] Iniciar dev server: `pnpm run dev`
- [x] Abrir Drizzle Studio: `pnpm run db:studio`
- [x] Navegar a `/dashboard/bulletin`

#### 13.2 Test de Scraping
- [x] Click en "Generar Nuevo Boletín"
- [x] Verificar en Studio que se creó bulletin con status 'scraping'
- [x] Verificar que después cambie a 'draft'
- [x] Verificar que `rawNews` tenga datos
- [x] Verificar logs en tabla `bulletin_logs`

#### 13.3 Test de Clasificación
- [x] Desde la UI, trigger clasificación (o llamar endpoint directamente)
- [x] Verificar status cambie a 'classifying' → 'classified'
- [x] Verificar que `classifiedNews` tenga las 6 categorías
- [x] Verificar que cada categoría tenga noticias asignadas

#### 13.4 Test de Resúmenes
- [x] Trigger generación de resúmenes
- [x] Verificar status cambie a 'summarizing' → 'ready'
- [x] Verificar que los 6 campos de resumen tengan texto
- [x] Verificar que cumplan límite de palabras (≤ 150)
- [x] Leer los resúmenes y evaluar calidad

#### 13.5 Test de Diseños
- [x] Navegar a `/dashboard/bulletin/[id]`
- [x] Ir a tab "Resúmenes"
- [x] Usar switcher para cambiar entre Clásico y Moderno
- [x] Verificar que ambos diseños se rendericen correctamente
- [x] Verificar que la preferencia se guarde en localStorage
- [x] Testear en diferentes tamaños de pantalla

#### 13.6 Test de Video (Mock)
- [ ] Trigger generación de video (fase futura)
- [ ] Verificar que se prepare el script
- [ ] Verificar que videoStatus sea 'pending'

#### 13.7 Test de Cron Manual
- [x] Ejecutar:
  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/daily-bulletin
  ```
- [x] Verificar que se ejecute todo el pipeline automáticamente
- [x] Verificar que retorne resultado con duración de cada fase

#### 13.8 Test de Edición
- [x] En tab Resúmenes, editar un resumen (funcionalidad existe vía PATCH endpoint)
- [x] Guardar cambios
- [x] Verificar que se actualice en BD
- [x] Recargar página y verificar que cambio persiste

#### 13.9 Test de Errores
- [x] Intentar generar boletín sin API keys configuradas
- [x] Verificar que se manejen errores gracefully
- [x] Verificar logs de error en BD

**Checkpoint**: El sistema debe funcionar end-to-end sin errores críticos.

---

## 🔧 Fase 14: Configuración de Producción

**Objetivo**: Preparar el proyecto para deployment en Vercel

**Tiempo estimado**: 30-45 minutos

### Tareas

#### 14.1 Configurar Vercel Cron
- [ ] Crear archivo `vercel.json` en raíz
- [ ] Agregar configuración:
  ```json
  {
    "crons": [{
      "path": "/api/cron/daily-bulletin",
      "schedule": "0 6 * * *"
    }]
  }
  ```
- [ ] Commit y push

#### 14.2 Variables de Entorno en Vercel
- [ ] Ir a dashboard de Vercel
- [ ] Settings → Environment Variables
- [ ] Agregar todas las vars de `.env`:
  - POSTGRES_URL (usar Vercel Postgres o external)
  - BETTER_AUTH_SECRET
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - OPENROUTER_API_KEY
  - FIRECRAWL_API_KEY
  - CRON_SECRET (generar nuevo con `openssl rand -base64 32`)
  - NEXT_PUBLIC_APP_URL (URL de producción)
  - NEXT_PUBLIC_URL (URL de producción)
- [ ] Guardar y redeploy

#### 14.3 Configurar Google OAuth para Producción
- [ ] Ir a Google Cloud Console
- [ ] Agregar URL de producción a "Authorized redirect URIs"
- [ ] Formato: `https://tu-dominio.vercel.app/api/auth/callback/google`

#### 14.4 Configurar Base de Datos en Producción
- [ ] Opción A: Usar Vercel Postgres
  - Crear storage → Postgres
  - Copiar POSTGRES_URL
- [ ] Opción B: Usar external (Supabase, Neon, etc.)
- [ ] Ejecutar migraciones en producción: `pnpm run db:migrate` (con conexión a prod)
- [ ] Ejecutar seed: `pnpm run db:seed` (con conexión a prod)

#### 14.5 Build y Deploy
- [ ] Push código a GitHub
- [ ] Vercel auto-deploya desde main branch
- [ ] Verificar que build sea exitoso
- [ ] Verificar que no haya errores en función logs

#### 14.6 Verificar Cron en Producción
- [ ] Esperar a las 6am o usar "Run now" en Vercel Cron settings
- [ ] Verificar en logs que se ejecutó
- [ ] Verificar en BD que se creó bulletin
- [ ] Verificar que todo el pipeline se completó

#### 14.7 Monitoreo
- [ ] Configurar alertas en Vercel para errores
- [ ] Configurar logs para debugging
- [ ] Verificar que los costos de APIs estén bajo control

**Checkpoint**: El sistema debe estar deployado, el cron debe ejecutarse diariamente, todo debe funcionar en producción.

---

## 📚 Fase 15: Documentación

**Objetivo**: Documentar el sistema para futuros desarrolladores y usuarios

**Tiempo estimado**: 30-45 minutos

### Tareas

#### 15.1 README Principal
- [ ] Actualizar `README.md` con:
  - Descripción del sistema de boletines
  - Link a documentación detallada
  - Quick start guide
  - Créditos

#### 15.2 Documentación Técnica
- [ ] Crear archivo `docs/bulletin-system.md`
- [ ] Secciones:
  - Arquitectura general (diagrama de flujo)
  - Descripción de cada componente
  - Explicación del pipeline
  - Diagrama de BD
  - Descripción de módulos de lógica

#### 15.3 Guía de Configuración
- [ ] En `docs/bulletin-system.md` agregar:
  - Lista de variables de entorno requeridas
  - Cómo obtener cada API key paso a paso
  - Setup de la base de datos
  - Cómo ejecutar el seed

#### 15.4 Guía de Uso
- [ ] Agregar sección:
  - Cómo generar un boletín manualmente
  - Cómo editar resúmenes
  - Cómo cambiar entre diseños
  - Cómo regenerar categorías específicas
  - Cómo configurar el cron job

#### 15.5 Personalización
- [ ] Documentar:
  - Cómo agregar nuevas fuentes de noticias
  - Cómo modificar prompts de AI
  - Cómo ajustar límites de palabras
  - Cómo personalizar diseños (colores, fuentes)

#### 15.6 Troubleshooting
- [ ] Crear sección de problemas comunes:
  - "El scraping falla" → verificar Firecrawl API key
  - "La clasificación no funciona" → verificar OpenRouter API key
  - "Los resúmenes son muy largos" → ajustar maxWords en template
  - "El cron no se ejecuta" → verificar CRON_SECRET
  - "Errores de tipo" → ejecutar typecheck

#### 15.7 API Reference
- [ ] Documentar cada endpoint:
  - Método HTTP
  - URL
  - Headers requeridos
  - Body schema
  - Response schema
  - Códigos de error
  - Ejemplos con curl

#### 15.8 Roadmap Futuro
- [ ] Agregar sección con features planeadas:
  - Integración completa de video (ElevenLabs + Synthesia)
  - Analytics de boletines
  - A/B testing de formatos
  - Distribución automática (email, WhatsApp)
  - Más fuentes de noticias
  - Soporte multi-idioma

**Checkpoint**: La documentación debe ser clara, completa y fácil de seguir para nuevos desarrolladores.

---

## ✅ Criterios de Aceptación Final

El proyecto estará completo cuando:

- [ ] El sistema genera automáticamente un boletín diario a las 6am
- [ ] El scraping obtiene noticias de Primicias y La Hora exitosamente
- [ ] La clasificación asigna noticias a las 6 categorías correctamente
- [ ] Los resúmenes cumplen con el límite de 50 palabras y son de calidad
- [ ] Ambos diseños (Clásico y Moderno) se renderizan correctamente
- [ ] El cambio entre diseños funciona con un clic y persiste la preferencia
- [ ] El pipeline completo se ejecuta en menos de 30 minutos
- [ ] El sistema maneja errores gracefully y continúa con pasos parciales
- [ ] La UI es intuitiva, responsive y tiene loading states apropiados
- [ ] Los logs permiten debugging efectivo de cada paso del proceso
- [ ] La documentación es completa y clara
- [ ] El código pasa lint y typecheck sin errores
- [ ] El sistema está deployado en producción y funcionando

---

## 📊 Resumen de Progreso

### Fases Completadas: 0/15

- [ ] Fase 1: Foundation & Setup
- [ ] Fase 2: Sistema de Diseño Dual
- [ ] Fase 3: Componente Design Switcher
- [ ] Fase 4: Layout Clásico
- [ ] Fase 5: Layout Moderno
- [ ] Fase 6: Renderer Principal y Componentes Auxiliares
- [ ] Fase 7: Schema de Base de Datos
- [ ] Fase 8: Queries de Base de Datos
- [ ] Fase 9: Páginas del Dashboard
- [ ] Fase 10: Backend - Módulos de Lógica
- [ ] Fase 11: API Routes
- [ ] Fase 12: Seed Data
- [ ] Fase 13: Testing del Pipeline Completo
- [ ] Fase 14: Configuración de Producción
- [ ] Fase 15: Documentación

---

**Última actualización**: Noviembre 2025
**Versión del plan**: 1.0
**Proyecto**: OttoSeguridad - Sistema de Boletines
