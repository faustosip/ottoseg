# API Endpoints: Sistema de Boletines

## Visión General

Este documento detalla todos los endpoints HTTP del sistema de boletines, incluyendo:
- Rutas y métodos HTTP
- Autenticación requerida
- Request y response schemas
- Códigos de error
- Ejemplos con curl

**Base URL (Desarrollo)**: `http://localhost:3000`
**Base URL (Producción)**: `https://ottoseguridadai.com`

---

## Autenticación

### Sistema de Auth
- **Provider**: Better Auth
- **Método**: Session-based authentication con cookies

### Headers Requeridos
```http
Cookie: better-auth.session_token=<session_token>
```

### Endpoints Protegidos
Todos los endpoints bajo `/api/news/` y `/api/bulletins/` requieren autenticación, excepto el endpoint de cron que usa `CRON_SECRET`.

---

## 📰 News Endpoints

### 1. POST /api/news/scrape

Inicia el proceso de scraping de noticias desde las fuentes configuradas.

#### Request

**Headers:**
```http
Content-Type: application/json
Cookie: better-auth.session_token=<token>
```

**Body (opcional):**
```json
{
  "sources": ["primicias", "lahora"]  // Array de fuentes a scrapear
}
```

Si `sources` no se provee, se scrapean todas las fuentes activas.

#### Response (200 OK)

```json
{
  "success": true,
  "bulletinId": "uuid-123-456-789",
  "totalNews": 45,
  "sources": ["primicias", "lahora"],
  "message": "Scraping completed successfully",
  "metadata": {
    "scrapedAt": "2025-11-12T06:00:00Z",
    "duration": 8543  // milisegundos
  }
}
```

#### Errores

**409 Conflict** - Ya existe un boletín en proceso para hoy
```json
{
  "error": "Bulletin already in progress",
  "message": "A bulletin for today is already being processed",
  "bulletinId": "uuid-existing"
}
```

**500 Internal Server Error** - Fallo en el scraping
```json
{
  "error": "Scraping failed",
  "message": "Failed to scrape from one or more sources",
  "details": {
    "primicias": "success",
    "lahora": "timeout"
  }
}
```

**401 Unauthorized** - No autenticado
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to perform this action"
}
```

#### Ejemplo con curl

```bash
curl -X POST http://localhost:3000/api/news/scrape \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -d '{
    "sources": ["primicias", "lahora"]
  }'
```

---

### 2. POST /api/news/classify

Clasifica las noticias scrapeadas en 6 categorías usando IA.

#### Request

**Headers:**
```http
Content-Type: application/json
Cookie: better-auth.session_token=<token>
```

**Body:**
```json
{
  "bulletinId": "uuid-123-456-789"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "bulletinId": "uuid-123-456-789",
  "classified": {
    "economia": [
      {
        "title": "PIB crece 3.2% en el último trimestre",
        "summary": "El sector empresarial muestra recuperación...",
        "url": "https://primicias.ec/articulo-123",
        "source": "primicias",
        "date": "2025-11-12"
      }
    ],
    "politica": [...],
    "sociedad": [...],
    "seguridad": [...],
    "internacional": [...],
    "vial": [...]
  },
  "totalClassified": 42,
  "breakdown": {
    "economia": 8,
    "politica": 7,
    "sociedad": 9,
    "seguridad": 6,
    "internacional": 5,
    "vial": 7
  },
  "metadata": {
    "classifiedAt": "2025-11-12T06:08:30Z",
    "duration": 4230,
    "model": "anthropic/claude-sonnet-4-20250514"
  }
}
```

#### Errores

**404 Not Found** - Boletín no existe
```json
{
  "error": "Bulletin not found",
  "message": "No bulletin found with the provided ID"
}
```

**400 Bad Request** - Boletín no tiene noticias raw
```json
{
  "error": "No raw news available",
  "message": "The bulletin must be scraped before classification"
}
```

**500 Internal Server Error** - Fallo de clasificación con IA
```json
{
  "error": "Classification failed",
  "message": "AI classification failed",
  "details": {
    "reason": "API timeout",
    "model": "anthropic/claude-sonnet-4-20250514"
  }
}
```

#### Ejemplo con curl

```bash
curl -X POST http://localhost:3000/api/news/classify \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -d '{
    "bulletinId": "uuid-123-456-789"
  }'
