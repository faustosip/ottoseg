OBJETIVO
Necesito agregar un sistema completo de generación automática de boletines de noticias que:

Scrapee diariamente noticias de fuentes ecuatorianas (Primicias y La Hora)
Clasifique automáticamente las noticias en 6 categorías usando AI
Genere resúmenes concisos para cada categoría
Prepare el contenido para posteriormente generar un video
Todo debe ejecutarse automáticamente cada día a las 6am

ARQUITECTURA DE CARPETAS REQUERIDA
app/
├── api/
│   ├── news/
│   │   ├── scrape/
│   │   │   └── route.ts
│   │   ├── classify/
│   │   │   └── route.ts
│   │   ├── summarize/
│   │   │   └── route.ts
│   │   └── generate-video/
│   │       └── route.ts
│   └── cron/
│       └── daily-bulletin/
│           └── route.ts
├── dashboard/
│   └── bulletin/
│       ├── page.tsx
│       ├── [id]/
│       │   └── page.tsx
│       └── components/
│           ├── bulletin-card.tsx
│           ├── bulletin-list.tsx
│           └── generate-button.tsx
└── admin/
    └── bulletin-config/
        └── page.tsx

lib/
├── news/
│   ├── scraper.ts
│   ├── classifier.ts
│   ├── summarizer.ts
│   └── video-generator.ts
├── ai/
│   ├── providers.ts
│   └── prompts.ts
└── db/
    ├── schema.ts (modificar archivo existente)
    └── queries/
        └── bulletins.ts

components/
└── bulletin/
    ├── category-section.tsx
    ├── news-preview.tsx
    └── status-badge.tsx
PARTE 1: SCHEMA DE BASE DE DATOS
Instrucciones:

Abre el archivo existente lib/db/schema.ts
Agrega las siguientes tablas sin modificar las existentes:

Tabla: bulletins

id: UUID, primary key, auto-generado
date: timestamp, not null, default now
status: texto, not null, default 'draft', valores posibles: 'draft', 'scraping', 'classifying', 'summarizing', 'ready', 'video_processing', 'published', 'failed'
rawNews: jsonb, estructura: { primicias: any[], laHora: any[], metadata: { totalArticles: number, scrapedAt: string } }
classifiedNews: jsonb, estructura: { economia: any[], politica: any[], sociedad: any[], seguridad: any[], internacional: any[], vial: any[] }
economia: texto (resumen final)
politica: texto (resumen final)
sociedad: texto (resumen final)
seguridad: texto (resumen final)
internacional: texto (resumen final)
vial: texto (resumen final)
totalNews: entero, default 0
videoUrl: texto, nullable
videoStatus: texto, default 'pending', valores: 'pending', 'processing', 'ready', 'failed'
videoMetadata: jsonb, nullable, estructura: { duration: number, fileSize: number, provider: string }
errorLog: jsonb, nullable, para guardar errores durante el proceso
createdAt: timestamp, default now
publishedAt: timestamp, nullable

Tabla: news_sources

id: UUID, primary key, auto-generado
name: texto, not null
url: texto, not null
baseUrl: texto, not null (para construcción de URLs completas)
selector: texto, nullable (selectores CSS específicos)
scrapeConfig: jsonb, estructura: { waitForSelector: string, excludeSelectors: string[], includeImages: boolean }
isActive: boolean, default true
lastScraped: timestamp, nullable
lastScrapedStatus: texto, nullable, valores: 'success', 'failed', 'partial'
totalScraped: entero, default 0
createdAt: timestamp, default now
updatedAt: timestamp, default now

Tabla: bulletin_templates

id: UUID, primary key, auto-generado
name: texto, not null
category: texto, not null, valores: 'economia', 'politica', 'sociedad', 'seguridad', 'internacional', 'vial'
systemPrompt: texto, not null (instrucciones generales)
userPromptTemplate: texto, not null (template con placeholders)
exampleOutput: texto, nullable (ejemplo de salida esperada)
maxWords: entero, default 50
tone: texto, default 'profesional' (profesional, casual, formal)
isActive: boolean, default true
version: entero, default 1
createdAt: timestamp, default now
updatedAt: timestamp, default now

Tabla: bulletin_logs

id: UUID, primary key, auto-generado
bulletinId: UUID, foreign key a bulletins(id)
step: texto, not null, valores: 'scraping', 'classification', 'summarization', 'video_generation'
status: texto, not null, valores: 'started', 'completed', 'failed'
message: texto
metadata: jsonb, nullable
duration: entero, nullable (milisegundos)
createdAt: timestamp, default now


Después de crear el schema, genera las migraciones con: pnpm run db:generate
Ejecuta las migraciones con: pnpm run db:migrate

PARTE 2: QUERIES Y HELPERS DE BASE DE DATOS
Archivo: lib/db/queries/bulletins.ts
Crea funciones para:

createBulletin(): crear nuevo boletín con status 'draft'
getBulletinById(id): obtener boletín por ID con todos sus campos
getAllBulletins(options): obtener lista de boletines con paginación, filtros por status y fecha, ordenamiento desc por fecha
updateBulletinStatus(id, status): actualizar solo el status
updateBulletinRawNews(id, rawNews, totalNews): actualizar noticias scrapeadas
updateBulletinClassification(id, classifiedNews): actualizar clasificación
updateBulletinSummaries(id, summaries): actualizar los 6 resúmenes finales (objeto con economia, politica, sociedad, seguridad, internacional, vial)
updateBulletinVideo(id, videoData): actualizar info de video
getBulletinsByDateRange(startDate, endDate): obtener boletines en rango de fechas
getTodayBulletin(): obtener el boletín de hoy si existe
getLatestBulletin(): obtener el boletín más reciente
createBulletinLog(bulletinId, step, status, message, metadata): crear log de proceso
getBulletinLogs(bulletinId): obtener todos los logs de un boletín

Todas las funciones deben:

Usar Drizzle ORM
Manejar errores con try-catch
Retornar tipos TypeScript apropiados
Incluir comentarios explicativos

Archivo: lib/db/queries/sources.ts
Crea funciones para:

getActiveSources(): obtener todas las fuentes activas
getSourceByName(name): obtener fuente por nombre
updateSourceLastScraped(id, status): actualizar última vez scrapeada
createSource(data): crear nueva fuente
updateSource(id, data): actualizar fuente existente

Archivo: lib/db/queries/templates.ts
Crea funciones para:

getActiveTemplates(): obtener todos los templates activos
getTemplateByCategory(category): obtener template de una categoría específica
createTemplate(data): crear nuevo template
updateTemplate(id, data): actualizar template
getTemplateHistory(category): obtener historial de versiones de templates por categoría

PARTE 3: CONFIGURACIÓN DE AI PROVIDERS
Archivo: lib/ai/providers.ts
Crear configuración reutilizable para:
Provider: Claude via OpenRouter

Modelo: 'anthropic/claude-sonnet-4-20250514'
Base URL: 'https://openrouter.ai/api/v1'
Headers necesarios
Configuración de parámetros por defecto: temperature 0.3, max_tokens 4000
Función helper: getClaudeModel() que retorna el modelo configurado

Provider: GPT-4 via OpenRouter (backup)

Modelo: 'openai/gpt-4-turbo'
Misma base URL
Función helper: getGPTModel()

Configuración general:

Timeout: 60 segundos
Retry logic: 3 intentos con backoff exponencial
Error handling centralizado
Rate limiting awareness

Archivo: lib/ai/prompts.ts
Crear templates de prompts como constantes exportables:
CLASSIFICATION_SYSTEM_PROMPT:
Eres un clasificador experto de noticias ecuatorianas. Tu tarea es categorizar artículos de noticias en 6 categorías específicas.

CATEGORÍAS:
1. Economía: noticias sobre empresas, mercados, finanzas, comercio, empleo, inflación, PIB
2. Política: elecciones, gobierno, leyes, partidos políticos, funcionarios públicos, reformas
3. Sociedad: educación, salud, cultura, deportes, eventos sociales, comunidad
4. Seguridad: crimen, policía, narcotráfico, violencia, emergencias, desastres naturales
5. Internacional: geopolítica, economía global, relaciones internacionales, noticias de otros países
6. Vial: estado de carreteras, accidentes de tránsito, obras viales, cierres de vías en Ecuador

REGLAS:
- Una noticia puede pertenecer a múltiples categorías
- Si una noticia no encaja claramente en ninguna categoría, omítela
- Prioriza las noticias más relevantes e importantes
- Incluye el título, resumen breve, y categorías asignadas
CLASSIFICATION_USER_PROMPT_TEMPLATE:
Clasifica las siguientes noticias scrapeadas:

{{NEWS_DATA}}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "economia": [
    { "title": "...", "summary": "...", "url": "...", "source": "...", "date": "..." }
  ],
  "politica": [...],
  "sociedad": [...],
  "seguridad": [...],
  "internacional": [...],
  "vial": [...]
}

IMPORTANTE: 
- NO incluyas texto adicional antes o después del JSON
- Asegúrate de que el JSON sea válido y parseable
- Si una categoría no tiene noticias, incluye un array vacío []
SUMMARIZATION_SYSTEM_PROMPT:
Eres un editor de noticias profesional ecuatoriano especializado en crear resúmenes concisos y claros para boletines diarios.

ESTILO:
- Tono: profesional pero accesible, no sensacionalista
- Estructura: directo al punto, sin relleno
- Datos: incluye cifras específicas cuando estén disponibles
- Contexto: asume que el lector es ecuatoriano y conoce el contexto básico del país

FORMATO:
- Máximo {{MAX_WORDS}} palabras por categoría
- 2-3 oraciones bien estructuradas
- Primera oración: el hecho más importante
- Segunda oración: contexto o consecuencias
- Tercera oración (opcional): dato adicional relevante
SUMMARIZATION_USER_PROMPT_TEMPLATE:
Resume las siguientes noticias de la categoría "{{CATEGORY}}" para un boletín diario:

{{CLASSIFIED_NEWS}}

EJEMPLO DE FORMATO ESPERADO:
{{EXAMPLE_OUTPUT}}

Genera un resumen cohesivo que integre las noticias más importantes, manteniendo el estilo del ejemplo.

RESUMEN ({{MAX_WORDS}} palabras máximo):
VIDEO_SCRIPT_SYSTEM_PROMPT:
Eres un guionista de noticias para video. Convierte los resúmenes del boletín en un script natural para narración en video.

CARACTERÍSTICAS:
- Lenguaje hablado natural, no texto escrito formal
- Transiciones suaves entre categorías
- Tono conversacional pero informativo
- Duración aproximada: 2-3 minutos total
- Incluye introducción y cierre
Cada prompt debe:

Tener versión en TypeScript como constante
Incluir placeholders claramente marcados con {{}}
Tener comentarios explicando su propósito
Incluir ejemplos donde sea necesario

PARTE 4: MÓDULOS DE LÓGICA DE NEGOCIO
Archivo: lib/news/scraper.ts
Función principal: scrapeAllSources()
Debe:

Obtener todas las fuentes activas desde la BD usando getActiveSources()
Para cada fuente, hacer scraping usando Firecrawl API
Endpoint Firecrawl: https://api.firecrawl.dev/v1/scrape
Método: POST
Headers: 'Authorization': Bearer ${process.env.FIRECRAWL_API_KEY}, 'Content-Type': 'application/json'
Body para cada request:

json{
  "url": "URL_DE_LA_FUENTE",
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "waitFor": 2000,
  "removeBase64Images": true
}

Procesar respuesta y extraer artículos
Retornar estructura:

typescript{
  primicias: Array<{
    title: string,
    content: string,
    url: string,
    scrapedAt: string,
    source: 'primicias'
  }>,
  laHora: Array<{
    title: string,
    content: string,
    url: string,
    scrapedAt: string,
    source: 'lahora'
  }>,
  metadata: {
    totalArticles: number,
    scrapedAt: string,
    sources: string[]
  }
}
Función auxiliar: parseFirecrawlResponse(response, sourceName)
Debe:

Recibir el JSON de respuesta de Firecrawl
Extraer artículos del markdown/html
Identificar títulos (buscar patterns como headers, tags h1-h3)
Limpiar contenido (remover ads, menus, footers)
Retornar array de artículos estructurados

Función auxiliar: validateArticle(article)
Debe:

Verificar que tenga título (mínimo 10 caracteres)
Verificar que tenga contenido (mínimo 50 caracteres)
Verificar que tenga URL válida
Retornar boolean

Manejo de errores:

Timeout de 30 segundos por fuente
Retry automático hasta 3 veces con delay exponencial (2s, 4s, 8s)
Log de errores detallado
Si una fuente falla, continuar con las demás
Retornar resultados parciales si es posible

Archivo: lib/news/classifier.ts
Función principal: classifyNews(rawNews, bulletinId)
Debe:

Recibir el objeto rawNews con todas las noticias scrapeadas
Crear log de inicio: createBulletinLog(bulletinId, 'classification', 'started', ...)
Preparar el prompt usando CLASSIFICATION_SYSTEM_PROMPT y CLASSIFICATION_USER_PROMPT_TEMPLATE
Reemplazar {{NEWS_DATA}} con JSON.stringify de rawNews formateado
Llamar a Claude API usando generateText del Vercel AI SDK:

typescriptimport { generateText } from 'ai';
import { getClaudeModel } from '@/lib/ai/providers';

const { text } = await generateText({
  model: getClaudeModel(),
  system: CLASSIFICATION_SYSTEM_PROMPT,
  prompt: userPrompt,
  temperature: 0.3,
  maxTokens: 4000
});

Parsear la respuesta JSON
Validar estructura del JSON (debe tener las 6 categorías)
Actualizar bulletin con classifiedNews: updateBulletinClassification(bulletinId, classified)
Crear log de completado: createBulletinLog(bulletinId, 'classification', 'completed', ...)
Retornar clasificación

Función auxiliar: validateClassification(classified)
Debe:

Verificar que tenga las 6 propiedades: economia, politica, sociedad, seguridad, internacional, vial
Verificar que cada propiedad sea un array
Verificar que los elementos tengan: title, summary, url, source
Retornar objeto: { valid: boolean, errors: string[] }

Función auxiliar: extractJSONFromResponse(text)
Debe:

Manejar casos donde Claude incluye markdown (json ... )
Remover texto antes y después del JSON
Parsear y validar que sea JSON válido
Si falla, intentar extraer con regex
Retornar objeto parseado o throw error

Manejo de errores:

Try-catch global
Log de error si falla el parsing
Log de error si falla la validación
Crear log de fallo: createBulletinLog(bulletinId, 'classification', 'failed', error.message)
Actualizar status del bulletin a 'failed'

