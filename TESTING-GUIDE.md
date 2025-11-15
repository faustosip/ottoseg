# Guía de Testing - Sistema de Boletines OttoSeguridad

Esta guía te ayudará a probar todo el sistema de generación de boletines de forma sistemática.

## 📋 Pre-requisitos

Antes de comenzar el testing, asegúrate de tener:

### 1. Variables de Entorno Configuradas

En tu archivo `.env.local`:

```env
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/ottoseguridad

# Better Auth
BETTER_AUTH_SECRET=tu-secret-de-32-caracteres
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-tu-api-key
OPENROUTER_MODEL=anthropic/claude-sonnet-4-20250514

# Firecrawl (para scraping)
FIRECRAWL_API_KEY=tu-firecrawl-api-key

# Cron (para testing del endpoint cron)
CRON_SECRET=un-secret-aleatorio-para-cron

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Base de Datos Poblada

```bash
# Si no lo has hecho, ejecutar migraciones
pnpm run db:migrate

# Ejecutar seed para poblar con datos iniciales
pnpm run db:seed
```

### 3. Servicios Iniciados

```bash
# Terminal 1: Dev Server
pnpm run dev

# Terminal 2: Drizzle Studio (para visualizar la BD)
pnpm run db:studio
```

---

## 🧪 Tests del Pipeline

### Test 1: Generación Manual Completa

**Objetivo**: Probar el pipeline completo desde la UI

1. **Navegar a la página de boletines**
   - URL: http://localhost:3000/dashboard/bulletin
   - Deberías ver la lista de boletines (vacía si es primera vez)

2. **Iniciar generación**
   - Click en "Generar Nuevo Boletín"
   - Deberías ser redirigido a `/dashboard/bulletin/generate`
   - Click en "Iniciar Generación"

3. **Observar el progreso**
   - Deberías ver 3 pasos en el timeline:
     - ✅ Scraping de noticias
     - ✅ Clasificación con IA
     - ✅ Generación de resúmenes
   - Cada paso mostrará:
     - Spinner mientras está en progreso
     - Check verde cuando complete
     - Duración en segundos
     - Mensaje con resultado

4. **Verificar redirección**
   - Al completarse, deberías ser redirigido automáticamente a la página de detalle del boletín
   - URL: `/dashboard/bulletin/[id]`

### Test 2: Verificación en Base de Datos

**Objetivo**: Confirmar que los datos se guardaron correctamente

1. **Abrir Drizzle Studio**
   - URL: https://local.drizzle.studio
   - Deberías ver todas las tablas del sistema

2. **Verificar tabla `bulletins`**
   - Buscar el boletín recién creado
   - Campos a verificar:
     - `status`: debe ser "ready"
     - `rawNews`: debe tener JSON con noticias de las 5 fuentes
     - `classifiedNews`: debe tener JSON con 6 categorías
     - `economia`, `politica`, `sociedad`, `seguridad`, `internacional`, `vial`: todos deben tener texto
     - `totalNews`: número > 0

3. **Verificar tabla `bulletin_logs`**
   - Filtrar por el `bulletinId`
   - Deberías ver logs para:
     - scraping (in_progress → completed)
     - classification (in_progress → completed)
     - summarization (in_progress → completed)
   - Cada log debe tener:
     - `step`: nombre del paso
     - `status`: completed
     - `message`: descripción
     - `metadata`: JSON con detalles (duration, counts, etc.)

### Test 3: Vista de Detalle del Boletín

**Objetivo**: Verificar que la UI muestra toda la información correctamente

1. **Navegar al boletín**
   - URL: `/dashboard/bulletin/[id]`
   - Reemplaza `[id]` con el ID del boletín generado

2. **Verificar Tab "Resúmenes"**
   - Deberías ver el Design Switcher (Clásico / Moderno)
   - Cambiar entre diseños y verificar que ambos funcionan
   - Los resúmenes de las 6 categorías deben mostrarse
   - Verificar que los textos sean coherentes y en español

3. **Verificar Tab "Noticias Raw"**
   - Deberías ver JSON con todas las noticias scrapeadas
   - Verificar que haya noticias de múltiples fuentes
   - Cada noticia debe tener: title, content, url, source

4. **Verificar Tab "Clasificadas"**
   - Deberías ver JSON con noticias organizadas por categoría
   - Las 6 categorías deben estar presentes
   - Cada categoría debe tener un array de noticias

5. **Verificar Tab "Logs"**
   - Deberías ver un timeline con los eventos
   - Cada evento debe tener:
     - Icono según status
     - Timestamp
     - Duración
     - Mensaje descriptivo
   - Los eventos deben estar ordenados cronológicamente

6. **Verificar Tab "Video"**
   - Debería mostrar mensaje: "El video aún no ha sido generado"
   - Status: pending (esto es esperado, video generation es fase futura)

### Test 4: Edición de Resúmenes

**Objetivo**: Probar la funcionalidad de edición (si está implementada)

1. **Editar un resumen**
   - En el Tab "Resúmenes", hacer click en editar
   - Cambiar el texto de un resumen
   - Guardar cambios

2. **Verificar persistencia**
   - Recargar la página
   - El cambio debe persistir

3. **Verificar en BD**
   - Abrir Drizzle Studio
   - El campo correspondiente debe mostrar el nuevo texto

### Test 5: Diseños Responsive

**Objetivo**: Verificar que la UI funciona en diferentes tamaños

1. **Desktop (1920x1080)**
   - Grid de boletines debe mostrar 3 columnas
   - Todos los componentes deben verse correctamente

2. **Tablet (768x1024)**
   - Grid de boletines debe mostrar 2 columnas
   - Tabs deben ser responsive

3. **Mobile (375x667)**
   - Grid de boletines debe mostrar 1 columna
   - Navegación debe ser accesible
   - Tabs deben tener scroll horizontal si es necesario

### Test 6: Test del Endpoint Cron

**Objetivo**: Probar la ejecución automática del pipeline

**IMPORTANTE**: Este test creará un nuevo boletín. Asegúrate de eliminar el boletín de hoy primero si quieres probar.

1. **Preparar la prueba**
   - Obtén tu `CRON_SECRET` del archivo `.env.local`
   - Si ya existe un boletín de hoy, elimínalo desde Drizzle Studio

2. **Ejecutar el endpoint**
   ```bash
   curl -X GET "http://localhost:3000/api/cron/daily-bulletin" \
     -H "Authorization: Bearer TU_CRON_SECRET"
   ```

3. **Verificar respuesta**
   - Deberías recibir un JSON con:
     - `success: true`
     - `bulletinId`: ID del boletín creado
     - `executedAt`: timestamp
     - `totalDuration`: duración total
     - `pipeline`: objeto con detalles de cada paso

4. **Verificar en BD**
   - Abrir Drizzle Studio
   - Debería haber un nuevo boletín con status "ready"
   - Los logs deben mostrar todos los pasos completados

### Test 7: Manejo de Errores

**Objetivo**: Verificar que los errores se manejan correctamente

#### 7.1 Sin API Keys

1. **Remover temporalmente las API keys**
   - Comentar `OPENROUTER_API_KEY` en `.env.local`
   - Reiniciar el dev server

2. **Intentar generar boletín**
   - Debería fallar en el paso de clasificación
   - El error debe mostrarse en la UI
   - El status del boletín debe ser "failed"
   - Debe haber un log de error en la BD

3. **Restaurar API keys**
   - Descomentar `OPENROUTER_API_KEY`
   - Reiniciar el dev server

#### 7.2 Boletín Duplicado

1. **Intentar generar segundo boletín del día**
   - El botón "Generar Nuevo Boletín" debe estar deshabilitado
   - Debería mostrar mensaje: "Boletín de hoy ya existe"

2. **Verificar endpoint directo**
   ```bash
   curl -X POST "http://localhost:3000/api/news/scrape" \
     -H "Content-Type: application/json"
   ```
   - Debería retornar error 409 (Conflict)
   - Mensaje: "Ya existe un boletín en proceso para hoy"

---

## 🔍 Checklist de Verificación

Usa este checklist para asegurarte de que todo funciona:

### ✅ Base de Datos
- [ ] Migraciones aplicadas correctamente
- [ ] Seed ejecutado: 5 fuentes, 6 templates, 2 diseños
- [ ] Drizzle Studio accesible y mostrando todas las tablas

### ✅ Pipeline de Generación
- [ ] Scraping completa sin errores
- [ ] Clasificación asigna noticias a las 6 categorías
- [ ] Resúmenes se generan para todas las categorías
- [ ] Status del boletín progresa: draft → classifying → summarizing → ready
- [ ] Logs se crean para cada paso del pipeline

### ✅ Interfaz de Usuario
- [ ] Lista de boletines carga correctamente
- [ ] Botón "Generar" funciona y redirige
- [ ] Timeline de generación muestra progreso en tiempo real
- [ ] Página de detalle muestra toda la información
- [ ] Tabs funcionan correctamente
- [ ] Design Switcher alterna entre Clásico y Moderno
- [ ] UI responsive en desktop, tablet y mobile

### ✅ API Endpoints
- [ ] POST /api/news/scrape retorna datos correctos
- [ ] POST /api/news/classify procesa noticias
- [ ] POST /api/news/summarize genera resúmenes
- [ ] GET /api/bulletins lista boletines con paginación
- [ ] GET /api/bulletins/[id] retorna boletín completo
- [ ] PATCH /api/bulletins/[id] actualiza campos
- [ ] DELETE /api/bulletins/[id] elimina boletín
- [ ] GET /api/cron/daily-bulletin ejecuta pipeline completo

### ✅ Manejo de Errores
- [ ] Sin API keys: muestra error apropiado
- [ ] Boletín duplicado: previene creación
- [ ] Errores de red: se manejan gracefully
- [ ] Logs de error se guardan en BD

---

## 🐛 Problemas Comunes y Soluciones

### Error: "OPENROUTER_API_KEY no está configurada"
**Solución**: Verifica que `.env.local` tenga la API key correcta y reinicia el servidor.

### Error: "FIRECRAWL_API_KEY no está configurada"
**Solución**: Obtén una API key de Firecrawl.dev y agrégala a `.env.local`.

### El scraping no retorna noticias
**Solución**:
- Verifica que Firecrawl API esté funcionando
- Revisa los logs del servidor para ver errores específicos
- Las URLs de las fuentes pueden haber cambiado

### La clasificación toma mucho tiempo
**Solución**: Es normal, Claude Sonnet 4 puede tomar 30-60 segundos para clasificar muchas noticias.

### Los resúmenes están en inglés
**Solución**: Verifica que el prompt de sistema especifique idioma español.

---

## 📊 Métricas Esperadas

Al finalizar un pipeline exitoso, deberías ver aproximadamente:

- **Scraping**: 20-50 noticias totales (depende de las fuentes)
- **Clasificación**: 100% de noticias clasificadas en las 6 categorías
- **Resúmenes**: 6 resúmenes de 100-150 palabras cada uno
- **Duración total**: 2-5 minutos (varía según cantidad de noticias y velocidad de IA)

### Tiempos de referencia:
- Scraping: 10-30 segundos
- Clasificación: 30-90 segundos
- Resúmenes: 60-180 segundos (10-30s por categoría)

---

## ✅ Fase 13 Completada

Una vez que hayas verificado todos los puntos del checklist y el sistema funciona correctamente, ¡la Fase 13 está completa!

**Siguiente paso**: Fase 14 - Configuración de Producción
