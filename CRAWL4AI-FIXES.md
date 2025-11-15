# 🔧 Crawl4AI - Problemas Detectados y Soluciones Aplicadas

**Fecha:** 2025-11-14
**Análisis basado en:** Logs de producción + Captura `bol14.jpg`

---

## 🐛 PROBLEMAS DETECTADOS

### 1. **Bug Crítico: Formato API incorrecto** ❌ CRÍTICO

**Síntoma:**
```json
{"detail":[{"type":"missing","loc":["body","urls"],"msg":"Field required"
```

**Causa:**
- Crawl4AI API espera `urls` (plural, array)
- Nuestro código enviaba `url` (singular, string)

**Impacto:**
- **100% de fallos** en Crawl4AI (0/40 artículos exitosos)
- 200 segundos perdidos en errores y reintentos

**Solución Aplicada:** ✅
```typescript
// ANTES (❌ incorrecto)
body: JSON.stringify(config)  // config.url

// DESPUÉS (✅ correcto)
const { url, ...restConfig } = config;
const crawl4aiPayload = {
  urls: [url],  // Convertir a array
  ...restConfig,
};
body: JSON.stringify(crawl4aiPayload)
```

**Archivo:** `src/lib/crawl4ai/client.ts:127-132`

---

### 2. **URLs de imágenes siendo scrapeadas** ⚠️ MODERADO

**Síntoma:**
Crawl4AI intentaba scrapear URLs como:
- `https://imagenes.teleamazonas.com/files/image_448_252/uploads/...jpeg`
- `https://imagenes.teleamazonas.com/files/image_448_252/uploads/...png`

**Causa:**
- Firecrawl extrae TODAS las URLs de la página
- No filtramos imágenes antes de enviar a Crawl4AI

**Impacto:**
- ~30% de las URLs de Teleamazonas son imágenes
- Pérdida de tiempo y recursos
- Mensajes de error confusos

**Solución Aplicada:** ✅
```typescript
function isImageUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
  return imageExtensions.test(url);
}

// Filter out image URLs antes de procesar
const validUrls = urls.filter(url => !isImageUrl(url));
```

**Archivo:** `src/lib/crawl4ai/strategies.ts:83-115`

---

### 3. **3 Fuentes sin artículos (0 resultados)** ⚠️ ALTO

**Síntoma:**
- ECU911: 0/0 artículos
- La Hora: 0/0 artículos
- El Comercio: 0/0 artículos

**Fuentes que SÍ funcionan:**
- ✅ Primicias: 15 artículos
- ✅ Teleamazonas: 25 artículos (pero muchas son imágenes)

**Posibles causas:**
1. URLs de scraping incorrectas en la base de datos
2. Sitios bloqueando Firecrawl
3. Estructura HTML diferente (selectores incorrectos)
4. Fuentes desactivadas en BD

**Solución Pendiente:** ⏳
- Requiere revisar configuración en Drizzle Studio
- Ver `news_sources` table → campos `url`, `scrapeConfig`, `isActive`

---

## 📊 RESULTADOS: Antes vs Después

| Métrica | Antes (con bugs) | Después (corregido) | Mejora |
|---------|------------------|---------------------|--------|
| **Crawl4AI exitoso** | 0/40 (0%) | Pendiente probar | +100% esperado |
| **URLs válidas** | 40 (incluye imágenes) | ~28 (sin imágenes) | -30% ruido |
| **Tiempo perdido** | 200s en errores | ~0s esperado | -100% |
| **Fuentes activas** | 2/5 (40%) | Pendiente fix | +60% objetivo |

---

## 🎯 RECOMENDACIÓN FINAL: Mantener Arquitectura Híbrida

### ¿Por qué híbrida?

**Firecrawl (FASE 1):**
- ✅ Rápido: ~60s para 18 páginas
- ✅ Descubre 30-50 artículos
- ✅ Obtiene títulos y excerpts
- ❌ Contenido limitado (200-300 palabras)
- ❌ Costo: ~18 llamadas API

**Crawl4AI (FASE 2):**
- ✅ Gratis (auto-hospedado)
- ✅ Contenido completo (500-1500 palabras)
- ✅ Extrae autor, fecha, metadatos
- ✅ Calidad superior para IA
- ❌ Más lento (~3-5 min total)
- ❌ Requiere infraestructura Docker

**Estrategia híbrida = Lo mejor de ambos mundos:**
1. Firecrawl descubre URLs rápido y barato
2. Crawl4AI enriquece gratis con contenido completo
3. Fallback: Si Crawl4AI falla, sigues teniendo excerpts

---

## ✅ CORRECCIONES APLICADAS

### 1. Bug de formato API ✅
- [x] Cambiado `url` → `urls` en cliente
- [x] Conversión automática string → array
- [x] TypeScript pasa sin errores