Archivo: lib/news/summarizer.ts
Función principal: summarizeByCategory(classifiedNews, bulletinId)
Debe:

Crear log de inicio
Obtener templates activos: getActiveTemplates()
Para cada categoría (economia, politica, sociedad, seguridad, internacional, vial):
a. Obtener noticias de esa categoría desde classifiedNews
b. Si no hay noticias, asignar "No hay información disponible para esta categoría hoy"
c. Si hay noticias:

Obtener template de esa categoría
Preparar prompt reemplazando placeholders:

{{CATEGORY}} → nombre de la categoría
{{CLASSIFIED_NEWS}} → JSON de noticias de esa categoría
{{MAX_WORDS}} → maxWords del template (default 50)
{{EXAMPLE_OUTPUT}} → exampleOutput del template


Llamar a Claude API con generateText
Recibir resumen generado


Construir objeto summaries con las 6 categorías
Actualizar bulletin: updateBulletinSummaries(bulletinId, summaries)
Crear log de completado
Retornar summaries

Función principal alternativa: summarizeWithStreaming(classifiedNews, bulletinId, onChunk)
Similar a la anterior pero usando streamText en lugar de generateText para permitir streaming en tiempo real en el UI:
typescriptimport { streamText } from 'ai';

const stream = await streamText({
  model: getClaudeModel(),
  system: SUMMARIZATION_SYSTEM_PROMPT,
  prompt: userPrompt,
  onChunk: (chunk) => {
    // Callback para enviar chunks al cliente
    onChunk(category, chunk);
  },
  onFinish: (result) => {
    // Guardar resumen completo
  }
});
Función auxiliar: validateSummary(summary, maxWords)
Debe:

Contar palabras del resumen
Verificar que no exceda maxWords + 10% de tolerancia
Verificar que tenga al menos 20 palabras (mínimo útil)
Retornar { valid: boolean, wordCount: number, error?: string }

Función auxiliar: formatCategoryName(category)
Debe:

Convertir 'economia' → 'Economía'
Convertir 'politica' → 'Política'
Convertir 'vial' → 'Reporte Vial'
etc.
Retornar nombre capitalizado y formateado para display

Manejo de errores:

Try-catch por categoría (si una falla, continuar con las demás)
Logs individuales por categoría
Si más del 50% de categorías fallan, marcar bulletin como 'failed'
Retornar resultados parciales cuando sea posible

Archivo: lib/news/video-generator.ts
Función principal: prepareVideoScript(bulletin)
Debe:

Recibir bulletin completo con todos los resúmenes
Crear script estructurado para video:

typescript{
  intro: string,
  sections: [
    { category: 'economia', title: 'Economía', content: string, duration: number },
    { category: 'politica', title: 'Política', content: string, duration: number },
    // ... resto de categorías
  ],
  outro: string,
  totalDuration: number,
  metadata: {
    bulletinId: string,
    date: string,
    totalWords: number
  }
}

Calcular duración estimada (asumiendo 150 palabras/minuto para narración)
Formatear texto para narración (agregar pausas, énfasis)
Retornar script completo

Función auxiliar: generateIntro(date)
Debe:

Crear introducción estándar: "Buenos días, hoy es [fecha], y este es tu resumen de noticias del día."
Formatear fecha en español: "miércoles 12 de noviembre de 2025"
Retornar texto formateado

Función auxiliar: generateOutro()
Debe:

Crear cierre estándar: "Esto es todo por hoy. Gracias por tu atención y que tengas un excelente día."
Retornar texto

Función auxiliar: estimateDuration(text)
Debe:

Contar palabras
Aplicar fórmula: (palabras / 150) * 60 = segundos
Agregar 2 segundos por pausa entre secciones
Retornar duración en segundos

Función placeholder: generateVideoWithAPI(script, bulletinId)
Debe:

Ser una función stub para futura implementación
Comentarios indicando que aquí iría la integración con:

ElevenLabs para audio (text-to-speech)
Pictory/Synthesia/FFmpeg para video


Por ahora, solo retornar Promise con objeto mock:

typescript{
  status: 'pending',
  message: 'Video generation not implemented yet',
  scriptPrepared: true
}
PARTE 5: API ROUTES
Archivo: app/api/news/scrape/route.ts
Endpoint: POST /api/news/scrape
Request body esperado:
typescript{
  sources?: string[] // opcional, default ['primicias', 'lahora']
}
Lógica:

Validar que el usuario esté autenticado (usar better-auth)
Verificar si ya existe un bulletin para hoy usando getTodayBulletin()
Si existe y está en proceso, retornar error "Bulletin already in progress"
Crear nuevo bulletin con status 'scraping': createBulletin()
Llamar a scrapeAllSources()
Actualizar bulletin con rawNews: updateBulletinRawNews(bulletinId, scrapedData, totalArticles)
Actualizar status a 'draft'
Retornar response:

typescript{
  success: true,
  bulletinId: string,
  totalNews: number,
  sources: string[],
  message: string
}
Manejo de errores:

Catch errores de scraping
Actualizar bulletin status a 'failed'
Retornar error 500 con mensaje descriptivo

Archivo: app/api/news/classify/route.ts
Endpoint: POST /api/news/classify
Request body:
typescript{
  bulletinId: string
}
Lógica:

Validar autenticación
Validar que bulletinId existe: getBulletinById(id)
Validar que bulletin tiene rawNews
Actualizar status a 'classifying'
Llamar a classifyNews(bulletin.rawNews, bulletinId)
Si clasificación exitosa, actualizar status a 'classified'
Retornar response:

typescript{
  success: true,
  bulletinId: string,
  classified: object,
  totalClassified: number,
  breakdown: { economia: number, politica: number, ... }
}
Manejo de errores:

Validar que bulletin existe (404 si no)
Validar que tiene rawNews (400 si no)
Catch errores de AI
Retornar errores apropiados

Archivo: app/api/news/summarize/route.ts
Endpoint: POST /api/news/summarize
Request body:
typescript{
  bulletinId: string,
  streaming?: boolean // si true, usar streaming response
}
Lógica para non-streaming:

Validar autenticación
Obtener bulletin y validar que tiene classifiedNews
Actualizar status a 'summarizing'
Llamar a summarizeByCategory(classifiedNews, bulletinId)
Actualizar status a 'ready'
Retornar summaries completos

Lógica para streaming:

Mismas validaciones
Usar streamText con callback
Retornar ReadableStream con chunks
Cuando termine, actualizar bulletin

Response non-streaming:
typescript{
  success: true,
  bulletinId: string,
  summaries: {
    economia: string,
    politica: string,
    // ... resto
  }
}
Response streaming:

Content-Type: text/event-stream
Stream de Server-Sent Events con chunks de cada categoría

Archivo: app/api/news/generate-video/route.ts
Endpoint: POST /api/news/generate-video
Request body:
typescript{
  bulletinId: string
}
Lógica:

Validar autenticación
Obtener bulletin completo con summaries
Validar que bulletin está en status 'ready'
Actualizar videoStatus a 'processing'
Llamar a prepareVideoScript(bulletin)
Guardar script en bulletin metadata
Llamar a generateVideoWithAPI(script, bulletinId) (por ahora es mock)
Retornar response:

typescript{
  success: true,
  bulletinId: string,
  videoStatus: string,
  script: object,
  message: string
}
Archivo: app/api/cron/daily-bulletin/route.ts
Endpoint: GET /api/cron/daily-bulletin
Headers esperados:

Authorization: Bearer ${CRON_SECRET}

Lógica:

Validar que viene de Vercel Cron verificando header
Si no es válido, retornar 401 Unauthorized
Verificar si ya hay bulletin de hoy, si existe retornar early
Ejecutar pipeline completo en secuencia:
a. POST /api/news/scrape (interno)
b. Esperar respuesta, extraer bulletinId
c. POST /api/news/classify con bulletinId (interno)
d. POST /api/news/summarize con bulletinId (interno)
e. POST /api/news/generate-video con bulletinId (interno)
Retornar resultado final:

typescript{
  success: true,
  bulletinId: string,
  executedAt: string,
  pipeline: {
    scraping: { status: string, duration: number },
    classification: { status: string, duration: number },
    summarization: { status: string, duration: number },
    video: { status: string, duration: number }
  }
}
Manejo de errores:

Try-catch en cada paso
Si un paso falla, loggear pero continuar si es posible
Retornar detalles de qué falló y qué funcionó
Enviar notificación de error (por implementar)

Importante: Para las llamadas internas entre API routes, usar fetch absoluto:
typescriptconst baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const response = await fetch(`${baseUrl}/api/news/scrape`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... })
});
PARTE 6: COMPONENTES DE UI
Archivo: app/dashboard/bulletin/page.tsx
Página principal de boletines
Debe mostrar:

Header con título "Boletines Diarios"
Botón "Generar Nuevo Boletín" (solo si no hay uno de hoy en proceso)
Filtros:

Selector de fecha (date range)
Selector de status (dropdown multi-select)
Botón "Limpiar filtros"


Lista de boletines en cards (usar BulletinList component)
Paginación (si hay más de 20 boletines)
Loading states apropiados
Empty state si no hay boletines

Funcionalidad del botón "Generar Nuevo Boletín":

Al hacer click, mostrar modal de confirmación
Desactivar botón y mostrar loading
Llamar POST /api/news/scrape
Mostrar progress indicator
Automáticamente llamar classify y summarize
Mostrar toast de éxito o error
Recargar lista de boletines

Estado del componente:
typescriptconst [bulletins, setBulletins] = useState([]);
const [loading, setLoading] = useState(false);
const [generating, setGenerating] = useState(false);
const [filters, setFilters] = useState({ status: [], dateRange: null });
const [page, setPage] = useState(1);
Usar React Query o SWR para data fetching con revalidación automática.
Archivo: app/dashboard/bulletin/[id]/page.tsx
Página de detalle de un boletín
Debe mostrar:

Header con fecha del boletín y status badge
Tabs para diferentes vistas:

"Resúmenes" (vista por defecto)
"Noticias Raw"
"Noticias Clasificadas"
"Logs"
"Video"


En tab "Resúmenes":

Mostrar las 6 categorías con sus resúmenes finales
Contador de palabras por categoría
Botón "Editar" para cada resumen (modal inline)
Botón "Regenerar" para re-generar un resumen específico


En tab "Noticias Raw":

Accordion por fuente (Primicias, La Hora)
Lista de artículos scrapeados con título y snippet
Botón para ver contenido completo en modal


En tab "Noticias Clasificadas":

Accordion por categoría
Lista de noticias asignadas a cada categoría


En tab "Logs":

Timeline de todos los pasos del proceso
Estado, duración, timestamp
Mensajes de error si los hay


En tab "Video":

Si video está listo: reproductor embebido
Si está en proceso: progress bar
Si no se ha generado: botón "Generar Video"
Preview del script de video



Acciones disponibles:

Botón "Publicar" (si status es 'ready')
Botón "Eliminar"
Botón "Exportar" (descargar JSON del boletín completo)

Archivo: components/bulletin/bulletin-card.tsx
Card component para lista de boletines
Props:
typescriptinterface BulletinCardProps {
  bulletin: {
    id: string;
    date: Date;
    status: string;
    totalNews: number;
    videoStatus: string;
    createdAt: Date;
  };
  onSelect?: (id: string) => void;
}
Debe mostrar:

Fecha grande y prominente (formato: "Miércoles 12 de Noviembre")
Status badge con color según estado
Número total de noticias procesadas
Status del video (icono + estado)
Mini preview de las categorías (iconos indicando cuáles tienen contenido)
Timestamp de creación
Hover state con efecto de elevación
Click lleva a página de detalle

Usar shadcn/ui Card component como base.
Archivo: components/bulletin/category-section.tsx
Component para mostrar resumen de una categoría
Props:
typescriptinterface CategorySectionProps {
  category: 'economia' | 'politica' | 'sociedad' | 'seguridad' | 'internacional' | 'vial';
  title: string;
  content: string;
  editable?: boolean;
  onEdit?: (newContent: string) => void;
  onRegenerate?: () => void;
}
Debe mostrar:

Icono representativo de la categoría (lucide-react icons)
Título de la categoría
Contenido del resumen
Contador de palabras
Si editable:

Botón "Editar" → abre textarea inline
Botón "Regenerar" → trigger regeneración con AI
Botones "Guardar" / "Cancelar" cuando editando



Estilos:

Border con color acorde a la categoría
Hover effect sutil
Transiciones suaves

Archivo: components/bulletin/status-badge.tsx
Badge component para mostrar status
Props:
typescriptinterface StatusBadgeProps {
  status: 'draft' | 'scraping' | 'classifying' | 'summarizing' | 'ready' | 'video_processing' | 'published' | 'failed';
  size?: 'sm' | 'md' | 'lg';
}
Mapeo de colores:

draft: gray
scraping: blue (con loading spinner)
classifying: blue (con loading spinner)
summarizing: blue (con loading spinner)
ready: green
video_processing: purple (con loading spinner)
published: emerald
failed: red

Usar shadcn/ui Badge component con variants custom.
Archivo: components/bulletin/generate-button.tsx
Botón inteligente para generar boletín
Props:
typescriptinterface GenerateButtonProps {
  disabled?: boolean;
  onGenerate: () => Promise<void>;
}
```

Features:
- Estado loading con spinner
- Muestra progress steps durante generación:
  1. Scraping noticias... ✓
  2. Clasificando... ✓
  3. Generando resúmenes... ⏳
  4. Preparando video... ⏱️
- Progress bar visual
- Deshabilitado mientras procesa
- Toast notifications para cada paso completado
- Error handling con retry button

Usar polling o websocket para actualizar progress en tiempo real.

## PARTE 7: CONFIGURACIÓN Y SETUP

### Archivo: .env.example

Agregar las siguientes variables:
```
# AI Providers
OPENROUTER_API_KEY=sk-or-v1-...

# News Scraping
FIRECRAWL_API_KEY=fc-...

# Video Generation (futuro)
ELEVENLABS_API_KEY=...
PICTORY_API_KEY=...

# Cron Security
CRON_SECRET=... # generar con: openssl rand -base64 32