```

---

### 3. POST /api/news/summarize

Genera resúmenes concisos para cada una de las 6 categorías.

#### Request

**Headers:**
```http
Content-Type: application/json
Cookie: better-auth.session_token=<token>
```

**Body:**
```json
{
  "bulletinId": "uuid-123-456-789",
  "streaming": false  // opcional, por defecto false
}
```

#### Response (200 OK) - Non-streaming

```json
{
  "success": true,
  "bulletinId": "uuid-123-456-789",
  "summaries": {
    "economia": "El PIB ecuatoriano creció 3.2% en el último trimestre según el BCE. Las exportaciones no petroleras alcanzaron los $2,500 millones, impulsadas por banano y camarón. Este desempeño sugiere recuperación post-pandemia.",
    "politica": "La Asamblea Nacional aprobó la reforma...",
    "sociedad": "El Ministerio de Educación anunció...",
    "seguridad": "Reducción del 15% en tasas de delincuencia...",
    "internacional": "Ecuador participó en la cumbre...",
    "vial": "Obras de mantenimiento en la vía Quito-Guayaquil..."
  },
  "wordCounts": {
    "economia": 48,
    "politica": 45,
    "sociedad": 50,
    "seguridad": 47,
    "internacional": 49,
    "vial": 46
  },
  "metadata": {
    "summarizedAt": "2025-11-12T06:13:45Z",
    "duration": 9850,
    "model": "anthropic/claude-sonnet-4-20250514"
  }
}
```

#### Response (200 OK) - Streaming

Para `streaming: true`, retorna `text/event-stream`:

```
Content-Type: text/event-stream

event: start
data: {"bulletinId":"uuid-123","category":"economia"}

event: chunk
data: {"category":"economia","chunk":"El PIB ecuatoriano"}

event: chunk
data: {"category":"economia","chunk":" creció 3.2%"}

event: complete
data: {"category":"economia","summary":"El PIB ecuatoriano creció...","wordCount":48}

event: start
data: {"bulletinId":"uuid-123","category":"politica"}

...

event: done
data: {"success":true,"bulletinId":"uuid-123"}
```

#### Errores

**404 Not Found** - Boletín no existe
**400 Bad Request** - Boletín no tiene noticias clasificadas
**500 Internal Server Error** - Fallo en generación de resúmenes

#### Ejemplo con curl

```bash
# Non-streaming
curl -X POST http://localhost:3000/api/news/summarize \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -d '{
    "bulletinId": "uuid-123-456-789",
    "streaming": false
  }'

# Streaming
curl -X POST http://localhost:3000/api/news/summarize \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -d '{
    "bulletinId": "uuid-123-456-789",
    "streaming": true
  }' \
  -N  # Para ver el stream en tiempo real
```

---

### 4. POST /api/news/generate-video

Prepara el script para generación de video (placeholder por ahora).

#### Request

**Headers:**
```http
Content-Type: application/json
Cookie: better-auth.session_token=<token>
```

**Body:**
```json
{
  "bulletinId": "uuid-123-456-789"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "bulletinId": "uuid-123-456-789",
  "videoStatus": "pending",
  "script": {
    "intro": "Buenos días, hoy es martes 12 de noviembre de 2025...",
    "sections": [
      {
        "category": "economia",
        "title": "Economía",
        "content": "En economía, el PIB ecuatoriano...",
        "duration": 15
      },
      {
        "category": "politica",
        "title": "Política",
        "content": "En política, la Asamblea Nacional...",
        "duration": 14
      }
      // ... resto de categorías
    ],
    "outro": "Esto es todo por hoy. Gracias por tu atención...",
    "totalDuration": 120,
    "metadata": {
      "bulletinId": "uuid-123",
      "date": "2025-11-12",
      "totalWords": 300
    }
  },
  "message": "Video script prepared successfully. Video generation not implemented yet."
}
```

#### Errores

**404 Not Found** - Boletín no existe
**400 Bad Request** - Boletín no está en status 'ready'
```json
{
  "error": "Bulletin not ready",
  "message": "The bulletin must have summaries before video generation",
  "currentStatus": "classified"
}
```

#### Ejemplo con curl

```bash
curl -X POST http://localhost:3000/api/news/generate-video \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -d '{
    "bulletinId": "uuid-123-456-789"
  }'
