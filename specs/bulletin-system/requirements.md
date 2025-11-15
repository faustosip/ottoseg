# Requirements: Sistema de Boletines de Noticias OttoSeguridad

## 1. Visión General

### Objetivo Principal
Crear un sistema automatizado de generación de boletines diarios de noticias ecuatorianas que:
- Scrapea automáticamente noticias de fuentes locales
- Clasifica contenido en 6 categorías usando IA
- Genera resúmenes concisos y profesionales
- Prepara contenido para generación de video
- Se ejecuta automáticamente todos los días a las 6:00 AM

### Audiencia Objetivo
- **Primaria**: Adultos mayores ecuatorianos familiarizados con formato clásico de boletín
- **Secundaria**: Usuarios que prefieren diseños web modernos
- **Característica clave**: Sistema dual de diseño para satisfacer ambas audiencias

---

## 2. Fuentes de Noticias

### Fuentes Activas
1. **Primicias**
   - URL: https://www.primicias.ec/
   - Base URL: https://www.primicias.ec
   - Tipo: Portal de noticias ecuatoriano

2. **La Hora**
   - URL: https://www.lahora.com.ec/
   - Base URL: https://www.lahora.com.ec
   - Tipo: Periódico digital ecuatoriano

3. **El comercio**
   - URL: https://www.elcomercio.com/
   - Base URL: https://www.elcomercio.com
   - Tipo: Periódico digital ecuatoriano

4. **Teleamazonas**
   - URL: https://www.teleamazonas.com/
   - Base URL: https://www.teleamazonas.com
   - Tipo: Periódico digital ecuatoriano

5. **Ecu911**
   - URL: https://www.ecu911.gob.ec//
   - Base URL: https://www.ecu911.gob.ec/
   - Tipo: Periódico digital ecuatoriano

### Requisitos de Scraping
- Extraer título, contenido, URL, fecha de publicación
- Incluir imágenes cuando estén disponibles
- Limpiar contenido de publicidad y elementos no relevantes
- Manejar errores de forma resiliente (continuar si una fuente falla)
- Timeout de 30 segundos por fuente
- Retry automático hasta 3 veces con backoff exponencial

---

## 3. Categorías de Noticias

El sistema debe clasificar noticias en **6 categorías** predefinidas:

### 3.1 Economía
- Empresas, mercados, finanzas
- Comercio, exportaciones, importaciones
- Empleo, salarios
- Inflación, PIB, indicadores económicos
- Sector empresarial

### 3.2 Política
- Elecciones, gobierno
- Leyes, reformas, políticas públicas
- Partidos políticos
- Funcionarios públicos
- Asamblea Nacional

### 3.3 Sociedad
- Educación
- Salud pública
- Cultura y arte
- Deportes
- Eventos sociales y comunitarios

### 3.4 Seguridad
- Crimen y delincuencia
- Policía y fuerzas del orden
- Narcotráfico
- Violencia
- Emergencias y desastres naturales

### 3.5 Internacional
- Geopolítica
- Economía global
- Relaciones internacionales de Ecuador
- Noticias relevantes de otros países
- Organizaciones internacionales

### 3.6 Vial
- Estado de carreteras
- Accidentes de tránsito
- Obras viales y de infraestructura
- Cierres de vías en Ecuador
- Transporte público

### Reglas de Clasificación
- Una noticia puede pertenecer a **múltiples categorías**
- Si no encaja en ninguna categoría, se omite
- Priorizar noticias más relevantes e importantes
- Mantener contexto ecuatoriano

---

## 4. Sistema de Resúmenes

### Requisitos de Resúmenes
- **Máximo 50 palabras** por categoría (configurable)
- **Estilo**: Profesional pero accesible, no sensacionalista
- **Estructura**: 2-3 oraciones bien construidas
  - Primera oración: Hecho más importante
  - Segunda oración: Contexto o consecuencias
  - Tercera oración (opcional): Dato adicional relevante
- **Tono**: Asume audiencia ecuatoriana con conocimiento básico del contexto
- **Datos**: Incluir cifras específicas cuando estén disponibles

### Contenido
- Texto justificado
- Sin relleno ni palabras innecesarias
- Claro y directo al punto
- Cohesivo entre múltiples noticias de la misma categoría

---

## 5. Sistema de Diseño Dual

### 5.1 Diseño Clásico

#### Propósito
Mantener familiaridad para audiencia mayor acostumbrada al formato tradicional