# App URLs
NEXT_PUBLIC_URL=http://localhost:3000
Archivo: vercel.json
Crear configuración de Vercel Cron:
json{
  "crons": [{
    "path": "/api/cron/daily-bulletin",
    "schedule": "0 6 * * *"
  }]
}
Comentar que en desarrollo se puede testear el cron manualmente con:
bashcurl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/daily-bulletin
Archivo: lib/db/seed.ts
Crear script de seed para poblar datos iniciales:
Fuentes de noticias:
typescriptconst sources = [
  {
    name: 'Primicias',
    url: 'https://www.primicias.ec/',
    baseUrl: 'https://www.primicias.ec',
    scrapeConfig: {
      waitForSelector: 'article',
      excludeSelectors: ['nav', 'footer', '.ads'],
      includeImages: false
    },
    isActive: true
  },
  {
    name: 'La Hora',
    url: 'https://www.lahora.com.ec/',
    baseUrl: 'https://www.lahora.com.ec',
    scrapeConfig: {
      waitForSelector: '.article',
      excludeSelectors: ['nav', 'footer', '.advertisement'],
      includeImages: false
    },
    isActive: true
  }
];
Templates por categoría:
typescriptconst templates = [
  {
    name: 'Economía - Standard',
    category: 'economia',
    systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
    userPromptTemplate: SUMMARIZATION_USER_PROMPT_TEMPLATE,
    exampleOutput: 'El sector empresarial ecuatoriano registró un crecimiento del 3.2% en el último trimestre según cifras del BCE. Las exportaciones no petroleras alcanzaron los $2,500 millones, impulsadas principalmente por banano y camarón. Este desempeño sugiere una recuperación gradual de la economía post-pandemia.',
    maxWords: 50,
    tone: 'profesional',
    isActive: true,
    version: 1
  },
  // ... similar para las otras 5 categorías
];
Script debe:

Verificar si ya existen datos antes de insertar
Usar transacciones
Loggear cada inserción
Ser idempotente (puede ejecutarse múltiples veces sin duplicar)

Comando para ejecutar:
bashpnpm tsx lib/db/seed.ts
Archivo: README-BULLETIN.md
Documentación específica del sistema de boletines:
Debe incluir:

Arquitectura general

Diagrama de flujo del proceso completo
Explicación de cada paso
Dependencias entre componentes


Configuración inicial

Variables de entorno requeridas
Cómo obtener API keys
Setup de la base de datos
Ejecución del seed


Uso del sistema

Cómo generar un boletín manualmente
Cómo configurar el cron job
Cómo editar resúmenes
Cómo regenerar categorías específicas


Personalización

Cómo agregar nuevas fuentes de noticias
Cómo modificar prompts de AI
Cómo ajustar límites de palabras
Cómo personalizar el formato del video


Troubleshooting

Problemas comunes y soluciones
Qué hacer si el scraping falla
Cómo debug errores de AI
Cómo verificar logs


API Reference

Documentación de cada endpoint
Ejemplos de requests/responses
Códigos de error


Roadmap futuro

Integración completa de video
Analytics de boletines
A/B testing de formatos
Distribución automática



INSTRUCCIONES FINALES
Orden de implementación sugerido:

Primero: Schema de base de datos + migraciones
Segundo: Queries y helpers de DB
Tercero: Configuración de AI providers y prompts
Cuarto: Módulos de lógica (scraper, classifier, summarizer)
Quinto: API routes
Sexto: UI components
Séptimo: Seed data y configuración
Octavo: Testing manual y documentación

Consideraciones importantes:

Todos los archivos deben incluir comentarios explicativos
Usar TypeScript strict mode
Todas las funciones async deben tener manejo de errores
Los prompts de AI son críticos - deben ser muy específicos
La UI debe ser responsive (mobile-first)
Implementar loading states en todos los componentes
Usar React Server Components donde sea apropiado
El sistema debe ser resiliente a fallos parciales

Testing:
Para cada parte implementada, sugerir:

Casos de prueba manuales
Datos de ejemplo para testing
Comandos útiles para debug
Cómo simular errores

Notas de seguridad:

Validar todos los inputs de usuarios
Sanitizar datos scrapeados antes de procesamiento
Rate limiting en API routes públicos
Verificar autenticación en todos los endpoints privados
No exponer API keys en el cliente
Validar que CRON_SECRET es fuerte


RESUMEN
Este sistema creará un pipeline completo automatizado que:

✅ Scrapea noticias diariamente a las 6am
✅ Clasifica automáticamente en 6 categorías
✅ Genera resúmenes concisos con AI
✅ Prepara script para video (generación completa es fase 2)
✅ Provee UI intuitiva para gestión y visualización
✅ Es extensible y configurable

Todo usando el stack existente del proyecto OttoSeguridadai sin duplicar código ni crear dependencias innecesarias.Reintentar<html dir="ltr" lang="es-419" class="theme light EHoceA"><head><base href="/escrito-otto/"><meta charset="utf-8"><title>Resumen de noticias escrito pagina web</title><meta name="app-name" content="export_website"><meta name="viewport" content="width=device-width, initial-scale=1"><link href="_assetspastedFPme falto contexto quiero que tenga esta misma estructura colores y logos ya que la gente esta acostumbrada a este tipo de boletin y es gente mayor, o podemos poner dos versiones esta version y otra version mas moderna, deberia permitirnos cambiar solo con un clic a que version quieren verPerfecto Fausto, ahora entiendo el contexto completo. Quieres mantener el diseño familiar para tu audiencia mayor, pero también ofrecer flexibilidad con una versión moderna. Voy a actualizar el prompt para Claude Code con estos requisitos adicionales:

PROMPT ACTUALIZADO PARA CLAUDE CODE - SISTEMA DE BOLETINES CON DISEÑO DUAL
CONTEXTO ADICIONAL IMPORTANTE
El sistema debe generar boletines que se puedan visualizar en DOS formatos diferentes:

Versión Clásica: Replica el diseño actual que la audiencia ya conoce (gente mayor acostumbrada a este formato)
Versión Moderna: Diseño web responsive más actualizado

La audiencia debe poder cambiar entre ambas versiones con un solo clic.
ANÁLISIS DEL DISEÑO ACTUAL
Basado en el HTML proporcionado, el boletín actual tiene estas características:
Estructura visual:

Fondo blanco limpio
Header con imagen de fondo decorativa y título "RESUMEN DIARIO DE NOTICIAS" en Canva Sans Bold
Fecha en formato "Martes 11 de Noviembre de 2025"
Líneas horizontales grises (#c9c9c9) como separadores
6 secciones numeradas con títulos subrayados
Cada sección tiene:

Número y categoría (ej: "1. Economía") subrayado
Título de noticia en azul (#004aad) y negrita
Imagen ilustrativa (400-450px width)
Texto justificado en negro
Link "Leer más" en azul (#1a62ff) y subrayado


Footer con imagen decorativa
Logo corporativo en footer

Tipografía:

Títulos principales: Canva Sans Bold / Coco Gothic Bold
Títulos de noticias: Open Sans Bold (42-44px)
Cuerpo de texto: Open Sans Regular (37px)
Color principal: Negro (#000000)
Color de enlaces: Azul (#004aad, #1a62ff)

Colores corporativos:

Azul oscuro: #004aad
Azul enlace: #1a62ff
Gris separadores: #c9c9c9
Fondo: #ffffff

MODIFICACIONES AL SCHEMA DE BASE DE DATOS
Agregar a la tabla bulletins:
typescript// Agregar estos campos a la tabla bulletins existente
designVersion: texto, default 'classic', valores: 'classic', 'modern'
logoUrl: texto, nullable (URL del logo corporativo)
headerImageUrl: texto, nullable (URL de imagen de header)
footerImageUrl: texto, nullable (URL de imagen de footer)
brandColors: jsonb, nullable, estructura: {
  primary: string,      // #004aad
  secondary: string,    // #1a62ff
  accent: string,       // #c9c9c9
  background: string,   // #ffffff
  text: string          // #000000
}
Nueva tabla: bulletin_designs
typescript// Tabla para gestionar configuraciones de diseño
CREATE TABLE bulletin_designs (
  id: UUID, primary key, auto-generado
  name: texto, not null, valores: 'classic', 'modern'
  displayName: texto, not null (ej: "Diseño Clásico", "Diseño Moderno")
  description: texto
  isActive: boolean, default true
  cssTemplate: texto, (CSS específico del diseño)
  layoutConfig: jsonb, estructura: {
    showImages: boolean,
    imagePosition: 'top' | 'right' | 'left',
    sectionNumbering: boolean,
    fontSizes: {
      title: number,
      subtitle: number,
      body: number
    },
    spacing: {
      sectionGap: number,
      paragraphGap: number
    }
  }
  createdAt: timestamp, default now
  updatedAt: timestamp, default now
)
PARTE ADICIONAL: SISTEMA DE DISEÑO DUAL
Archivo: lib/bulletin/design-system.ts
Función: getDesignConfig(designVersion)
Debe retornar configuración completa del diseño seleccionado:
typescriptinterface DesignConfig {
  name: 'classic' | 'modern';
  layout: {
    maxWidth: string;
    containerPadding: string;
    sectionSpacing: string;
  };
  typography: {
    fontFamily: {
      heading: string;
      body: string;
    };
    sizes: {
      mainTitle: string;
      sectionTitle: string;
      newsTitle: string;
      body: string;
      date: string;
    };
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    link: string;
  };
  components: {
    showSectionNumbers: boolean;
    showImages: boolean;
    imagePosition: 'top' | 'side';
    underlineTitles: boolean;
    showSeparators: boolean;
    roundedCorners: boolean;
  };
}
Configuración Classic:
typescriptconst CLASSIC_DESIGN: DesignConfig = {
  name: 'classic',
  layout: {
    maxWidth: '1024px',
    containerPadding: '48px',
    sectionSpacing: '60px'
  },
  typography: {
    fontFamily: {
      heading: 'Coco Gothic, system-ui, sans-serif',
      body: 'Open Sans, system-ui, sans-serif'
    },
    sizes: {
      mainTitle: '44px',
      sectionTitle: '44px',
      newsTitle: '42px',
      body: '37px',
      date: '22px'
    }
  },
  colors: {
    primary: '#004aad',
    secondary: '#1a62ff',
    accent: '#c9c9c9',
    background: '#ffffff',
    text: '#000000',
    link: '#1a62ff'
  },
  components: {
    showSectionNumbers: true,
    showImages: true,
    imagePosition: 'top',
    underlineTitles: true,
    showSeparators: true,
    roundedCorners: false
  }
};
Configuración Modern:
typescriptconst MODERN_DESIGN: DesignConfig = {
  name: 'modern',
  layout: {
    maxWidth: '1200px',
    containerPadding: '24px',
    sectionSpacing: '48px'
  },
  typography: {
    fontFamily: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif'
    },
    sizes: {
      mainTitle: '48px',
      sectionTitle: '32px',
      newsTitle: '28px',
      body: '16px',
      date: '14px'
    }
  },
  colors: {
    primary: '#004aad',
    secondary: '#1a62ff',
    accent: '#e5e7eb',
    background: '#ffffff',
    text: '#1f2937',
    link: '#1a62ff'
  },
  components: {
    showSectionNumbers: false,
    showImages: true,
    imagePosition: 'side',
    underlineTitles: false,
    showSeparators: false,
    roundedCorners: true
  }
};
Archivo: components/bulletin/design-switcher.tsx
Component para cambiar entre diseños
Props:
typescriptinterface DesignSwitcherProps {
  currentDesign: 'classic' | 'modern';
  bulletinId: string;
  onDesignChange: (newDesign: 'classic' | 'modern') => void;
}
Debe mostrar:

Toggle switch o botones radio
Preview miniatura de cada diseño
Etiquetas claras: "Diseño Clásico" / "Diseño Moderno"
Tooltip explicando las diferencias
Loading state durante el cambio

El cambio debe ser instantáneo en el cliente, sin recargar la página.
Archivo: components/bulletin/bulletin-renderer.tsx
Component principal que renderiza el boletín según diseño seleccionado
Props:
typescriptinterface BulletinRendererProps {
  bulletin: Bulletin; // objeto completo del boletín
  design: 'classic' | 'modern';
  editable?: boolean;
}
Estructura interna:
typescript// Componente debe decidir qué layout usar
return design === 'classic' ? (
  <ClassicBulletinLayout bulletin={bulletin} editable={editable} />
) : (
  <ModernBulletinLayout bulletin={bulletin} editable={editable} />
);
Archivo: components/bulletin/classic-bulletin-layout.tsx
Layout que replica el diseño actual exactamente
Debe incluir:

Header con imagen decorativa y título centrado
Fecha debajo del título
Líneas separadoras grises horizontales
6 secciones con estructura idéntica:

Número y categoría subrayada (ej: "1. Economía")
Título de noticia en azul y negrita
Imagen centrada (full width o contenedor)
Texto justificado
Link "Leer más" en azul


Footer con imagen decorativa
Estilos inline o CSS que replique exactamente los del HTML original

CSS específico para classic:
css.classic-bulletin {
  max-width: 1024px;
  margin: 0 auto;
  background: #ffffff;
  font-family: 'Open Sans', sans-serif;
}

.classic-header {
  position: relative;
  height: 485px;
  background: url('/images/header-bg.png') center/cover;
}

.classic-title {
  font-family: 'Canva Sans', sans-serif;
  font-size: 44px;
  font-weight: 700;
  text-align: center;
  color: #000000;
}

.classic-date {
  font-size: 22px;
  text-align: center;
  color: #000000;
  margin-top: 16px;
}

.classic-separator {
  border: none;
  border-top: 2px solid #c9c9c9;
  margin: 24px 0;
}

.classic-section {
  margin: 60px 0;
}

.classic-section-title {
  font-family: 'Coco Gothic', sans-serif;
  font-size: 44px;
  font-weight: 700;
  text-decoration: underline;
  color: #000000;
  margin-bottom: 24px;
}

.classic-news-title {
  font-family: 'Open Sans', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #004aad;
  text-align: center;
  line-height: 1.4;
  margin: 24px 0;
}

.classic-news-image {
  width: 100%;
  max-width: 450px;
  height: auto;
  display: block;
  margin: 32px auto;
}

.classic-news-content {
  font-size: 37px;
  line-height: 1.5;
  text-align: justify;
  color: #000000;
  margin: 24px 0;
}

.classic-link {
  color: #1a62ff;
  text-decoration: underline;
  font-weight: 700;
}
Archivo: components/bulletin/modern-bulletin-layout.tsx
Layout moderno y responsive
Características:

Grid layout con sidebar opcional
Cards para cada noticia con sombra sutil
Imágenes con border-radius
Sin numeración visible de secciones
Tabs o accordion para categorías
Typography más compacta
Responsive design (mobile-first)
Animaciones suaves en hover
Badges para categorías en vez de números

CSS específico para modern:
css.modern-bulletin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Inter', sans-serif;
}

.modern-header {
  background: linear-gradient(135deg, #004aad 0%, #1a62ff 100%);
  padding: 48px 24px;
  border-radius: 16px;
  color: white;
  margin-bottom: 32px;
}

.modern-title {
  font-size: 48px;
  font-weight: 700;
  text-align: center;
  margin: 0;
}

.modern-date {
  font-size: 14px;
  text-align: center;
  opacity: 0.9;
  margin-top: 8px;
}

.modern-categories {
  display: flex;
  gap: 12px;
  margin: 32px 0;
  overflow-x: auto;
}

.modern-category-badge {
  padding: 8px 16px;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modern-category-badge.active {
  background: #004aad;
  color: white;
}

.modern-news-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 24px;
  margin-bottom: 24px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.modern-news-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modern-news-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  align-items: start;
}

.modern-news-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.modern-news-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.modern-news-content {
  font-size: 16px;
  line-height: 1.6;
  color: #4b5563;
  margin-bottom: 16px;
}

.modern-link {
  color: #1a62ff;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.modern-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .modern-news-grid {
    grid-template-columns: 1fr;
  }
  
  .modern-title {
    font-size: 32px;
  }
  
  .modern-news-title {
    font-size: 24px;
  }
}
PARTE ADICIONAL: API ROUTES PARA DISEÑO
Archivo: app/api/bulletin/[id]/design/route.ts
Endpoint: PATCH /api/bulletin/[id]/design
Request body:
typescript{
  design: 'classic' | 'modern'
}
Lógica:

Validar autenticación
Validar que bulletinId existe
Validar que design es válido
Actualizar campo designVersion en bulletin
Retornar bulletin actualizado

Response:
typescript{
  success: true,
  bulletin: {
    id: string,
    designVersion: 'classic' | 'modern',
    // ... resto de campos
  }
}
Archivo: app/api/bulletin/designs/route.ts
Endpoint: GET /api/bulletin/designs
Retorna lista de diseños disponibles con metadata:
Response:
typescript{
  designs: [
    {
      id: 'classic',
      displayName: 'Diseño Clásico',
      description: 'Diseño tradicional familiar para audiencia acostumbrada',
      previewImage: '/images/preview-classic.png',
      features: [
        'Números de sección visibles',
        'Tipografía grande y clara',
        'Separadores horizontales',
        'Imágenes centradas'
      ]
    },
    {
      id: 'modern',
      displayName: 'Diseño Moderno',
      description: 'Diseño actualizado y responsive',
      previewImage: '/images/preview-modern.png',
      features: [
        'Cards con sombras',
        'Layout en grid',
        'Responsive mobile',
        'Animaciones suaves'
      ]
    }
  ]
}
ACTUALIZACIÓN AL DASHBOARD
Modificar: app/dashboard/bulletin/[id]/page.tsx
Agregar nueva sección en la página de detalle:
typescript// Nuevo tab "Diseño"
<Tabs>
  <TabsList>
    <TabsTrigger value="summaries">Resúmenes</TabsTrigger>
    <TabsTrigger value="raw">Noticias Raw</TabsTrigger>
    <TabsTrigger value="classified">Clasificadas</TabsTrigger>
    <TabsTrigger value="logs">Logs</TabsTrigger>
    <TabsTrigger value="video">Video</TabsTrigger>
    <TabsTrigger value="design">Diseño</TabsTrigger> {/* NUEVO */}
  </TabsList>
  
  {/* ... otros tabs ... */}
  
  <TabsContent value="design">
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Selecciona el diseño del boletín
        </h3>
        <DesignSwitcher 
          currentDesign={bulletin.designVersion}
          bulletinId={bulletin.id}
          onDesignChange={handleDesignChange}
        />
      </div>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">
          Vista previa
        </h3>
        <BulletinRenderer 
          bulletin={bulletin}
          design={currentDesign}
          editable={false}
        />
      </div>
    </div>
  </TabsContent>
</Tabs>
Estado del componente:
typescriptconst [currentDesign, setCurrentDesign] = useState<'classic' | 'modern'>(
  bulletin.designVersion || 'classic'
);

async function handleDesignChange(newDesign: 'classic' | 'modern') {
  setCurrentDesign(newDesign);
  
  const response = await fetch(`/api/bulletin/${bulletin.id}/design`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ design: newDesign })
  });
  
  if (response.ok) {
    toast.success('Diseño actualizado correctamente');
  } else {
    toast.error('Error al actualizar diseño');
    setCurrentDesign(bulletin.designVersion); // revertir
  }
}
```

## PARTE ADICIONAL: ASSETS Y RECURSOS

### Directorio: public/images/bulletin/

Crear estructura de carpetas para assets del boletín:
```
public/
└── images/
    └── bulletin/
        ├── classic/
        │   ├── header-bg.png (imagen decorativa header)
        │   ├── footer-bg.png (imagen decorativa footer)
        │   └── logo.png (logo corporativo)
        ├── modern/
        │   └── logo.png (logo corporativo)
        └── previews/
            ├── classic-preview.png
            └── modern-preview.png