```

---

## 📋 Bulletins CRUD Endpoints

### 5. GET /api/bulletins

Obtiene lista de boletines con filtros y paginación.

#### Request

**Headers:**
```http
Cookie: better-auth.session_token=<token>
```

**Query Parameters:**
```
?page=1              // Número de página (default: 1)
&limit=20            // Items por página (default: 20, max: 100)
&status=ready,published  // Filtro por status (comma-separated)
&dateFrom=2025-11-01     // Filtro de fecha desde (ISO date)
&dateTo=2025-11-30       // Filtro de fecha hasta (ISO date)
&sort=date               // Campo de ordenamiento (date, createdAt)
&order=desc              // Orden (asc, desc)
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "date": "2025-11-12T00:00:00Z",
      "status": "ready",
      "totalNews": 45,
      "videoStatus": "pending",
      "createdAt": "2025-11-12T06:00:00Z",
      "publishedAt": null,
      "summary": {
        "economia": "El PIB ecuatoriano...",
        "politica": "La Asamblea Nacional..."
      }
    },
    {
      "id": "uuid-456",
      "date": "2025-11-11T00:00:00Z",
      "status": "published",
      "totalNews": 52,
      "videoStatus": "ready",
      "createdAt": "2025-11-11T06:00:00Z",
      "publishedAt": "2025-11-11T08:00:00Z",
      "videoUrl": "https://cdn.example.com/video-123.mp4"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "status": ["ready", "published"],
    "dateFrom": "2025-11-01",
    "dateTo": "2025-11-30"
  }
}
```

#### Ejemplo con curl

```bash
curl -X GET "http://localhost:3000/api/bulletins?page=1&limit=20&status=ready,published&sort=date&order=desc" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN"
```

---

### 6. GET /api/bulletins/[id]

Obtiene el detalle completo de un boletín específico.

#### Request

**Headers:**
```http
Cookie: better-auth.session_token=<token>
```

**URL Parameters:**
```
id: UUID del boletín
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "date": "2025-11-12T00:00:00Z",
    "status": "ready",
    "rawNews": {
      "primicias": [
        {
          "title": "Artículo completo...",
          "content": "Contenido largo...",
          "url": "https://...",
          "scrapedAt": "2025-11-12T06:02:15Z",
          "source": "primicias"
        }
      ],
      "laHora": [...],
      "metadata": {
        "totalArticles": 45,
        "scrapedAt": "2025-11-12T06:05:00Z",
        "sources": ["primicias", "lahora"]
      }
    },
    "classifiedNews": {
      "economia": [...],
      "politica": [...],
      "sociedad": [...],
      "seguridad": [...],
      "internacional": [...],
      "vial": [...]
    },
    "summaries": {
      "economia": "El PIB ecuatoriano...",
      "politica": "La Asamblea Nacional...",
      "sociedad": "El Ministerio de Educación...",
      "seguridad": "Reducción del 15%...",
      "internacional": "Ecuador participó...",
      "vial": "Obras de mantenimiento..."
    },
    "totalNews": 45,
    "videoUrl": null,
    "videoStatus": "pending",
    "videoMetadata": null,
    "designVersion": "classic",
    "logoUrl": "/bulletin-assets/logo.png",
    "headerImageUrl": "/bulletin-assets/classic/header.png",
    "footerImageUrl": "/bulletin-assets/classic/footer.png",
    "brandColors": {
      "primary": "#004aad",
      "secondary": "#1a62ff",
      "accent": "#c9c9c9",
      "background": "#ffffff",
      "text": "#000000"
    },
    "errorLog": null,
    "createdAt": "2025-11-12T06:00:00Z",
    "publishedAt": null,
    "logs": [
      {
        "step": "scraping",
        "status": "completed",
        "message": "Successfully scraped from all sources",
        "duration": 8543,
        "createdAt": "2025-11-12T06:05:00Z"
      },
      {
        "step": "classification",
        "status": "completed",
        "message": "42 articles classified into 6 categories",
        "duration": 4230,
        "createdAt": "2025-11-12T06:08:30Z"
      },
      {
        "step": "summarization",
        "status": "completed",
        "message": "Summaries generated for all categories",
        "duration": 9850,
        "createdAt": "2025-11-12T06:13:45Z"
      }
    ]
  }
}
```

#### Errores

**404 Not Found** - Boletín no existe
```json
{
  "error": "Bulletin not found",
  "message": "No bulletin found with ID uuid-123"
}
```

#### Ejemplo con curl

```bash
curl -X GET http://localhost:3000/api/bulletins/uuid-123 \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN"
```

---

### 7. PATCH /api/bulletins/[id]

Actualiza un boletín existente (editar resúmenes, cambiar diseño, etc.).

#### Request

**Headers:**
```http
Content-Type: application/json
Cookie: better-auth.session_token=<token>
```

**Body (todos los campos son opcionales):**
```json
{
  "summaries": {
    "economia": "Nuevo texto del resumen de economía...",
    "politica": "Nuevo texto del resumen de política..."
  },
  "designVersion": "modern",
  "status": "published",
  "publishedAt": "2025-11-12T08:00:00Z"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Bulletin updated successfully",
  "data": {
    "id": "uuid-123",
    "status": "published",
    "summaries": {
      "economia": "Nuevo texto...",
      "politica": "Nuevo texto..."
    },
    "designVersion": "modern",
    "updatedAt": "2025-11-12T10:30:00Z"
  }
}
```

#### Errores

**404 Not Found** - Boletín no existe
**400 Bad Request** - Datos de actualización inválidos
```json
{
  "error": "Invalid update data",
  "message": "The provided data is invalid",
  "details": {
    "summaries.economia": "Must be a string with max 500 characters"
  }
}
```

#### Ejemplo con curl

```bash
curl -X PATCH http://localhost:3000/api/bulletins/uuid-123 \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -d '{
    "summaries": {
      "economia": "Nuevo texto del resumen..."
    },
    "status": "published"
  }'