#### Características Visuales
- **Layout**: Diseño vertical lineal de 1024px max-width
- **Fondo**: Blanco limpio (#ffffff)
- **Header**:
  - Imagen decorativa de fondo
  - Título "RESUMEN DIARIO DE NOTICIAS" centrado en Canva Sans Bold
  - Fecha en formato: "Martes 11 de Noviembre de 2025"
- **Separadores**: Líneas horizontales grises (#c9c9c9) entre secciones
- **Secciones**: Numeradas del 1 al 6 con títulos subrayados
- **Footer**: Imagen decorativa + logo corporativo

#### Tipografía
- **Títulos principales**: Canva Sans Bold / Coco Gothic Bold
- **Títulos de noticias**: Open Sans Bold (42-44px) en azul (#004aad)
- **Cuerpo**: Open Sans Regular (37px) en negro (#000000)
- **Enlaces**: Azul (#1a62ff) subrayado con texto "Leer más"

#### Colores Corporativos
- **Azul oscuro**: #004aad
- **Azul enlace**: #1a62ff
- **Gris separadores**: #c9c9c9
- **Fondo**: #ffffff
- **Texto**: #000000

#### Estructura de Cada Noticia
1. Número y categoría subrayada (ej: "1. Economía")
2. Título en azul y negrita
3. Imagen ilustrativa centrada (400-450px width)
4. Texto justificado
5. Link "Leer más" en azul

### 5.2 Diseño Moderno

#### Propósito
Ofrecer experiencia web actualizada y responsive

#### Características Visuales
- **Layout**: Grid responsive (1200px max-width)
  - Desktop: 2 columnas
  - Mobile: 1 columna
- **Header**: Gradiente azul (linear-gradient del brand)
- **Cards**: Con sombra sutil y border-radius
- **Categorías**: Badges en lugar de números
- **Navegación**: Tabs o filtros para categorías

#### Tipografía
- **Familia**: Inter (moderna y legible)
- **Títulos principales**: 48px
- **Títulos de sección**: 32px
- **Títulos de noticia**: 28px
- **Cuerpo**: 16px
- **Fecha**: 14px

#### Colores
- Mantiene brand colors (#004aad, #1a62ff)
- **Gris acentos**: #e5e7eb
- **Texto**: #1f2937 (más suave que negro puro)

#### Características Interactivas
- Hover effects en cards
- Animaciones suaves
- Imágenes con border-radius
- Sin numeración visible
- Esquinas redondeadas

### 5.3 Switcher de Diseño
- **Ubicación**: Visible en vista de boletín
- **Funcionalidad**: Cambio instantáneo con un clic
- **Persistencia**: Guardar preferencia en localStorage
- **UI**: Toggle elegante con preview miniatura de cada diseño

---

## 6. Automatización

### 6.1 Cron Job Diario
- **Horario**: 6:00 AM (hora Ecuador)
- **Frecuencia**: Todos los días
- **Acción**: Ejecutar pipeline completo automáticamente

### 6.2 Pipeline Completo
Secuencia de pasos:

1. **Scraping** (5-10 min)
   - Obtener noticias de Primicias y La Hora
   - Validar y limpiar contenido
   - Guardar como `rawNews` en BD

2. **Clasificación** (3-5 min)
   - Enviar todas las noticias a Claude
   - Clasificar en 6 categorías
   - Guardar como `classifiedNews` en BD

3. **Resúmenes** (5-10 min)
   - Para cada categoría, generar resumen
   - Validar límite de palabras
   - Guardar resúmenes finales en BD

4. **Preparación de Video** (2-5 min)
   - Crear script estructurado
   - Calcular duración estimada
   - Guardar metadata de video

5. **Actualización de Status**
   - Marcar boletín como 'ready'
   - Registrar logs de todo el proceso

### 6.3 Manejo de Errores
- Logs detallados en tabla `bulletin_logs`
- Si un paso falla, marcar boletín como 'failed'
- Continuar con pasos parciales cuando sea posible
- No bloquear la ejecución diaria si hay un fallo

---

## 7. Base de Datos

### 7.1 Tablas Nuevas

#### `bulletins`
Tabla principal para almacenar boletines generados
- ID único
- Fecha del boletín
- Status del proceso (draft, scraping, classifying, summarizing, ready, published, failed)
- Noticias raw (JSONB con datos de scraping)
- Noticias clasificadas (JSONB con 6 categorías)
- 6 campos de texto para resúmenes finales
- Total de noticias procesadas
- URL y metadata de video
- Configuración de diseño (classic/modern)
- URLs de assets (logo, header, footer)
- Colores de brand (JSONB)
- Timestamps

#### `news_sources`
Configuración de fuentes de noticias
- Nombre, URL, base URL
- Configuración de scraping (selectores CSS, timeouts)
- Estado activo/inactivo
- Última vez scrapeada
- Total scrapeado

#### `bulletin_templates`
Templates de prompts para IA
- Nombre del template
- Categoría asociada
- System prompt
- User prompt template con placeholders
- Ejemplo de output esperado
- Límite de palabras
- Tono (profesional, casual, formal)
- Versión

#### `bulletin_logs`
Registro de ejecución del pipeline
- ID de boletín asociado
- Paso del proceso
- Status (started, completed, failed)
- Mensaje descriptivo
- Metadata adicional (JSONB)
- Duración en milisegundos

#### `bulletin_designs`
Configuraciones de diseño
- Nombre (classic, modern)
- Nombre para display
- Template CSS
- Configuración de layout (JSONB)

### 7.2 Relaciones
- `bulletin_logs.bulletinId` → `bulletins.id` (FK)
- Todos los IDs son UUID
- Timestamps automáticos en todas las tablas

---

## 8. Integración de IA

### 8.1 Proveedor
- **Plataforma**: OpenRouter
- **Modelo**: Claude Sonnet 4 (`anthropic/claude-sonnet-4-20250514`)
- **API Key**: Configurada en variable de entorno `OPENROUTER_API_KEY`

### 8.2 Configuración
- **Temperature**: 0.3 (respuestas consistentes)
- **Max tokens**: 4000
- **Timeout**: 60 segundos
- **Retry logic**: 3 intentos con backoff exponencial

### 8.3 Casos de Uso
1. **Clasificación de noticias**
   - Input: Array de noticias raw
   - Output: JSON con 6 arrays (una por categoría)

2. **Generación de resúmenes**
   - Input: Array de noticias de una categoría + template
   - Output: Texto de resumen (máx 50 palabras)

### 8.4 Prompts
Prompts estructurados y versionados:
- System prompts con instrucciones detalladas
- User prompts con placeholders (`{{VARIABLE}}`)
- Ejemplos de output esperado
- Validación estricta de respuestas

---

## 9. Scraping

### 9.1 Herramienta
- **Servicio**: Firecrawl API
- **Endpoint**: https://api.firecrawl.dev/v1/scrape
- **API Key**: Configurada en `FIRECRAWL_API_KEY`

### 9.2 Configuración de Request
```json
{
  "url": "URL_DE_LA_FUENTE",
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "waitFor": 2000,
  "removeBase64Images": true
}
```

### 9.3 Procesamiento
- Parsear markdown/html para extraer artículos
- Identificar títulos (headers h1-h3)
- Extraer contenido limpio
- Obtener URLs completas
- Incluir imágenes cuando estén disponibles
- Validar que cada artículo tenga:
  - Título (min 10 caracteres)
  - Contenido (min 50 caracteres)
  - URL válida

---

## 10. Interfaz de Usuario

### 10.1 Dashboard Principal (`/dashboard/bulletin`)
Funcionalidades:
- Lista de todos los boletines con paginación
- Filtros por fecha y status
- Botón "Generar Nuevo Boletín" (deshabilitado si hay uno en proceso hoy)
- Preview cards de cada boletín mostrando:
  - Fecha
  - Status badge con color
  - Total de noticias
  - Status del video
  - Mini preview de categorías

### 10.2 Vista Detallada (`/dashboard/bulletin/[id]`)
Tabs:

**1. Resúmenes**
- Switcher de diseño (Clásico ↔ Moderno)
- Renderizado completo del boletín según diseño seleccionado
- Cada categoría es editable
- Botón "Regenerar" para re-generar resumen con IA

**2. Noticias Raw**
- Accordion por fuente (Primicias, La Hora)
- Lista de artículos scrapeados
- Modal para ver contenido completo

**3. Noticias Clasificadas**
- Accordion por categoría
- Lista de noticias asignadas a cada una
- Visualización de la clasificación hecha por IA

**4. Logs**
- Timeline del proceso completo
- Cada paso con: status, duración, timestamp, mensaje
- Mensajes de error si los hay

**5. Video**
- Si está listo: reproductor embebido
- Si está en proceso: progress bar
- Si no generado: botón "Generar Video"
- Preview del script de video

### 10.3 Panel de Admin (`/admin/bulletin-config`)
- Gestión de fuentes de noticias (CRUD)
- Edición de templates de IA
- Configuración de diseños
- Ajustes generales

### 10.4 Componentes Requeridos
- `BulletinCard`: Card para lista
- `BulletinList`: Lista paginada con filtros
- `StatusBadge`: Badge con colores por status
- `CategorySection`: Sección de categoría con resumen
- `NewsPreview`: Preview de noticia individual
- `GenerateButton`: Botón con progress indicator
- `DesignSwitcher`: Toggle para cambiar diseños
- `BulletinRenderer`: Renderer principal que decide layout
- `ClassicBulletinLayout`: Layout que replica diseño clásico
- `ModernBulletinLayout`: Layout responsive moderno

---

## 11. API Endpoints

### 11.1 Endpoints de Noticias
- `POST /api/news/scrape`: Inicia scraping de fuentes
- `POST /api/news/classify`: Clasifica noticias con IA
- `POST /api/news/summarize`: Genera resúmenes de categorías
- `POST /api/news/generate-video`: Prepara script de video

### 11.2 CRUD de Boletines
- `GET /api/bulletins`: Lista de boletines (con filtros, paginación)
- `GET /api/bulletins/[id]`: Detalle completo de boletín
- `PATCH /api/bulletins/[id]`: Actualizar boletín (editar resúmenes)
- `DELETE /api/bulletins/[id]`: Eliminar boletín

### 11.3 Cron
- `GET /api/cron/daily-bulletin`: Ejecuta pipeline completo
  - Requiere header: `Authorization: Bearer ${CRON_SECRET}`
  - Verifica que no haya boletín de hoy en proceso
  - Ejecuta: scrape → classify → summarize → video

### 11.4 Autenticación
Todos los endpoints requieren autenticación con Better Auth, excepto el endpoint de cron que usa secret key

---

## 12. Requisitos No Funcionales

### 12.1 Performance
- Scraping: completar en < 10 minutos
- Clasificación: completar en < 5 minutos
- Resúmenes: completar en < 10 minutos
- Total pipeline: < 30 minutos

### 12.2 Confiabilidad
- Resiliencia a fallos parciales
- Logs detallados de cada operación
- Retry automático con backoff
- Continuación del proceso si una fuente falla

### 12.3 Seguridad
- Validación de todos los inputs
- Sanitización de datos scrapeados
- Autenticación en todos los endpoints privados
- Rate limiting en APIs públicas
- No exponer API keys en cliente
- Secret fuerte para cron job

### 12.4 Escalabilidad
- Paginación en listas largas
- Lazy loading de imágenes
- Optimización de queries a BD
- Cache cuando sea apropiado

### 12.5 Usabilidad
- Responsive design (mobile-first)
- Loading states en todos los componentes
- Feedback visual claro
- Mensajes de error descriptivos
- Tooltips y ayuda contextual

---

## 13. Stack Técnico

### Frontend
- **Framework**: Next.js 15 con App Router
- **React**: 19
- **TypeScript**: 5.9.3
- **UI Library**: shadcn/ui (Radix UI + Tailwind)
- **Styling**: Tailwind CSS 4
- **Temas**: next-themes (dark/light mode)
- **Iconos**: Lucide React
- **Markdown**: react-markdown

### Backend
- **Runtime**: Node.js con Next.js API Routes
- **Base de Datos**: PostgreSQL 18
- **ORM**: Drizzle ORM
- **Auth**: Better Auth con Google OAuth
- **IA**: Vercel AI SDK + OpenRouter
- **Scraping**: Firecrawl API

### DevOps
- **Deployment**: Vercel
- **Cron Jobs**: Vercel Cron
- **Database Hosting**: Docker local (dev) / Vercel Postgres (prod)
- **Package Manager**: pnpm

---

## 14. Variables de Entorno

```env
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/db_name

# Authentication
BETTER_AUTH_SECRET=32-char-random-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Integration
OPENROUTER_API_KEY=sk-or-v1-your-key

# News Scraping
FIRECRAWL_API_KEY=fc-your-key

# Cron Security
CRON_SECRET=generated-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000

# Optional (future)
ELEVENLABS_API_KEY=...
PICTORY_API_KEY=...
```

---

## 15. Restricciones y Consideraciones

### 15.1 Limitaciones Conocidas
- Generación de video es placeholder (fase 2)
- Scraping depende de estructura HTML de las fuentes (puede cambiar)
- Costos de API de IA según uso
- Límites de rate en OpenRouter y Firecrawl

### 15.2 Futuras Mejoras
- Integración completa de generación de video (ElevenLabs + Synthesia)
- Analytics de boletines (vistas, engagement)
- A/B testing de formatos
- Distribución automática (email, WhatsApp)
- Más fuentes de noticias
- Personalización de boletines por usuario

---

## 16. Criterios de Éxito

El sistema será considerado exitoso cuando:

1. ✅ Genera automáticamente un boletín diario a las 6am
2. ✅ Clasifica correctamente al menos 80% de noticias
3. ✅ Resúmenes son concisos (≤ 50 palabras) y comprensibles
4. ✅ Ambos diseños (Clásico y Moderno) renderizan correctamente
5. ✅ Cambio de diseño funciona con un solo clic
6. ✅ Pipeline completo se ejecuta en < 30 minutos
7. ✅ Sistema es resiliente a fallos parciales
8. ✅ UI es intuitiva y responsive
9. ✅ Logs permiten debug efectivo
10. ✅ Audiencia mayor puede usar el sistema sin fricción

---

**Versión**: 1.0
**Fecha**: Noviembre 2025
**Proyecto**: OttoSeguridad - Sistema de Boletines