Archivo: lib/bulletin/assets.ts
Funciones helper para manejar assets:
typescriptexport function getHeaderImage(design: 'classic' | 'modern'): string | null {
  if (design === 'classic') {
    return '/images/bulletin/classic/header-bg.png';
  }
  return null; // modern no usa header image
}

export function getFooterImage(design: 'classic' | 'modern'): string | null {
  if (design === 'classic') {
    return '/images/bulletin/classic/footer-bg.png';
  }
  return null;
}

export function getLogo(design: 'classic' | 'modern'): string {
  return `/images/bulletin/${design}/logo.png`;
}

export function getPreviewImage(design: 'classic' | 'modern'): string {
  return `/images/bulletin/previews/${design}-preview.png`;
}
FUNCIONALIDAD DE EXPORTACIÓN
Archivo: app/api/bulletin/[id]/export/route.ts
Endpoint: GET /api/bulletin/[id]/export?design=classic
Query params:

design: 'classic' | 'modern' (opcional, usa el diseño actual por defecto)
format: 'html' | 'pdf' | 'image' (opcional, default 'html')

Debe generar HTML estático completo del boletín con el diseño seleccionado, incluyendo:

CSS inline o en <style> tag
Imágenes embebidas como base64 o URLs absolutas
Sin dependencias de JavaScript
Listo para imprimir o enviar por email

Para PDF: usar library como puppeteer o @react-pdf/renderer
Para Image: usar puppeteer con screenshot
PREFERENCIAS DE USUARIO
Nueva tabla: user_bulletin_preferences
typescriptCREATE TABLE user_bulletin_preferences (
  userId: UUID, foreign key a users(id)
  preferredDesign: texto, default 'classic', valores: 'classic', 'modern'
  emailFormat: texto, default 'html', valores: 'html', 'pdf'
  autoSwitchToModern: boolean, default false
  createdAt: timestamp, default now
  updatedAt: timestamp, default now
  PRIMARY KEY (userId)
)
Cuando un usuario cambia de diseño, guardar su preferencia para futuros boletines.
SEEDS ADICIONALES
Agregar al archivo: lib/db/seed.ts
typescript// Seed de diseños
const designs = [
  {
    name: 'classic',
    displayName: 'Diseño Clásico',
    description: 'Diseño tradicional con tipografía grande y estructura familiar',
    isActive: true,
    layoutConfig: {
      showImages: true,
      imagePosition: 'top',
      sectionNumbering: true,
      fontSizes: {
        title: 44,
        subtitle: 42,
        body: 37
      },
      spacing: {
        sectionGap: 60,
        paragraphGap: 24
      }
    }
  },
  {
    name: 'modern',
    displayName: 'Diseño Moderno',
    description: 'Diseño actualizado con cards y layout responsive',
    isActive: true,
    layoutConfig: {
      showImages: true,
      imagePosition: 'side',
      sectionNumbering: false,
      fontSizes: {
        title: 32,
        subtitle: 28,
        body: 16
      },
      spacing: {
        sectionGap: 48,
        paragraphGap: 16
      }
    }
  }
];

// Insertar en bulletin_designs
for (const design of designs) {
  await db.insert(bulletinDesigns).values(design);
}
DOCUMENTACIÓN ADICIONAL
Actualizar: README-BULLETIN.md
Agregar sección:
Sistema de Diseño Dual
El sistema permite visualizar boletines en dos diseños diferentes:

Diseño Clásico: Replica el formato original que la audiencia conoce

Tipografía grande y clara
Secciones numeradas
Separadores horizontales visibles
Imágenes centradas
Ideal para: Audiencia mayor, impresión


Diseño Moderno: Versión actualizada y responsive

Cards con sombras
Layout en grid
Sin numeración de secciones
Animaciones suaves
Ideal para: Web, mobile, audiencia joven



Cambiar diseño:

Ve al detalle del boletín
Click en tab "Diseño"
Selecciona entre "Clásico" o "Moderno"
Los cambios se aplican inmediatamente

Exportar con diseño específico:
bashGET /api/bulletin/{id}/export?design=classic&format=pdf

PRIORIDAD DE IMPLEMENTACIÓN
Fase 1 (Crítico):

Schema de DB con campo designVersion
design-system.ts con configuraciones
classic-bulletin-layout.tsx (réplica exacta)
modern-bulletin-layout.tsx
bulletin-renderer.tsx (switch)
design-switcher.tsx
API route para cambiar diseño

Fase 2 (Importante):

Tabla bulletin_designs
Sistema de assets
Actualización del dashboard con tab Diseño
Seeds de diseños

Fase 3 (Deseable):

Exportación con diseño
Preferencias de usuario
Preview images
Analytics por diseño

NOTAS CRÍTICAS

El diseño clásico debe ser EXACTO: Replica pixel por pixel el HTML original, incluyendo tamaños de fuente, espaciados, colores, posiciones
Assets del diseño clásico: Asegúrate de extraer y guardar las imágenes de header/footer del HTML original
Fuentes: El diseño clásico usa Canva Sans, Coco Gothic y Open Sans - estas deben cargarse correctamente
Responsive: Solo el diseño moderno necesita ser responsive, el clásico puede ser fixed-width
Default: Todos los boletines nuevos deben usar diseño 'classic' por defecto
Compatibilidad: El cambio de diseño no debe afectar el contenido del boletín, solo la presentación visual


Esto completa el prompt con el sistema de diseño dual. ¿Quieres que ajuste algo más o que profundice en alguna parte específica?ReintentarFPdevuelveme el prompt ya completo y bien estruurado en formato .MDPROMPT COMPLETO PARA CLAUDE CODE - SISTEMA DE BOLETINES DE NOTICIAS AUTOMATIZADO
CONTEXTO DEL PROYECTO
Estoy trabajando en un proyecto Next.js 15 existente llamado "OttoSeguridadai" que usa:

Next.js 15.4.6 con App Router y Turbopack
React 19.1.0
Drizzle ORM con PostgreSQL
Vercel AI SDK (@ai-sdk/openai, @ai-sdk/react)
OpenRouter para acceso a modelos AI
Better Auth para autenticación
Tailwind CSS 4 con shadcn/ui components

El proyecto ya tiene una estructura básica con autenticación y base de datos configurada.
OBJETIVO PRINCIPAL
Necesito agregar un sistema completo de generación automática de boletines de noticias que:

Scrapee diariamente noticias de fuentes ecuatorianas (Primicias y La Hora)
Clasifique automáticamente las noticias en 6 categorías usando AI
Genere resúmenes concisos para cada categoría
Prepare el contenido para posteriormente generar un video
Todo debe ejecutarse automáticamente cada día a las 6am
IMPORTANTE: Soporte para DOS diseños visuales diferentes (Clásico y Moderno) que el usuario puede cambiar con un clic

CONTEXTO DE AUDIENCIA Y DISEÑO
Audiencia principal: Personas mayores acostumbradas a un formato específico de boletín
Requisito de diseño dual:

Versión Clásica: Replica exactamente el diseño actual que la audiencia conoce (tipografía grande, estructura familiar)
Versión Moderna: Diseño web responsive más actualizado para audiencias más jóvenes o web
Los usuarios deben poder cambiar entre ambas versiones con un solo clic
El diseño NO afecta el contenido, solo la presentación visual

Características del diseño clásico existente (debe replicarse exactamente):