```

---

### 8. DELETE /api/bulletins/[id]

Elimina un boletín.

#### Request

**Headers:**
```http
Cookie: better-auth.session_token=<token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Bulletin deleted successfully",
  "id": "uuid-123"
}
```

#### Errores

**404 Not Found** - Boletín no existe
**403 Forbidden** - No se puede eliminar boletín publicado (opcional)
```json
{
  "error": "Cannot delete published bulletin",
  "message": "Published bulletins cannot be deleted"
}
```

#### Ejemplo con curl

```bash
curl -X DELETE http://localhost:3000/api/bulletins/uuid-123 \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN"
```

---

## ⏰ Cron Endpoint

### 9. GET /api/cron/daily-bulletin

Ejecuta el pipeline completo de generación de boletín. Diseñado para ser llamado por Vercel Cron diariamente a las 6am.

#### Request

**Headers:**
```http
Authorization: Bearer <CRON_SECRET>
```

⚠️ **Importante**: Este endpoint NO usa autenticación de sesión, sino un secret compartido.

#### Response (200 OK)

```json
{
  "success": true,
  "bulletinId": "uuid-123",
  "executedAt": "2025-11-12T06:00:00Z",
  "pipeline": {
    "scraping": {
      "status": "completed",
      "duration": 8543,
      "totalNews": 45
    },
    "classification": {
      "status": "completed",
      "duration": 4230,
      "totalClassified": 42
    },
    "summarization": {
      "status": "completed",
      "duration": 9850,
      "allSummariesGenerated": true
    },
    "video": {
      "status": "completed",
      "duration": 2340,
      "scriptPrepared": true
    }
  },
  "totalDuration": 24963,
  "message": "Daily bulletin generated successfully"
}
```

#### Response (200 OK) - Boletín ya existe

```json
{
  "success": true,
  "skipped": true,
  "message": "Bulletin for today already exists",
  "existingBulletinId": "uuid-456",
  "existingBulletinStatus": "ready"
}
```

#### Errores

**401 Unauthorized** - Secret inválido
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing CRON_SECRET"
}
```

**500 Internal Server Error** - Fallo en el pipeline
```json
{
  "error": "Pipeline failed",
  "message": "One or more steps in the pipeline failed",
  "bulletinId": "uuid-123",
  "pipeline": {
    "scraping": {
      "status": "completed",
      "duration": 8543
    },
    "classification": {
      "status": "failed",
      "error": "AI API timeout",
      "duration": 60000
    },
    "summarization": {
      "status": "skipped"
    },
    "video": {
      "status": "skipped"
    }
  }
}
```

#### Ejemplo con curl

```bash
# Ejecutar manualmente para testing
curl -X GET http://localhost:3000/api/cron/daily-bulletin \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### Configuración en Vercel

**Archivo `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-bulletin",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Cron Expression**: `0 6 * * *` = Todos los días a las 6:00 AM UTC

⏰ **Nota**: Ajustar timezone si es necesario. Ecuador está en UTC-5, por lo que 6 AM Ecuador = 11 AM UTC.