### 2. Filtro de imágenes ✅
- [x] Función `isImageUrl()` implementada
- [x] Filtrado antes de enviar a Crawl4AI
- [x] Logs informativos de URLs filtradas

### 3. Optimizaciones ✅
- [x] Mejor manejo de errores
- [x] Logs más claros
- [x] Prevención de URLs inválidas

---

## 📋 PRÓXIMOS PASOS RECOMENDADOS

### **Paso 1: Probar las correcciones** 🔥 URGENTE
```bash
# Reiniciar servidor si está corriendo
npm run dev

# Hacer nuevo scraping desde el dashboard
# POST /api/news/scrape con enableCrawl4AI: true
```

**Resultado esperado:**
- ✅ Crawl4AI debería funcionar (0% → ~80-90% éxito)
- ✅ Sin intentos de scrapear imágenes
- ✅ ~15-20 artículos enriquecidos de Primicias/Teleamazonas

### **Paso 2: Arreglar fuentes sin datos** ⚠️ ALTA PRIORIDAD

**Revisar en Drizzle Studio:**
```bash
npm run db:studio
# Abrir http://localhost:4983

# Revisar tabla: news_sources
# Verificar:
# - isActive = true
# - url es correcto
# - scrapeConfig tiene URLs múltiples si es necesario
```

**Fuentes a revisar:**
1. ECU911
2. La Hora
3. El Comercio

**Posibles fixes:**
- Actualizar URLs de scraping
- Agregar múltiples URLs en `scrapeConfig.urls`
- Verificar que no estén bloqueando Firecrawl

### **Paso 3: Optimizaciones adicionales** 📈 MEDIA PRIORIDAD

**Mejorar Firecrawl (FASE 1):**
```typescript
// Filtrar URLs de imágenes también en parseCategoryPage
function validateCategoryArticle(article: ScrapedArticle): boolean {
  // Agregar validación de URL
  if (isImageUrl(article.url)) {
    return false;
  }
  // ... resto de validaciones
}
```

**Configurar selectores específicos:**
- Cada fuente tiene estructura HTML diferente
- Configurar selectores CSS en `news_sources.scrapeConfig`

### **Paso 4: Monitoreo** 📊 BAJA PRIORIDAD

Agregar métricas en el dashboard:
- Tasa de éxito Crawl4AI por fuente
- Tiempo promedio de enriquecimiento
- Artículos con/sin contenido completo
- URLs filtradas (imágenes, inválidas)

---

## 🔍 DEBUGGING

### Si Crawl4AI sigue fallando:

**1. Verificar servicio:**
```bash
curl https://crawl.ottoseguridadai.com/health
# Debe retornar: {"status":"ok","version":"0.5.1-d1"}
```

**2. Probar scraping directo:**
```bash
curl -X POST https://crawl.ottoseguridadai.com/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://www.primicias.ec/noticias/politica/"],
    "word_count_threshold": 10
  }'
```

**3. Ver logs del servidor Next.js:**
- Buscar: "Crawl4AI API error"
- Buscar: "enriched"
- Buscar: "⚠️"

**4. Ver logs de Docker:**
```bash
# En servidor Contabo (SSH)
docker service logs crawl4ai_crawl4ai_api --tail 100
```

---

## 📚 ARCHIVOS MODIFICADOS

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `src/lib/crawl4ai/client.ts` | Fix formato API (url → urls) | 127-132 |
| `src/lib/crawl4ai/strategies.ts` | Filtro de imágenes | 83-115 |

---

## 💡 CONCLUSIONES

### ✅ Arquitectura híbrida ES LA CORRECTA

**Razones:**
1. Firecrawl aporta velocidad y descubrimiento
2. Crawl4AI aporta contenido completo gratis
3. Son complementarios, no competidores
4. Fallback robusto si uno falla

### ❌ NO usar solo Crawl4AI

**Por qué:**
- Más lento para descubrir URLs
- Necesitaría conocer URLs de antemano
- Firecrawl es mejor para páginas de categorías

### ❌ NO usar solo Firecrawl

**Por qué:**
- Solo obtiene excerpts (200 palabras)
- Costo aumentaría 5x para scraping completo
- Calidad inferior para procesamiento con IA

---

## 🎯 RESULTADO ESPERADO POST-FIX

**FASE 1 (Firecrawl):**
- 40 artículos descubiertos en ~60s
- Todas las fuentes activas (5/5)

**FASE 2 (Crawl4AI):**
- ~28 URLs válidas (sin imágenes)
- 25-28 artículos enriquecidos (~90% éxito)
- Duración: ~2-3 minutos

**Total:**
- 40 artículos con excerpts
- 25-28 artículos con contenido completo
- Duración: ~3-4 minutos
- Costo: 18 Firecrawl + $0 Crawl4AI

---

**🎉 Con estas correcciones, el sistema debería funcionar al 90% de su capacidad óptima.**

**Próximo paso crítico: PROBAR el scraping con las correcciones aplicadas.**