Fondo blanco limpio
Header con imagen decorativa y título "RESUMEN DIARIO DE NOTICIAS" en Canva Sans Bold (44px)
Fecha centrada debajo del título (22px)
Líneas horizontales grises (#c9c9c9) como separadores entre secciones
6 secciones numeradas con títulos subrayados en Coco Gothic Bold (44px)
Cada sección contiene:

Número y categoría subrayados (ej: "1. Economía")
Título de noticia en azul (#004aad) y negrita Open Sans (42px)
Imagen ilustrativa centrada (400-450px width)
Texto justificado en negro Open Sans (37px)
Link "Leer más" en azul (#1a62ff) subrayado y negrita


Footer con imagen decorativa
Logo corporativo

Colores corporativos:

Azul oscuro principal: #004aad
Azul enlaces: #1a62ff
Gris separadores: #c9c9c9
Fondo: #ffffff
Texto: #000000


ARQUITECTURA DE CARPETAS REQUERIDA
app/
├── api/
│   ├── news/
│   │   ├── scrape/
│   │   │   └── route.ts
│   │   ├── classify/
│   │   │   └── route.ts
│   │   ├── summarize/
│   │   │   └── route.ts
│   │   └── generate-video/
│   │       └── route.ts
│   ├── bulletin/
│   │   ├── [id]/
│   │   │   ├── design/
│   │   │   │   └── route.ts
│   │   │   └── export/
│   │   │       └── route.ts
│   │   └── designs/
│   │       └── route.ts
│   └── cron/
│       └── daily-bulletin/
│           └── route.ts
├── dashboard/
│   └── bulletin/
│       ├── page.tsx
│       ├── [id]/
│       │   └── page.tsx
│       └── components/
│           ├── bulletin-card.tsx
│           ├── bulletin-list.tsx
│           ├── generate-button.tsx
│           ├── design-switcher.tsx
│           ├── bulletin-renderer.tsx
│           ├── classic-bulletin-layout.tsx
│           └── modern-bulletin-layout.tsx
└── admin/
    └── bulletin-config/
        └── page.tsx

lib/
├── news/
│   ├── scraper.ts
│   ├── classifier.ts
│   ├── summarizer.ts
│   └── video-generator.ts
├── ai/
│   ├── providers.ts
│   └── prompts.ts
├── bulletin/
│   ├── design-system.ts
│   └── assets.ts
└── db/
    ├── schema.ts (modificar archivo existente)
    └── queries/
        ├── bulletins.ts
        ├── sources.ts
        ├── templates.ts
        └── designs.ts

components/
└── bulletin/
    ├── category-section.tsx
    ├── news-preview.tsx
    └── status-badge.tsx

public/
└── images/
    └── bulletin/
        ├── classic/
        │   ├── header-bg.png
        │   ├── footer-bg.png
        │   └── logo.png
        ├── modern/
        │   └── logo.png
        └── previews/
            ├── classic-preview.png
            └── modern-preview.png

PARTE 1: SCHEMA DE BASE DE DATOS
Instrucciones:

Abre el archivo existente lib/db/schema.ts
Agrega las siguientes tablas sin modificar las existentes:

Tabla: bulletins
typescriptexport const bulletins = pgTable('bulletins', {
  // Identificación
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date').notNull().defaultNow(),
  status: text('status').notNull().default('draft'),
  // Valores posibles: 'draft', 'scraping', 'classifying', 'summarizing', 
  // 'ready', 'video_processing', 'published', 'failed'
  
  // Datos de noticias
  rawNews: jsonb('raw_news').$type<{
    primicias: any[];
    laHora: any[];
    metadata: {
      totalArticles: number;
      scrapedAt: string;
    };
  }>(),
  
  classifiedNews: jsonb('classified_news').$type<{
    economia: any[];
    politica: any[];
    sociedad: any[];
    seguridad: any[];
    internacional: any[];
    vial: any[];
  }>(),
  
  // Resúmenes finales por categoría
  economia: text('economia'),
  politica: text('politica'),
  sociedad: text('sociedad'),
  seguridad: text('seguridad'),
  internacional: text('internacional'),
  vial: text('vial'),
  
  // Metadata
  totalNews: integer('total_news').default(0),
  
  // Video
  videoUrl: text('video_url'),
  videoStatus: text('video_status').default('pending'),
  // Valores: 'pending', 'processing', 'ready', 'failed'
  videoMetadata: jsonb('video_metadata').$type<{
    duration: number;
    fileSize: number;
    provider: string;
  }>(),
  
  // NUEVO: Diseño visual
  designVersion: text('design_version').notNull().default('classic'),
  // Valores: 'classic', 'modern'
  logoUrl: text('logo_url'),
  headerImageUrl: text('header_image_url'),
  footerImageUrl: text('footer_image_url'),
  brandColors: jsonb('brand_colors').$type<{
    primary: string;      // #004aad
    secondary: string;    // #1a62ff
    accent: string;       // #c9c9c9
    background: string;   // #ffffff
    text: string;         // #000000
  }>(),
  
  // Logs y errores
  errorLog: jsonb('error_log'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  publishedAt: timestamp('published_at'),
});
Tabla: news_sources
typescriptexport const newsSources = pgTable('news_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  baseUrl: text('base_url').notNull(),
  selector: text('selector'),
  scrapeConfig: jsonb('scrape_config').$type<{
    waitForSelector: string;
    excludeSelectors: string[];
    includeImages: boolean;
  }>(),
  isActive: boolean('is_active').default(true),
  lastScraped: timestamp('last_scraped'),
  lastScrapedStatus: text('last_scraped_status'),
  // Valores: 'success', 'failed', 'partial'
  totalScraped: integer('total_scraped').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
Tabla: bulletin_templates
typescriptexport const bulletinTemplates = pgTable('bulletin_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  // Valores: 'economia', 'politica', 'sociedad', 'seguridad', 
  // 'internacional', 'vial'
  systemPrompt: text('system_prompt').notNull(),
  userPromptTemplate: text('user_prompt_template').notNull(),
  exampleOutput: text('example_output'),
  maxWords: integer('max_words').default(50),
  tone: text('tone').default('profesional'),
  // Valores: 'profesional', 'casual', 'formal'
  isActive: boolean('is_active').default(true),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
Tabla: bulletin_designs
typescriptexport const bulletinDesigns = pgTable('bulletin_designs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // Valores: 'classic', 'modern'
  displayName: text('display_name').notNull(),
  // ej: "Diseño Clásico", "Diseño Moderno"
  description: text('description'),
  isActive: boolean('is_active').default(true),
  cssTemplate: text('css_template'),
  layoutConfig: jsonb('layout_config').$type<{
    showImages: boolean;
    imagePosition: 'top' | 'right' | 'left';
    sectionNumbering: boolean;
    fontSizes: {
      title: number;
      subtitle: number;
      body: number;
    };
    spacing: {
      sectionGap: number;
      paragraphGap: number;
    };
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
Tabla: bulletin_logs
typescriptexport const bulletinLogs = pgTable('bulletin_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  bulletinId: uuid('bulletin_id').references(() => bulletins.id),
  step: text('step').notNull(),
  // Valores: 'scraping', 'classification', 'summarization', 'video_generation'
  status: text('status').notNull(),
  // Valores: 'started', 'completed', 'failed'
  message: text('message'),
  metadata: jsonb('metadata'),
  duration: integer('duration'), // milisegundos
  createdAt: timestamp('created_at').defaultNow(),
});
Tabla: user_bulletin_preferences
typescriptexport const userBulletinPreferences = pgTable('user_bulletin_preferences', {
  userId: uuid('user_id').primaryKey(),
  // foreign key a users(id) - ajustar según tu tabla de usuarios
  preferredDesign: text('preferred_design').default('classic'),
  // Valores: 'classic', 'modern'
  emailFormat: text('email_format').default('html'),
  // Valores: 'html', 'pdf'
  autoSwitchToModern: boolean('auto_switch_to_modern').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
Después de crear el schema:
bashpnpm run db:generate
pnpm run db:migrate

PARTE 2: QUERIES Y HELPERS DE BASE DE DATOS
Archivo: lib/db/queries/bulletins.ts
Crea funciones TypeScript con Drizzle ORM para:
Funciones CRUD básicas:

createBulletin(): crear nuevo boletín con status 'draft' y designVersion 'classic'
getBulletinById(id): obtener boletín por ID con todos sus campos
getAllBulletins(options): obtener lista con paginación, filtros por status/fecha, orden desc
updateBulletinStatus(id, status): actualizar solo el status
updateBulletinRawNews(id, rawNews, totalNews): actualizar noticias scrapeadas
updateBulletinClassification(id, classifiedNews): actualizar clasificación
updateBulletinSummaries(id, summaries): actualizar los 6 resúmenes (objeto con economia, politica, etc.)
updateBulletinVideo(id, videoData): actualizar info de video
updateBulletinDesign(id, designVersion): NUEVO actualizar diseño visual

Funciones de consulta:

getBulletinsByDateRange(startDate, endDate): boletines en rango
getTodayBulletin(): boletín de hoy si existe
getLatestBulletin(): boletín más reciente

Funciones de logs:

createBulletinLog(bulletinId, step, status, message, metadata): crear log
getBulletinLogs(bulletinId): obtener todos los logs

Requisitos generales:

Usar Drizzle ORM
Try-catch en todas las funciones
Tipos TypeScript apropiados
Comentarios explicativos

Archivo: lib/db/queries/sources.ts
typescript// Funciones para manejar fuentes de noticias
- getActiveSources(): obtener fuentes activas
- getSourceByName(name): obtener fuente por nombre
- updateSourceLastScraped(id, status): actualizar última vez scrapeada
- createSource(data): crear nueva fuente
- updateSource(id, data): actualizar fuente
Archivo: lib/db/queries/templates.ts
typescript// Funciones para templates de prompts
- getActiveTemplates(): obtener todos los templates activos
- getTemplateByCategory(category): obtener template de categoría específica
- createTemplate(data): crear nuevo template
- updateTemplate(id, data): actualizar template
- getTemplateHistory(category): historial de versiones por categoría
Archivo: lib/db/queries/designs.ts
typescript// NUEVO: Funciones para manejar diseños
- getAllDesigns(): obtener todos los diseños disponibles
- getDesignByName(name): obtener configuración de diseño específico
- getActiveDesigns(): obtener solo diseños activos
- updateDesignConfig(id, config): actualizar configuración de diseño

PARTE 3: SISTEMA DE DISEÑO DUAL
Archivo: lib/bulletin/design-system.ts
Interface principal:
typescriptinterface DesignConfig {
  name: 'classic' | 'modern';
  layout: {
    maxWidth: string;
    containerPadding: string;
    sectionSpacing: string;
  };
  typography: {
    fontFamily: {
      heading: string;
      body: string;
    };
    sizes: {
      mainTitle: string;
      sectionTitle: string;
      newsTitle: string;
      body: string;
      date: string;
    };
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    link: string;
  };
  components: {
    showSectionNumbers: boolean;
    showImages: boolean;
    imagePosition: 'top' | 'side';
    underlineTitles: boolean;
    showSeparators: boolean;
    roundedCorners: boolean;
  };
}
Función: getDesignConfig(designVersion: 'classic' | 'modern'): DesignConfig
Debe retornar la configuración completa según el diseño.
Configuración CLASSIC (debe replicar exactamente el diseño original):
typescriptexport const CLASSIC_DESIGN: DesignConfig = {
  name: 'classic',
  layout: {
    maxWidth: '1024px',
    containerPadding: '48px',
    sectionSpacing: '60px'
  },
  typography: {
    fontFamily: {
      heading: "'Coco Gothic', 'Canva Sans', system-ui, sans-serif",
      body: "'Open Sans', system-ui, sans-serif"
    },
    sizes: {
      mainTitle: '44px',
      sectionTitle: '44px',
      newsTitle: '42px',
      body: '37px',
      date: '22px'
    }
  },
  colors: {
    primary: '#004aad',
    secondary: '#1a62ff',
    accent: '#c9c9c9',
    background: '#ffffff',
    text: '#000000',
    link: '#1a62ff'
  },
  components: {
    showSectionNumbers: true,
    showImages: true,
    imagePosition: 'top',
    underlineTitles: true,
    showSeparators: true,
    roundedCorners: false
  }
};
Configuración MODERN:
typescriptexport const MODERN_DESIGN: DesignConfig = {
  name: 'modern',
  layout: {
    maxWidth: '1200px',
    containerPadding: '24px',
    sectionSpacing: '48px'
  },
  typography: {
    fontFamily: {
      heading: "'Inter', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif"
    },
    sizes: {
      mainTitle: '48px',
      sectionTitle: '32px',
      newsTitle: '28px',
      body: '16px',
      date: '14px'
    }
  },
  colors: {
    primary: '#004aad',
    secondary: '#1a62ff',
    accent: '#e5e7eb',
    background: '#ffffff',
    text: '#1f2937',
    link: '#1a62ff'
  },
  components: {
    showSectionNumbers: false,
    showImages: true,
    imagePosition: 'side',
    underlineTitles: false,
    showSeparators: false,
    roundedCorners: true
  }
};
Archivo: lib/bulletin/assets.ts
Funciones helper para manejar assets:
typescriptexport function getHeaderImage(design: 'classic' | 'modern'): string | null {
  if (design === 'classic') {
    return '/images/bulletin/classic/header-bg.png';
  }
  return null; // modern no usa header image
}

export function getFooterImage(design: 'classic' | 'modern'): string | null {
  if (design === 'classic') {
    return '/images/bulletin/classic/footer-bg.png';
  }
  return null;
}

export function getLogo(design: 'classic' | 'modern'): string {
  return `/images/bulletin/${design}/logo.png`;
}

export function getPreviewImage(design: 'classic' | 'modern'): string {
  return `/images/bulletin/previews/${design}-preview.png`;
}

PARTE 4: CONFIGURACIÓN DE AI PROVIDERS
Archivo: lib/ai/providers.ts
Crear configuración reutilizable para:
Provider: Claude via OpenRouter
typescriptimport { createOpenAI } from '@ai-sdk/openai';

export function getClaudeModel() {
  return createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  })('anthropic/claude-sonnet-4-20250514');
}

// Configuración por defecto
export const DEFAULT_AI_CONFIG = {
  temperature: 0.3,
  maxTokens: 4000,
  timeout: 60000, // 60 segundos
  retries: 3,
};
Provider: GPT-4 via OpenRouter (backup)
typescriptexport function getGPTModel() {
  return createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  })('openai/gpt-4-turbo');
}
Archivo: lib/ai/prompts.ts
Crear templates de prompts como constantes exportables:
CLASSIFICATION_SYSTEM_PROMPT:
typescriptexport const CLASSIFICATION_SYSTEM_PROMPT = `Eres un clasificador experto de noticias ecuatorianas. Tu tarea es categorizar artículos de noticias en 6 categorías específicas.

CATEGORÍAS:
1. Economía: noticias sobre empresas, mercados, finanzas, comercio, empleo, inflación, PIB
2. Política: elecciones, gobierno, leyes, partidos políticos, funcionarios públicos, reformas
3. Sociedad: educación, salud, cultura, deportes, eventos sociales, comunidad
4. Seguridad: crimen, policía, narcotráfico, violencia, emergencias, desastres naturales
5. Internacional: geopolítica, economía global, relaciones internacionales, noticias de otros países
6. Vial: estado de carreteras, accidentes de tránsito, obras viales, cierres de vías en Ecuador

REGLAS:
- Una noticia puede pertenecer a múltiples categorías
- Si una noticia no encaja claramente en ninguna categoría, omítela
- Prioriza las noticias más relevantes e importantes
- Incluye el título, resumen breve, y categorías asignadas`;
CLASSIFICATION_USER_PROMPT_TEMPLATE:
typescriptexport const CLASSIFICATION_USER_PROMPT_TEMPLATE = `Clasifica las siguientes noticias scrapeadas:

{{NEWS_DATA}}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "economia": [
    { "title": "...", "summary": "...", "url": "...", "source": "...", "date": "..." }
  ],
  "politica": [...],
  "sociedad": [...],
  "seguridad": [...],
  "internacional": [...],
  "vial": [...]
}

IMPORTANTE: 
- NO incluyas texto adicional antes o después del JSON
- Asegúrate de que el JSON sea válido y parseable
- Si una categoría no tiene noticias, incluye un array vacío []`;
SUMMARIZATION_SYSTEM_PROMPT:
typescriptexport const SUMMARIZATION_SYSTEM_PROMPT = `Eres un editor de noticias profesional ecuatoriano especializado en crear resúmenes concisos y claros para boletines diarios.

ESTILO:
- Tono: profesional pero accesible, no sensacionalista
- Estructura: directo al punto, sin relleno
- Datos: incluye cifras específicas cuando estén disponibles
- Contexto: asume que el lector es ecuatoriano y conoce el contexto básico del país

FORMATO:
- Máximo {{MAX_WORDS}} palabras por categoría
- 2-3 oraciones bien estructuradas
- Primera oración: el hecho más importante
- Segunda oración: contexto o consecuencias
- Tercera oración (opcional): dato adicional relevante`;
SUMMARIZATION_USER_PROMPT_TEMPLATE:
typescriptexport const SUMMARIZATION_USER_PROMPT_TEMPLATE = `Resume las siguientes noticias de la categoría "{{CATEGORY}}" para un boletín diario:

{{CLASSIFIED_NEWS}}

EJEMPLO DE FORMATO ESPERADO:
{{EXAMPLE_OUTPUT}}

Genera un resumen cohesivo que integre las noticias más importantes, manteniendo el estilo del ejemplo.

RESUMEN ({{MAX_WORDS}} palabras máximo):`;

PARTE 5: MÓDULOS DE LÓGICA DE NEGOCIO
Archivo: lib/news/scraper.ts
Función principal: scrapeAllSources()
Debe:

Obtener fuentes activas: getActiveSources()
Para cada fuente, scrapear con Firecrawl API
Endpoint: https://api.firecrawl.dev/v1/scrape
Método: POST
Headers: Authorization: Bearer ${process.env.FIRECRAWL_API_KEY}
Body:

json{
  "url": "URL_DE_LA_FUENTE",
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "waitFor": 2000,
  "removeBase64Images": true
}

Retornar estructura:

typescript{
  primicias: Array<{ title, content, url, scrapedAt, source }>,
  laHora: Array<{ title, content, url, scrapedAt, source }>,
  metadata: { totalArticles, scrapedAt, sources }
}
Función auxiliar: parseFirecrawlResponse(response, sourceName)

Extraer artículos del markdown/html
Identificar títulos (headers h1-h3)
Limpiar contenido (remover ads, menus, footers)
Retornar array estructurado

Función auxiliar: validateArticle(article)

Verificar título (mínimo 10 caracteres)
Verificar contenido (mínimo 50 caracteres)
Verificar URL válida
Retornar boolean

Manejo de errores:

Timeout: 30 segundos por fuente
Retry: 3 intentos con backoff exponencial (2s, 4s, 8s)
Log detallado de errores
Si una fuente falla, continuar con las demás
Retornar resultados parciales si es posible

Archivo: lib/news/classifier.ts
Función principal: classifyNews(rawNews, bulletinId)
Debe:

Recibir rawNews con todas las noticias
Crear log: createBulletinLog(bulletinId, 'classification', 'started', ...)
Preparar prompt usando templates
Reemplazar {{NEWS_DATA}} con JSON de rawNews
Llamar Claude API:

typescriptimport { generateText } from 'ai';
import { getClaudeModel } from '@/lib/ai/providers';

const { text } = await generateText({
  model: getClaudeModel(),
  system: CLASSIFICATION_SYSTEM_PROMPT,
  prompt: userPrompt,
  temperature: 0.3,
  maxTokens: 4000
});

Parsear JSON de respuesta
Validar estructura (6 categorías)
Actualizar: updateBulletinClassification(bulletinId, classified)
Log completado
Retornar clasificación

Función auxiliar: validateClassification(classified)

Verificar 6 propiedades
Verificar arrays
Verificar elementos con title, summary, url, source
Retornar { valid: boolean, errors: string[] }

Función auxiliar: extractJSONFromResponse(text)

Manejar markdown (json ... )
Remover texto extra
Parsear JSON
Retry con regex si falla
Retornar objeto o throw error

Archivo: lib/news/summarizer.ts
Función principal: summarizeByCategory(classifiedNews, bulletinId)
Debe:

Crear log de inicio
Obtener templates: getActiveTemplates()
Para cada categoría:

Obtener noticias de esa categoría
Si no hay: asignar "No hay información disponible para esta categoría hoy"
Si hay:

Obtener template
Preparar prompt (reemplazar placeholders)
Llamar Claude API
Recibir resumen




Construir objeto summaries
Actualizar: updateBulletinSummaries(bulletinId, summaries)
Log completado
Retornar summaries

Función alternativa: summarizeWithStreaming(classifiedNews, bulletinId, onChunk)
Similar pero con streaming:
typescriptimport { streamText } from 'ai';

const stream = await streamText({
  model: getClaudeModel(),
  system: SUMMARIZATION_SYSTEM_PROMPT,
  prompt: userPrompt,
  onChunk: (chunk) => onChunk(category, chunk),
  onFinish: (result) => {
    // Guardar resumen completo
  }
});
Función auxiliar: validateSummary(summary, maxWords)

Contar palabras
Verificar límite (maxWords + 10% tolerancia)
Verificar mínimo 20 palabras
Retornar { valid: boolean, wordCount: number, error?: string }

Archivo: lib/news/video-generator.ts
Función principal: prepareVideoScript(bulletin)
Debe:

Recibir bulletin completo
Crear script estructurado:

typescript{
  intro: string,
  sections: [
    { category, title, content, duration },
    // ... resto
  ],
  outro: string,
  totalDuration: number,
  metadata: { bulletinId, date, totalWords }
}

Calcular duración (150 palabras/minuto)
Formatear para narración
Retornar script

Función auxiliar: generateIntro(date)

"Buenos días, hoy es [fecha], y este es tu resumen de noticias del día."
Formatear fecha en español
Retornar texto

Función auxiliar: generateOutro()

"Esto es todo por hoy. Gracias por tu atención y que tengas un excelente día."

Función placeholder: generateVideoWithAPI(script, bulletinId)

Stub para futura implementación
Comentarios sobre integración con ElevenLabs/Pictory/FFmpeg
Por ahora retornar mock:

typescript{
  status: 'pending',
  message: 'Video generation not implemented yet',
  scriptPrepared: true
}

PARTE 6: COMPONENTES DE DISEÑO
Archivo: components/bulletin/design-switcher.tsx
Props:
typescriptinterface DesignSwitcherProps {
  currentDesign: 'classic' | 'modern';
  bulletinId: string;
  onDesignChange: (newDesign: 'classic' | 'modern') => void;
}
Debe mostrar:

Toggle switch o botones radio con estilos de shadcn/ui
Labels claros: "Diseño Clásico" / "Diseño Moderno"
Preview miniatura de cada diseño
Tooltip con descripción de diferencias
Loading state durante cambio
Feedback visual del diseño activo

Funcionalidad:
typescriptasync function handleChange(newDesign: 'classic' | 'modern') {
  setLoading(true);
  try {
    const response = await fetch(`/api/bulletin/${bulletinId}/design`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ design: newDesign })
    });
    
    if (response.ok) {
      onDesignChange(newDesign);
      toast.success('Diseño actualizado');
    }
  } catch (error) {
    toast.error('Error al cambiar diseño');
  } finally {
    setLoading(false);
  }
}
Archivo: components/bulletin/bulletin-renderer.tsx
Props:
typescriptinterface BulletinRendererProps {
  bulletin: Bulletin;
  design: 'classic' | 'modern';
  editable?: boolean;
}
Estructura:
typescriptexport function BulletinRenderer({ bulletin, design, editable }: BulletinRendererProps) {
  return design === 'classic' ? (
    <ClassicBulletinLayout bulletin={bulletin} editable={editable} />
  ) : (
    <ModernBulletinLayout bulletin={bulletin} editable={editable} />
  );
}
Archivo: components/bulletin/classic-bulletin-layout.tsx
CRÍTICO: Este componente debe replicar EXACTAMENTE el diseño del HTML original
Estructura HTML:
tsx<div className="classic-bulletin">
  {/* Header con imagen decorativa */}
  <header className="classic-header">
    <div className="classic-header-bg">
      <Image src={getHeaderImage('classic')} alt="" />
    </div>
    <h1 className="classic-title">RESUMEN DIARIO DE NOTICIAS</h1>
    <p className="classic-date">{formatDate(bulletin.date)}</p>
  </header>
  
  {/* Separador superior */}
  <hr className="classic-separator" />
  <hr className="classic-separator" />
  
  {/* Secciones de noticias */}
  {CATEGORIES.map((category, index) => (
    <section key={category} className="classic-section">
      <h2 className="classic-section-title">
        {index + 1}. {formatCategoryName(category)}
      </h2>
      
      {bulletin[category] && (
        <>
          <h3 className="classic-news-title">
            {getNewsTitle(bulletin, category)}
          </h3>
          
          <Image 
            src={getNewsImage(bulletin, category)}
            alt=""
            className="classic-news-image"
          />
          
          <p className="classic-news-content">
            {bulletin[category]}
          </p>
          
          <a href={getNewsUrl(bulletin, category)} className="classic-link">
            Leer más
          </a>
        </>
      )}
      
      <hr className="classic-separator" />
    </section>
  ))}
  
  {/* Footer */}
  <footer className="classic-footer">
    <Image src={getFooterImage('classic')} alt="" />
  </footer>
</div>
CSS (debe ir en globals.css o como módulo CSS):
css.classic-bulletin {
  max-width: 1024px;
  margin: 0 auto;
  background: #ffffff;
  font-family: 'Open Sans', system-ui, sans-serif;
  padding: 0;
}

.classic-header {
  position: relative;
  min-height: 485px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 48px;
}

.classic-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 235px;
  overflow: hidden;
}

.classic-header-bg img {
  width: 100%;
  height: auto;
}

.classic-title {
  font-family: 'Canva Sans', 'Coco Gothic', sans-serif;
  font-size: 44px;
  font-weight: 700;
  text-align: center;
  color: #000000;
  margin: 0;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.classic-date {
  font-family: 'Open Sans', sans-serif;
  font-size: 22px;
  font-weight: 400;
  text-align: center;
  color: #000000;
  margin: 16px 0 0 0;
  position: relative;
  z-index: 1;
}

.classic-separator {
  border: none;
  border-top: 2px solid #c9c9c9;
  margin: 24px 48px;
}

.classic-section {
  padding: 0 48px;
  margin: 60px 0;
}

.classic-section-title {
  font-family: 'Coco Gothic', sans-serif;
  font-size: 44px;
  font-weight: 700;
  text-decoration: underline;
  color: #000000;
  margin: 0 0 24px 0;
}

.classic-news-title {
  font-family: 'Open Sans', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #004aad;
  text-align: center;
  line-height: 1.4;
  margin: 32px 0;
}

.classic-news-image {
  width: 100%;
  max-width: 450px;
  height: auto;
  display: block;
  margin: 32px auto;
}

.classic-news-content {
  font-family: 'Open Sans', sans-serif;
  font-size: 37px;
  line-height: 1.5;
  text-align: justify;
  color: #000000;
  margin: 24px 0;
}

.classic-link {
  font-family: 'Open Sans', sans-serif;
  font-size: 37px;
  font-weight: 700;
  color: #1a62ff;
  text-decoration: underline;
  display: block;
  margin-top: 16px;
}

.classic-footer {
  margin-top: 60px;
  text-align: center;
}

.classic-footer img {
  width: 100%;
  max-width: 1024px;
  height: auto;
}
Archivo: components/bulletin/modern-bulletin-layout.tsx
Layout moderno con diseño actualizado
Estructura:
tsx<div className="modern-bulletin">
  {/* Header con gradiente */}
  <header className="modern-header">
    <h1 className="modern-title">Resumen Diario de Noticias</h1>
    <p className="modern-date">{formatDate(bulletin.date)}</p>
  </header>
  
  {/* Badges de categorías (tabs/filtros) */}
  <div className="modern-categories">
    {CATEGORIES.map(category => (
      <button 
        key={category}
        className={cn("modern-category-badge", {
          active: activeCategory === category
        })}
        onClick={() => setActiveCategory(category)}
      >
        {formatCategoryName(category)}
      </button>
    ))}
  </div>
  
  {/* Cards de noticias */}
  <div className="modern-news-container">
    {CATEGORIES.map(category => (
      <article key={category} className="modern-news-card">
        <div className="modern-news-grid">
          <Image 
            src={getNewsImage(bulletin, category)}
            alt=""
            className="modern-news-image"
          />
          
          <div className="modern-news-content-wrapper">
            <h2 className="modern-news-title">
              {getNewsTitle(bulletin, category)}
            </h2>
            
            <p className="modern-news-content">
              {bulletin[category]}
            </p>
            
            <a href={getNewsUrl(bulletin, category)} className="modern-link">
              Leer más →
            </a>
          </div>
        </div>
      </article>
    ))}
  </div>
</div>
CSS:
css.modern-bulletin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Inter', system-ui, sans-serif;
}

.modern-header {
  background: linear-gradient(135deg, #004aad 0%, #1a62ff 100%);
  padding: 48px 24px;
  border-radius: 16px;
  color: white;
  margin-bottom: 32px;
  text-align: center;
}

.modern-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0;
}

.modern-date {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 8px;
}

.modern-categories {
  display: flex;
  gap: 12px;
  margin: 32px 0;
  overflow-x: auto;
  padding-bottom: 8px;
}

.modern-category-badge {
  padding: 8px 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.modern-category-badge:hover {
  background: #e5e7eb;
}

.modern-category-badge.active {
  background: #004aad;
  color: white;
}

.modern-news-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modern-news-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.modern-news-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modern-news-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  align-items: start;
}

.modern-news-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.modern-news-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.modern-news-content {
  font-size: 16px;
  line-height: 1.6;
  color: #4b5563;
  margin-bottom: 16px;
}

.modern-link {
  color: #1a62ff;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
}

.modern-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .modern-bulletin {
    padding: 16px;
  }
  
  .modern-header {
    padding: 32px 16px;
  }
  
  .modern-title {
    font-size: 32px;
  }
  
  .modern-news-grid {
    grid-template-columns: 1fr;
  }
  
  .modern-news-title {
    font-size: 24px;
  }
  
  .modern-news-content {
    font-size: 14px;
  }
}