Para 6 AM Ecuador, usar: `0 11 * * *`

---

## 🔒 Códigos de Estado HTTP

### Success (2xx)
- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado (no usado actualmente)

### Client Errors (4xx)
- **400 Bad Request**: Datos de entrada inválidos
- **401 Unauthorized**: No autenticado o secret inválido
- **403 Forbidden**: Autenticado pero sin permisos
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto (ej: boletín ya existe)

### Server Errors (5xx)
- **500 Internal Server Error**: Error del servidor o lógica de negocio
- **503 Service Unavailable**: Servicio externo no disponible (ej: OpenRouter down)

---

## 🧪 Testing de Endpoints

### Setup para Testing Local

1. **Iniciar dev server:**
   ```bash
   pnpm run dev
   ```

2. **Obtener session token:**
   - Login via UI en http://localhost:3000
   - Abrir DevTools → Application → Cookies
   - Copiar valor de `better-auth.session_token`

3. **Usar Postman, Thunder Client, o curl**

### Testing del Pipeline Completo

Script de testing secuencial:

```bash
#!/bin/bash

# Variables
BASE_URL="http://localhost:3000"
SESSION_TOKEN="your-session-token-here"

# 1. Scrape
echo "1. Starting scrape..."
SCRAPE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/news/scrape" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN")

BULLETIN_ID=$(echo $SCRAPE_RESPONSE | jq -r '.bulletinId')
echo "Bulletin ID: $BULLETIN_ID"

# Esperar 5 segundos
sleep 5

# 2. Classify
echo "2. Starting classification..."
curl -s -X POST "$BASE_URL/api/news/classify" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -d "{\"bulletinId\": \"$BULLETIN_ID\"}"

# Esperar 5 segundos
sleep 5

# 3. Summarize
echo "3. Starting summarization..."
curl -s -X POST "$BASE_URL/api/news/summarize" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -d "{\"bulletinId\": \"$BULLETIN_ID\", \"streaming\": false}"

# Esperar 5 segundos
sleep 5

# 4. Generate Video
echo "4. Preparing video script..."
curl -s -X POST "$BASE_URL/api/news/generate-video" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -d "{\"bulletinId\": \"$BULLETIN_ID\"}"

# 5. Get bulletin details
echo "5. Fetching bulletin details..."
curl -s -X GET "$BASE_URL/api/bulletins/$BULLETIN_ID" \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" | jq

echo "Pipeline test completed!"
```

---

## 📊 Rate Limits & Quotas

### OpenRouter (AI)
- Depende del plan contratado
- Típicamente: 60 requests/min para modelos Claude
- Costo por token (ver pricing de OpenRouter)

### Firecrawl (Scraping)
- Plan gratuito: 500 requests/mes
- Plan pagado: Custom limits
- Rate limit: 10 requests/min

### Vercel (Hosting)
- Function execution time: 10s (Hobby), 60s (Pro)
- Invocations: 100k/mes (Hobby), Unlimited (Pro)
- Cron jobs: Ilimitados

---

## 🚨 Error Handling Best Practices

### Estructura de Error Estándar

Todos los errores siguen este formato:

```json
{
  "error": "ErrorType",
  "message": "Human readable error message",
  "details": {
    // Información adicional opcional
  },
  "timestamp": "2025-11-12T10:30:00Z"
}
```

### Retry Strategy para Clientes

Para errores 5xx (server errors):
- Retry hasta 3 veces
- Backoff exponencial: 1s, 2s, 4s
- Log de cada intento

Para errores 4xx (client errors):
- NO retry automático
- Mostrar error al usuario
- Log para debugging

---

## 📝 Changelog de API

### Versión 1.0 (Noviembre 2025)
- ✅ Endpoints iniciales de news (scrape, classify, summarize, generate-video)
- ✅ CRUD completo de bulletins
- ✅ Endpoint de cron para automatización
- ✅ Autenticación con Better Auth
- ✅ Paginación y filtros en lista de bulletins

### Futuro (v1.1)
- [ ] Webhook para notificaciones
- [ ] Endpoint para regenerar resumen de categoría específica
- [ ] Endpoint para estadísticas y analytics
- [ ] Soporte para múltiples idiomas
- [ ] Versioning de API (v2)

---

**Versión**: 1.0
**Fecha**: Noviembre 2025
**Proyecto**: OttoSeguridad - Sistema de Boletines