PARTE 7: API ROUTES
Archivo: app/api/news/scrape/route.ts
Endpoint: POST /api/news/scrape
Request body:
typescript{
  sources?: string[] // opcional, default ['primicias', 'lahora']
}
Lógica:

Validar autenticación (usar better-auth)
Verificar bulletin de hoy: getTodayBulletin()
Si existe y está en proceso, retornar error
Crear bulletin: createBulletin()
Llamar: scrapeAllSources()
Actualizar: updateBulletinRawNews(bulletinId, scrapedData, totalArticles)
Actualizar status a 'draft'
Retornar:

typescript{
  success: true,
  bulletinId: string,
  totalNews: number,
  sources: string[],
  message: string
}
Archivo: app/api/news/classify/route.ts
Endpoint: POST /api/news/classify
Request body:
typescript{
  bulletinId: string
}
Lógica:

Validar autenticación
Obtener bulletin: getBulletinById(id)
Validar rawNews existe
Actualizar status a 'classifying'
Llamar: classifyNews(bulletin.rawNews, bulletinId)
Si exitoso, status a 'classified'
Retornar:

typescript{
  success: true,
  bulletinId: string,
  classified: object,
  totalClassified: number,
  breakdown: { economia: number, politica: number, ... }
}
Archivo: app/api/news/summarize/route.ts
Endpoint: POST /api/news/summarize
Request body:
typescript{
  bulletinId: string,
  streaming?: boolean
}
Lógica non-streaming:

Validar autenticación
Obtener bulletin y validar classifiedNews
Status a 'summarizing'
Llamar: summarizeByCategory(classifiedNews, bulletinId)
Status a 'ready'
Retornar summaries

Lógica streaming:

Mismas validaciones
Usar streamText con callback
Retornar ReadableStream
Al terminar, actualizar bulletin

Archivo: app/api/news/generate-video/route.ts
Endpoint: POST /api/news/generate-video
Request body:
typescript{
  bulletinId: string
}
Lógica:

Validar autenticación
Obtener bulletin completo
Validar status 'ready'
videoStatus a 'processing'
Llamar: prepareVideoScript(bulletin)
Guardar script en metadata
Llamar: generateVideoWithAPI(script, bulletinId) (mock)
Retornar:

typescript{
  success: true,
  bulletinId: string,
  videoStatus: string,
  script: object,
  message: string
}
Archivo: app/api/bulletin/[id]/design/route.ts
Endpoint: PATCH /api/bulletin/[id]/design
Request body:
typescript{
  design: 'classic' | 'modern'
}
Lógica:

Validar autenticación
Validar bulletinId existe
Validar design válido
Actualizar: updateBulletinDesign(id, design)
Retornar:

typescript{
  success: true,
  bulletin: {
    id: string,
    designVersion: 'classic' | 'modern',
    // ... resto
  }
}
Archivo: app/api/bulletin/designs/route.ts
Endpoint: GET /api/bulletin/designs
Lógica:

Obtener: getAllDesigns()
Retornar:

typescript{
  designs: [
    {
      id: 'classic',
      displayName: 'Diseño Clásico',
      description: 'Diseño tradicional familiar',
      previewImage: '/images/bulletin/previews/classic-preview.png',
      features: [
        'Números de sección visibles',
        'Tipografía grande y clara',
        'Separadores horizontales',
        'Imágenes centradas'
      ]
    },
    {
      id: 'modern',
      displayName: 'Diseño Moderno',
      description: 'Diseño actualizado y responsive',
      previewImage: '/images/bulletin/previews/modern-preview.png',
      features: [
        'Cards con sombras',
        'Layout en grid',
        'Responsive mobile',
        'Animaciones suaves'
      ]
    }
  ]
}
Archivo: app/api/bulletin/[id]/export/route.ts
Endpoint: GET /api/bulletin/[id]/export
Query params:

design: 'classic' | 'modern' (opcional, usa actual por defecto)
format: 'html' | 'pdf' | 'image' (opcional, default 'html')

Lógica:

Obtener bulletin
Generar HTML estático con diseño seleccionado
CSS inline o en <style>
Imágenes como base64 o URLs absolutas
Sin JavaScript
Si format='pdf': usar puppeteer
Si format='image': screenshot con puppeteer
Retornar archivo generado

Archivo: app/api/cron/daily-bulletin/route.ts
Endpoint: GET /api/cron/daily-bulletin
Headers:

Authorization: Bearer ${CRON_SECRET}

Lógica:

Validar header de autorización
Verificar bulletin de hoy existe, si sí, return early
Ejecutar pipeline en secuencia:
a. POST /api/news/scrape
b. Extraer bulletinId
c. POST /api/news/classify con bulletinId
d. POST /api/news/summarize con bulletinId
e. POST /api/news/generate-video con bulletinId
Retornar:

typescript{
  success: true,
  bulletinId: string,
  executedAt: string,
  pipeline: {
    scraping: { status, duration },
    classification: { status, duration },
    summarization: { status, duration },
    video: { status, duration }
  }
}
Para llamadas internas:
typescriptconst baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const response = await fetch(`${baseUrl}/api/news/scrape`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... })
});

PARTE 8: DASHBOARD Y UI
Archivo: app/dashboard/bulletin/page.tsx
Página principal de boletines
Debe mostrar:

Header con título "Boletines Diarios"
Botón "Generar Nuevo Boletín" (si no hay uno de hoy procesando)
Filtros:

Date range picker
Multi-select de status
Botón "Limpiar filtros"


Lista de boletines (usar BulletinList component)
Paginación (si > 20 boletines)
Loading states
Empty state

Funcionalidad generar:
typescriptconst [generating, setGenerating] = useState(false);

async function handleGenerate() {
  setGenerating(true);
  
  // 1. Scrape
  const scrapeRes = await fetch('/api/news/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources: ['primicias', 'lahora'] })
  });
  const { bulletinId } = await scrapeRes.json();
  
  // 2. Classify
  await fetch('/api/news/classify', {
    method: 'POST',
    body: JSON.stringify({ bulletinId })
  });
  
  // 3. Summarize
  await fetch('/api/news/summarize', {
    method: 'POST',
    body: JSON.stringify({ bulletinId })
  });
  
  setGenerating(false);
  toast.success('Boletín generado exitosamente');
  // Recargar lista
}
Estado:
typescriptconst [bulletins, setBulletins] = useState([]);
const [loading, setLoading] = useState(false);
const [filters, setFilters] = useState({ status: [], dateRange: null });
const [page, setPage] = useState(1);
Archivo: app/dashboard/bulletin/[id]/page.tsx
Página de detalle
Tabs:

"Resúmenes" (default):

Mostrar 6 categorías con resúmenes
Contador de palabras
Botón "Editar" por resumen
Botón "Regenerar"


"Noticias Raw":

Accordion por fuente
Lista de artículos scrapeados
Modal para contenido completo


"Noticias Clasificadas":

Accordion por categoría
Lista de noticias asignadas


"Logs":

Timeline de proceso
Estado, duración, timestamp
Mensajes de error


"Video":

Si ready: reproductor
Si processing: progress bar
Si pending: botón "Generar Video"
Preview del script


"Diseño" (NUEVO):

DesignSwitcher component
Vista previa del boletín con diseño seleccionado
Botón "Exportar" con opciones de formato



Acciones:

Botón "Publicar" (si status 'ready')
Botón "Eliminar"
Botón "Exportar" (JSON)

Implementación del tab Diseño:
typescript<TabsContent value="design">
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Selecciona el diseño del boletín
      </h3>
      <DesignSwitcher 
        currentDesign={bulletin.designVersion}
        bulletinId={bulletin.id}
        onDesignChange={handleDesignChange}
      />
    </div>
    
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">
        Vista previa
      </h3>
      <BulletinRenderer 
        bulletin={bulletin}
        design={currentDesign}
        editable={false}
      />
    </div>
    
    <div className="flex gap-4">
      <Button onClick={() => handleExport('html')}>
        Exportar HTML
      </Button>
      <Button onClick={() => handleExport('pdf')}>
        Exportar PDF
      </Button>
    </div>
  </div>
</TabsContent>
Estado:
typescriptconst [currentDesign, setCurrentDesign] = useState<'classic' | 'modern'>(
  bulletin.designVersion || 'classic'
);

async function handleDesignChange(newDesign: 'classic' | 'modern') {
  setCurrentDesign(newDesign);
  
  const response = await fetch(`/api/bulletin/${bulletin.id}/design`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ design: newDesign })
  });
  
  if (response.ok) {
    toast.success('Diseño actualizado correctamente');
  } else {
    toast.error('Error al actualizar diseño');
    setCurrentDesign(bulletin.designVersion);
  }
}

async function handleExport(format: 'html' | 'pdf') {
  const url = `/api/bulletin/${bulletin.id}/export?design=${currentDesign}&format=${format}`;
  window.open(url, '_blank');
}
Archivo: components/bulletin/bulletin-card.tsx
Card para lista
Props:
typescriptinterface BulletinCardProps {
  bulletin: {
    id: string;
    date: Date;
    status: string;
    designVersion: 'classic' | 'modern';
    totalNews: number;
    videoStatus: string;
    createdAt: Date;
  };
  onSelect?: (id: string) => void;
}
Debe mostrar:

Fecha (formato: "Miércoles 12 de Noviembre")
Status badge con color
Badge de diseño actual (icono)
Número de noticias
Video status (icono)
Mini preview de categorías
Timestamp
Hover effect
Click → detalle

Usar shadcn/ui Card component.
Archivo: components/bulletin/status-badge.tsx
Badge para status
Props:
typescriptinterface StatusBadgeProps {
  status: 'draft' | 'scraping' | 'classifying' | 'summarizing' | 
          'ready' | 'video_processing' | 'published' | 'failed';
  size?: 'sm' | 'md' | 'lg';
}
Colores:

draft: gray
scraping/classifying/summarizing: blue + spinner
ready: green
video_processing: purple + spinner
published: emerald
failed: red

Usar shadcn/ui Badge con variants.

PARTE 9: SEEDS Y CONFIGURACIÓN
Archivo: lib/db/seed.ts
Seed de fuentes:
typescriptconst sources = [
  {
    name: 'Primicias',
    url: 'https://www.primicias.ec/',
    baseUrl: 'https://www.primicias.ec',
    scrapeConfig: {
      waitForSelector: 'article',
      excludeSelectors: ['nav', 'footer', '.ads'],
      includeImages: false
    },
    isActive: true
  },
  {
    name: 'La Hora',
    url: 'https://www.lahora.com.ec/',
    baseUrl: 'https://www.lahora.com.ec',
    scrapeConfig: {
      waitForSelector: '.article',
      excludeSelectors: ['nav', 'footer', '.advertisement'],
      includeImages: false
    },
    isActive: true
  }
];

for (const source of sources) {
  await db.insert(newsSources).values(source).onConflictDoNothing();
}
Seed de templates:
typescriptconst templates = [
  {
    name: 'Economía - Standard',
    category: 'economia',
    systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
    userPromptTemplate: SUMMARIZATION_USER_PROMPT_TEMPLATE,
    exampleOutput: 'El sector empresarial ecuatoriano registró un crecimiento del 3.2% en el último trimestre según cifras del BCE. Las exportaciones no petroleras alcanzaron los $2,500 millones, impulsadas principalmente por banano y camarón. Este desempeño sugiere una recuperación gradual de la economía post-pandemia.',
    maxWords: 50,
    tone: 'profesional',
    isActive: true,
    version: 1
  },
  // Similar para: politica, sociedad, seguridad, internacional, vial
];

for (const template of templates) {
  await db.insert(bulletinTemplates).values(template).onConflictDoNothing();
}
Seed de diseños:
typescriptconst designs = [
  {
    name: 'classic',
    displayName: 'Diseño Clásico',
    description: 'Diseño tradicional con tipografía grande y estructura familiar',
    isActive: true,
    layoutConfig: {
      showImages: true,
      imagePosition: 'top',
      sectionNumbering: true,
      fontSizes: { title: 44, subtitle: 42, body: 37 },
      spacing: { sectionGap: 60, paragraphGap: 24 }
    }
  },
  {
    name: 'modern',
    displayName: 'Diseño Moderno',
    description: 'Diseño actualizado con cards y layout responsive',
    isActive: true,
    layoutConfig: {
      showImages: true,
      imagePosition: 'side',
      sectionNumbering: false,
      fontSizes: { title: 32, subtitle: 28, body: 16 },
      spacing: { sectionGap: 48, paragraphGap: 16 }
    }
  }
];

for (const design of designs) {
  await db.insert(bulletinDesigns).values(design).onConflictDoNothing();
}
Script debe ser idempotente (puede ejecutarse múltiples veces).
Comando:
bashpnpm tsx lib/db/seed.ts
Archivo: vercel.json
json{
  "crons": [{
    "path": "/api/cron/daily-bulletin",
    "schedule": "0 6 * * *"
  }]
}
Test manual en desarrollo:
bashcurl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/daily-bulletin
Archivo: .env.example
bash# Database
DATABASE_URL=postgresql://...

# AI Providers
OPENROUTER_API_KEY=sk-or-v1-...

# News Scraping
FIRECRAWL_API_KEY=fc-...

# Video Generation (futuro)
ELEVENLABS_API_KEY=...
PICTORY_API_KEY=...

# Cron Security
CRON_SECRET=... # generar con: openssl rand -base64 32

# App URLs
NEXT_PUBLIC_URL=http://localhost:3000

PARTE 10: DOCUMENTACIÓN
Archivo: README-BULLETIN.md
Crear documentación completa con estas secciones:

Arquitectura general

Diagrama de flujo del proceso
Explicación de cada paso
Dependencias entre componentes


Sistema de Diseño Dual

Descripción de diseño clásico vs moderno
Cuándo usar cada uno
Cómo cambiar entre diseños
Cómo exportar con diseño específico


Configuración inicial

Variables de entorno
Cómo obtener API keys
Setup de BD
Ejecución del seed


Uso del sistema

Generar boletín manualmente
Configurar cron job
Editar resúmenes
Regenerar categorías
Cambiar diseño visual


Personalización

Agregar fuentes de noticias
Modificar prompts de AI
Ajustar límites de palabras
Personalizar formato de video
Crear nuevo diseño visual


Troubleshooting

Problemas comunes
Qué hacer si scraping falla
Debug de errores de AI
Verificar logs


API Reference

Documentación de endpoints
Ejemplos de requests/responses
Códigos de error


Roadmap

Integración completa de video
Analytics de boletines
A/B testing de formatos
Distribución automática




ORDEN DE IMPLEMENTACIÓN SUGERIDO
Fase 1: Base + Scraping (Semana 1)

Crear schemas en Drizzle ✓
Generar y ejecutar migraciones ✓
Crear queries de DB ✓
Implementar scraper con Firecrawl ✓
API route para scraping manual ✓
Dashboard básico para ver noticias raw ✓

Fase 2: AI Classification + Summarization (Semana 2)

Configurar AI providers ✓
Crear prompts templates ✓
Implementar clasificador ✓
Implementar summarizer con streaming ✓
UI para preview de resúmenes ✓
Refinamiento de prompts ✓

Fase 3: Sistema de Diseño (Semana 3)

Crear design-system.ts con configuraciones ✓
Implementar ClassicBulletinLayout (réplica exacta) ✓
Implementar ModernBulletinLayout ✓
Crear BulletinRenderer (switch) ✓
Crear DesignSwitcher ✓
API route para cambiar diseño ✓
Actualizar dashboard con tab Diseño ✓
Sistema de assets (header/footer images) ✓

Fase 4: Video + Automation (Semana 4)

Integrar ElevenLabs para audio ✓
Preparar script de video ✓
Stub para generación de video ✓
Configurar Vercel Cron ✓
Testing end-to-end ✓
Exportación con diseño ✓

Fase 5: Polish (Semana 5)

Seeds de datos ✓
Preferencias de usuario ✓
Analytics y logs mejorados ✓
Documentación completa ✓
Testing de producción ✓


NOTAS CRÍTICAS Y RECORDATORIOS
🔴 ALTA PRIORIDAD

Diseño Clásico debe ser EXACTO:

Replica pixel por pixel el HTML original
Incluye tamaños de fuente exactos (44px, 42px, 37px, 22px)
Espaciados exactos (60px entre secciones, 24px entre elementos)
Colores exactos (#004aad, #1a62ff, #c9c9c9, #ffffff, #000000)
Posiciones exactas (centrado de texto, imágenes)


Assets del Diseño Clásico:

Extraer header-bg.png del HTML original
Extraer footer-bg.png del HTML original
Extraer logo corporativo
Guardar en /public/images/bulletin/classic/


Fuentes Tipográficas:

Canva Sans (Bold) para título principal
Coco Gothic (Bold) para títulos de sección
Open Sans (Regular y Bold) para texto
Asegurar que se cargan correctamente


Default Behavior:

Todos los boletines nuevos: designVersion = 'classic'
Usuario puede cambiar después si lo desea
Preferencia se guarda para futuros boletines


Compatibilidad:

Cambiar diseño NO afecta contenido
Solo cambia presentación visual
Mismo contenido, diferente layout



🟡 IMPORTANTE

Responsive Design:

Solo diseño moderno necesita ser responsive
Diseño clásico puede ser fixed-width (1024px)
Considerar breakpoints: 768px, 1024px, 1200px


Performance:

Lazy load de imágenes en ambos diseños
Optimizar CSS (evitar duplicación)
Considerar usar CSS modules


Accesibilidad:

Alt text en todas las imágenes
Contraste adecuado de colores
Navegación por teclado funcional
ARIA labels apropiados


Error Handling:

Manejo graceful de imágenes faltantes
Fallback si diseño no disponible
Validación de datos del boletín


Testing:

Probar cambio de diseño en tiempo real
Probar exportación en ambos formatos
Verificar que fonts se cargan correctamente
Testing en diferentes navegadores



🟢 DESEABLE

Future Enhancements:

Preview antes de cambiar diseño
Comparación lado a lado
Temas de color personalizados
Más opciones de diseño
Templates personalizados por usuario


Analytics:

Trackear qué diseño se usa más
Engagement por diseño
Preferencias demográficas




CONSIDERACIONES TÉCNICAS ADICIONALES
TypeScript

Usar strict mode
Definir interfaces para todas las estructuras
Evitar any, usar tipos específicos
Documentar funciones con JSDoc

Error Handling

Try-catch en todas las funciones async
Logs detallados con contexto
Mensajes de error user-friendly
Retry logic con backoff exponencial

Security

Validar todos los inputs
Sanitizar datos scrapeados
Rate limiting en API routes
Autenticación en endpoints privados
No exponer API keys en cliente
CRON_SECRET fuerte

Performance

Usar React Server Components donde apropiado
Lazy loading de componentes pesados
Memoización de cálculos costosos
Optimización de imágenes
Caché de datos estáticos

Testing

Casos de prueba manuales por componente
Datos de ejemplo para testing
Comandos útiles para debug
Cómo simular errores


RESUMEN EJECUTIVO
Este sistema creará un pipeline completo automatizado que:
✅ Scrapea noticias diariamente de fuentes ecuatorianas
✅ Clasifica automáticamente en 6 categorías con AI
✅ Genera resúmenes concisos y profesionales
✅ Prepara script para video (generación completa es fase 2)
✅ Soporta DOS diseños visuales (Clásico y Moderno)
✅ Permite cambio instantáneo entre diseños con un clic
✅ Provee UI intuitiva para gestión y visualización
✅ Es extensible, configurable y mantenible
✅ Preserva el diseño familiar para audiencia mayor
✅ Ofrece alternativa moderna para audiencias jóvenes
Audiencia objetivo: Personas mayores (diseño clásico) y audiencia general (diseño moderno)
Stack tecnológico: Next.js 15, React 19, Drizzle ORM, PostgreSQL, Vercel AI SDK, OpenRouter, Firecrawl, Tailwind CSS
Innovación clave: Sistema de diseño dual que mantiene familiaridad mientras ofrece modernidad.

¿Alguna pregunta o necesitas que profundice en alguna sección específica?ReintentarFPesta mal esto no debe ir "ORDEN DE IMPLEMENTACIÓN SUGERIDO semana"  ya que es una agente de ia el que me va ayudar a implementar y si le pongo semanas no va hacerTienes toda la razón, Fausto. Voy a corregir esa sección para que sea más apropiada para un agente de IA:

ORDEN DE IMPLEMENTACIÓN
IMPORTANTE: Implementar en el siguiente orden secuencial. Cada fase debe completarse antes de pasar a la siguiente.
FASE 1: Fundamentos de Base de Datos
Objetivo: Establecer toda la infraestructura de datos

Crear todos los schemas en lib/db/schema.ts:

Tabla bulletins con todos los campos incluidos designVersion
Tabla news_sources
Tabla bulletin_templates
Tabla bulletin_designs
Tabla bulletin_logs
Tabla user_bulletin_preferences


Generar migraciones: pnpm run db:generate
Ejecutar migraciones: pnpm run db:migrate
Crear todas las funciones de queries en:

lib/db/queries/bulletins.ts
lib/db/queries/sources.ts
lib/db/queries/templates.ts
lib/db/queries/designs.ts


Crear y ejecutar seed: lib/db/seed.ts

Verificación: Todos los schemas creados, migraciones aplicadas, queries funcionando, datos de seed insertados.

FASE 2: Sistema de Diseño y Assets
Objetivo: Configurar todo el sistema de diseño dual antes de crear componentes

Crear lib/bulletin/design-system.ts:

Interface DesignConfig
Constante CLASSIC_DESIGN con configuración exacta
Constante MODERN_DESIGN
Función getDesignConfig()


Crear lib/bulletin/assets.ts:

Función getHeaderImage()
Función getFooterImage()
Función getLogo()
Función getPreviewImage()


Crear estructura de carpetas en public/images/bulletin/:

/classic/ (header-bg.png, footer-bg.png, logo.png)
/modern/ (logo.png)
/previews/ (classic-preview.png, modern-preview.png)



Verificación: Sistema de diseño configurado, funciones helper creadas, carpetas de assets preparadas.

FASE 3: Configuración de AI
Objetivo: Preparar toda la infraestructura de AI antes de implementar lógica

Crear lib/ai/providers.ts:

Función getClaudeModel()
Función getGPTModel()
Constante DEFAULT_AI_CONFIG


Crear lib/ai/prompts.ts:

Constante CLASSIFICATION_SYSTEM_PROMPT
Constante CLASSIFICATION_USER_PROMPT_TEMPLATE
Constante SUMMARIZATION_SYSTEM_PROMPT
Constante SUMMARIZATION_USER_PROMPT_TEMPLATE



Verificación: Providers configurados, prompts creados, conexión con OpenRouter lista.

FASE 4: Módulos de Lógica de Negocio
Objetivo: Implementar toda la lógica core del sistema

Crear lib/news/scraper.ts:

Función scrapeAllSources()
Función parseFirecrawlResponse()
Función validateArticle()
Manejo de errores y retry logic


Crear lib/news/classifier.ts:

Función classifyNews()
Función validateClassification()
Función extractJSONFromResponse()


Crear lib/news/summarizer.ts:

Función summarizeByCategory()
Función summarizeWithStreaming()
Función validateSummary()
Función formatCategoryName()


Crear lib/news/video-generator.ts:

Función prepareVideoScript()
Función generateIntro()
Función generateOutro()
Función estimateDuration()
Función stub generateVideoWithAPI()



Verificación: Toda la lógica de negocio implementada y funcional, cada módulo probado independientemente.

FASE 5: API Routes Core
Objetivo: Crear endpoints para las operaciones principales del boletín

Crear app/api/news/scrape/route.ts:

Endpoint POST completo con validación
Integración con scraper
Actualización de bulletin


Crear app/api/news/classify/route.ts:

Endpoint POST completo
Integración con classifier
Actualización de status


Crear app/api/news/summarize/route.ts:

Endpoint POST con soporte streaming y non-streaming
Integración con summarizer
Actualización de summaries


Crear app/api/news/generate-video/route.ts:

Endpoint POST completo
Integración con video generator (stub)



Verificación: Todos los endpoints core funcionando, pipeline de scrape → classify → summarize operativo.

FASE 6: API Routes de Diseño
Objetivo: Implementar funcionalidad de diseño dual

Crear app/api/bulletin/[id]/design/route.ts:

Endpoint PATCH completo
Validación de diseño
Actualización en BD


Crear app/api/bulletin/designs/route.ts:

Endpoint GET completo
Retornar lista de diseños disponibles


Crear app/api/bulletin/[id]/export/route.ts:

Endpoint GET con query params
Generación de HTML estático
Soporte para PDF e Image (futuro)



Verificación: Endpoints de diseño funcionando, cambio de diseño operativo.

FASE 7: Componentes de UI - Diseño Clásico
Objetivo: Implementar primero el diseño clásico (más importante para audiencia)

Crear components/bulletin/classic-bulletin-layout.tsx:

Estructura HTML completa replicando el original
CSS exacto en globals.css o módulo CSS
Integración con assets
Todas las secciones implementadas


Probar el diseño clásico standalone antes de continuar

Verificación: Diseño clásico renderiza perfectamente, comparación visual con HTML original exitosa.

FASE 8: Componentes de UI - Diseño Moderno
Objetivo: Implementar el diseño moderno

Crear components/bulletin/modern-bulletin-layout.tsx:

Estructura con cards y grid
CSS con responsive design
Animaciones y efectos hover



Verificación: Diseño moderno renderiza correctamente, responsive funciona.

FASE 9: Componentes de UI - Sistema de Diseño
Objetivo: Conectar ambos diseños con switching

Crear components/bulletin/bulletin-renderer.tsx:

Switch entre diseños
Prop handling correcto


Crear components/bulletin/design-switcher.tsx:

UI para cambiar diseño
Integración con API
Loading states
Toast notifications



Verificación: Cambio entre diseños funciona instantáneamente, sin errores.

FASE 10: Componentes de UI - Auxiliares
Objetivo: Crear componentes helper reutilizables

Crear components/bulletin/bulletin-card.tsx:

Card para lista de boletines
Toda la información necesaria


Crear components/bulletin/status-badge.tsx:

Badge con colores por status
Spinners cuando necesario


Crear components/bulletin/category-section.tsx:

Sección de categoría editable


Crear components/bulletin/generate-button.tsx:

Botón con progress steps



Verificación: Todos los componentes auxiliares funcionando correctamente.

FASE 11: Dashboard - Lista de Boletines
Objetivo: Crear la página principal del dashboard

Crear app/dashboard/bulletin/page.tsx:

Layout completo
Botón generar nuevo
Filtros funcionales
Lista de boletines
Paginación
Loading y empty states



Verificación: Página de lista completamente funcional, filtros trabajando, paginación operativa.

FASE 12: Dashboard - Detalle de Boletín
Objetivo: Crear la página de detalle con todos los tabs

Crear app/dashboard/bulletin/[id]/page.tsx:

Tab "Resúmenes" completo
Tab "Noticias Raw" completo
Tab "Noticias Clasificadas" completo
Tab "Logs" completo
Tab "Video" completo
Tab "Diseño" completo (con DesignSwitcher y preview)
Todas las acciones (publicar, eliminar, exportar)



Verificación: Todas las tabs funcionando, cambio de diseño en tab funcional, exportación operativa.

FASE 13: Automatización
Objetivo: Implementar el cron job para ejecución diaria

Crear app/api/cron/daily-bulletin/route.ts:

Validación de autorización
Pipeline completo secuencial
Manejo de errores robusto
Logging detallado


Crear vercel.json:

Configuración de cron


Agregar CRON_SECRET a .env

Verificación: Cron job ejecuta correctamente en manual, pipeline completo funciona end-to-end.

FASE 14: Documentación y Polish
Objetivo: Finalizar con documentación y mejoras

Crear README-BULLETIN.md:

Todas las secciones completas
Diagramas si es necesario
Ejemplos claros


Crear .env.example:

Todas las variables documentadas


Revisar y optimizar:

Performance
Error handling
Loading states
Feedback al usuario



Verificación: Documentación completa, sistema optimizado, listo para producción.

VERIFICACIÓN FINAL
Antes de considerar el proyecto completo, verificar:

✅ Pipeline completo funciona: scrape → classify → summarize
✅ Ambos diseños renderizan correctamente
✅ Cambio entre diseños funciona sin errores
✅ Diseño clásico replica exactamente el original
✅ Dashboard completo y funcional
✅ Cron job configurado y testeado
✅ Exportación funciona en ambos diseños
✅ Documentación completa
✅ Seeds aplicados correctamente
✅ Todas las API routes responden correctamente
✅ Error handling robusto en todo el sistema
✅ Loading states apropiados en toda la UI


NOTAS PARA LA IMPLEMENTACIÓN
Para el agente de IA:

No saltar fases: Completar cada fase antes de la siguiente
Probar cada componente: Antes de pasar al siguiente
Mantener tipos TypeScript: Estrictos en todo momento
Comentar código complejo: Para mantenibilidad
Seguir estructura de carpetas: Exactamente como se especifica
Usar imports relativos: Apropiadamente con alias @/
Error handling: En cada función async
Validación: En cada endpoint de API
Consistencia: En nombres, estilos, patrones

Prioridades:

🔴 CRÍTICO: Diseño clásico debe ser pixel-perfect
🔴 CRÍTICO: Pipeline de noticias debe ser robusto
🟡 IMPORTANTE: Cambio de diseño debe ser instantáneo
🟡 IMPORTANTE: Error handling completo
🟢 DESEABLE: Optimizaciones de performance