/**
 * Módulo de Scraping de Noticias
 *
 * Arquitectura Híbrida:
 * - FASE 1 (Firecrawl): Descubrimiento rápido de URLs en páginas de categorías
 * - FASE 2 (Crawl4AI): Extracción completa de artículos con contenido full
 */

import {
  getActiveSources,
  updateSourceLastScraped,
} from "@/lib/db/queries/sources";
import type { NewsSource } from "@/lib/schema";
import { extractArticles } from "@/lib/crawl4ai";

/**
 * Constantes de configuración
 */
const SCRAPE_TIMEOUT = 120000; // 120 segundos (2 minutos) - Firecrawl puede ser lento
const MAX_RETRIES = 2; // Reducir a 2 intentos ya que cada uno toma más tiempo
const RETRY_DELAYS = [3000, 5000]; // 3s, 5s

/**
 * Obtiene la URL del API de Firecrawl desde variables de entorno
 */
function getFirecrawlApiUrl(): string {
  const baseUrl = process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev";
  // Asegurar que termina con /v1/scrape
  return baseUrl.endsWith("/v1/scrape")
    ? baseUrl
    : `${baseUrl}/v1/scrape`;
}

/**
 * Estructura de un artículo scrapeado
 */
export interface ScrapedArticle {
  id?: string; // UUID generado para identificar la noticia
  title: string;
  content: string; // Excerpt/resumen del artículo (de Firecrawl)
  fullContent?: string; // Contenido completo del artículo (de Crawl4AI)
  url: string;
  imageUrl?: string; // URL de la imagen principal
  author?: string; // Autor del artículo (de Crawl4AI)
  publishedDate?: string; // Fecha de publicación (de Crawl4AI)
  source: string;
  selected?: boolean; // Si está seleccionada para el boletín (por defecto true)
  scrapedAt?: string; // Timestamp del scraping
  metadata?: {
    wordCount?: number; // Número de palabras en el artículo
    readingTime?: number; // Tiempo estimado de lectura (minutos)
    contentQuality?: number; // Score de calidad del contenido (0-100)
  };
}

/**
 * Resultado del scraping
 */
export interface ScrapeResult {
  primicias: ScrapedArticle[];
  laHora: ScrapedArticle[];
  elComercio: ScrapedArticle[];
  teleamazonas: ScrapedArticle[];
  ecu911: ScrapedArticle[];
  metadata: {
    totalArticles: number;
    scrapedAt: string;
    sourcesSuccess: number;
    sourcesFailed: number;
    errors: Array<{ source: string; error: string }>;
  };
}

/**
 * Configuración de scraping de una fuente
 */
interface ScrapeConfig {
  urls?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  removeBase64Images?: boolean;
}

/**
 * Estructura de respuesta de Firecrawl
 */
interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
}

/**
 * Espera un tiempo específico (helper para delays)
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normaliza el nombre de la fuente para usar como key
 *
 * @param name - Nombre de la fuente
 * @returns Key normalizada (camelCase)
 *
 * @example
 * ```ts
 * normalizeSourceName("Primicias") // "primicias"
 * normalizeSourceName("La Hora") // "laHora"
 * normalizeSourceName("El Comercio") // "elComercio"
 * ```
 */
function normalizeSourceName(name: string): keyof Omit<ScrapeResult, "metadata"> {
  const normalized = name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^el/, "el")
    .replace(/^la/, "la");

  // Mapeo específico
  const mapping: Record<string, keyof Omit<ScrapeResult, "metadata">> = {
    primicias: "primicias",
    lahora: "laHora",
    elcomercio: "elComercio",
    teleamazonas: "teleamazonas",
    ecu911: "ecu911",
  };

  return mapping[normalized] || "primicias";
}

/**
 * Scrapea todas las fuentes activas
 *
 * @returns Resultado del scraping con artículos organizados por fuente
 *
 * @example
 * ```ts
 * const result = await scrapeAllSources();
 * console.log(`Total: ${result.metadata.totalArticles} artículos`);
 * console.log(`Primicias: ${result.primicias.length} artículos`);
 * ```
 */
export async function scrapeAllSources(): Promise<ScrapeResult> {
  console.log("🔍 Iniciando scraping de todas las fuentes...");

  const result: ScrapeResult = {
    primicias: [],
    laHora: [],
    elComercio: [],
    teleamazonas: [],
    ecu911: [],
    metadata: {
      totalArticles: 0,
      scrapedAt: new Date().toISOString(),
      sourcesSuccess: 0,
      sourcesFailed: 0,
      errors: [],
    },
  };

  try {
    // Obtener fuentes activas
    const sources = await getActiveSources();
    console.log(`📡 Encontradas ${sources.length} fuentes activas`);

    // Scrapear cada fuente
    const scrapePromises = sources.map(async (source) => {
      try {
        console.log(`  → Scraping ${source.name}...`);
        const articles = await scrapeSource(source);

        // Actualizar fuente como exitosa
        await updateSourceLastScraped(source.id, "success");

        // Agregar artículos al resultado
        const sourceKey = normalizeSourceName(source.name);
        result[sourceKey] = articles;
        result.metadata.sourcesSuccess++;

        console.log(`  ✓ ${source.name}: ${articles.length} artículos`);
      } catch (error) {
        console.error(`  ✗ ${source.name} falló:`, error);

        // Actualizar fuente como fallida
        await updateSourceLastScraped(source.id, "failed");

        result.metadata.sourcesFailed++;
        result.metadata.errors.push({
          source: source.name,
          error: (error as Error).message,
        });
      }
    });

    // Esperar a que todas las fuentes terminen
    await Promise.all(scrapePromises);

    // Calcular total de artículos
    result.metadata.totalArticles =
      result.primicias.length +
      result.laHora.length +
      result.elComercio.length +
      result.teleamazonas.length +
      result.ecu911.length;

    console.log(`✅ Scraping completado: ${result.metadata.totalArticles} artículos totales`);

    return result;
  } catch (error) {
    console.error("❌ Error en scrapeAllSources:", error);
    throw new Error(
      `Error scraping fuentes: ${(error as Error).message}`
    );
  }
}

/**
 * Enriquece artículos con contenido completo usando Crawl4AI
 *
 * FASE 2 del pipeline híbrido: Después de descubrir URLs con Firecrawl,
 * esta función extrae el contenido completo de cada artículo.
 *
 * @param result - Resultado del scraping inicial (FASE 1)
 * @param options - Opciones de configuración
 * @returns Resultado enriquecido con contenido completo
 *
 * @example
 * ```ts
 * const basicResult = await scrapeAllSources();
 * const enrichedResult = await enrichWithFullContent(basicResult);
 * console.log(`Enriquecidos: ${enrichedResult.metadata.totalArticles} artículos`);
 * ```
 */
export async function enrichWithFullContent(
  result: ScrapeResult,
  options?: {
    maxConcurrency?: number;
    enableCrawl4AI?: boolean;
  }
): Promise<ScrapeResult> {
  const enableCrawl4AI = options?.enableCrawl4AI ?? true;

  if (!enableCrawl4AI) {
    console.log("⏭️  Crawl4AI deshabilitado, saltando enriquecimiento");
    return result;
  }

  console.log("🚀 Iniciando FASE 2: Enriquecimiento con Crawl4AI...");

  const enrichedResult: ScrapeResult = { ...result };
  let totalEnriched = 0;
  let totalFailed = 0;

  try {
    // Procesar cada fuente
    const sources: Array<keyof Omit<ScrapeResult, "metadata">> = [
      "primicias",
      "laHora",
      "elComercio",
      "teleamazonas",
      "ecu911",
    ];

    for (const sourceKey of sources) {
      const articles = result[sourceKey];

      if (articles.length === 0) {
        console.log(`  ⏭️  ${sourceKey}: Sin artículos para enriquecer`);
        continue;
      }

      console.log(`  🔍 ${sourceKey}: Enriqueciendo ${articles.length} artículos...`);

      try {
        // Extraer URLs de los artículos
        const urls = articles.map((article) => article.url);
        const sourceName = articles[0].source;

        // Usar Crawl4AI para extraer contenido completo
        const fullArticles = await extractArticles(
          urls,
          sourceName,
          options?.maxConcurrency || 5
        );

        // Crear mapa de artículos completos por URL
        const fullArticleMap = new Map(fullArticles.map((article) => [article.url, article]));

        // Merge: Combinar datos de Firecrawl (excerpts) con Crawl4AI (contenido completo)
        const mergedArticles = articles.map((article) => {
          const fullArticle = fullArticleMap.get(article.url);

          if (fullArticle) {
            totalEnriched++;
            return {
              ...article,
              fullContent: fullArticle.fullContent,
              author: fullArticle.author || article.author,
              publishedDate: fullArticle.publishedDate || article.publishedDate,
              imageUrl: fullArticle.imageUrl || article.imageUrl,
              metadata: fullArticle.metadata,
            };
          } else {
            totalFailed++;
            console.warn(`  ⚠️  ${sourceKey}: No se pudo enriquecer ${article.url}`);
            return article;
          }
        });

        enrichedResult[sourceKey] = mergedArticles;

        console.log(
          `  ✓ ${sourceKey}: ${fullArticles.length}/${articles.length} artículos enriquecidos`
        );
      } catch (error) {
        console.error(`  ✗ ${sourceKey} falló en enriquecimiento:`, error);
        // Mantener artículos originales si falla
        enrichedResult[sourceKey] = articles;
        totalFailed += articles.length;
      }
    }

    console.log(
      `✅ Enriquecimiento completado: ${totalEnriched} exitosos, ${totalFailed} fallidos`
    );

    return enrichedResult;
  } catch (error) {
    console.error("❌ Error en enrichWithFullContent:", error);
    // En caso de error, retornar resultado original sin enriquecer
    return result;
  }
}

/**
 * Scrapea una fuente individual usando Firecrawl API
 *
 * @param source - Fuente a scrapear
 * @returns Array de artículos scrapeados
 *
 * @throws Error si el scraping falla después de todos los reintentos
 *
 * @example
 * ```ts
 * const source = await getSourceByName("Primicias");
 * const articles = await scrapeSource(source);
 * ```
 */
export async function scrapeSource(source: NewsSource): Promise<ScrapedArticle[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY no está configurada");
  }

  // Verificar si hay múltiples URLs en scrapeConfig
  const scrapeConfig = source.scrapeConfig as ScrapeConfig | null;
  const urls = scrapeConfig?.urls || [source.url];

  console.log(`  📋 ${source.name}: ${urls.length} URL(s) a scrapear`);

  // Scrapear cada URL
  const allArticles: ScrapedArticle[] = [];

  for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
    const url = urls[urlIndex];
    const urlLabel = urls.length > 1 ? `${urlIndex + 1}/${urls.length}` : "";

    console.log(`  🔗 ${source.name} ${urlLabel}: ${url}`);

    try {
      const articles = await scrapeURL(url, source, apiKey);
      allArticles.push(...articles);
      console.log(`  ✓ ${source.name} ${urlLabel}: ${articles.length} artículos`);
    } catch (error) {
      console.error(`  ⚠️  ${source.name} ${urlLabel} falló:`, (error as Error).message);
      // Continuar con la siguiente URL aunque esta falle
    }
  }

  console.log(`  ✅ ${source.name}: Total ${allArticles.length} artículos de ${urls.length} URL(s)`);

  return allArticles;
}

/**
 * Scrapea una URL específica usando Firecrawl API
 *
 * @param url - URL a scrapear
 * @param source - Fuente de la cual proviene la URL
 * @param apiKey - API key de Firecrawl
 * @returns Array de artículos scrapeados
 */
async function scrapeURL(
  url: string,
  source: NewsSource,
  apiKey: string
): Promise<ScrapedArticle[]> {
  let lastError: Error | null = null;

  // Intentar scraping con reintentos
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const attemptStart = Date.now();
    console.log(`  🔄 Intento ${attempt + 1}/${MAX_RETRIES} para ${source.name}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`  ⏰ Timeout alcanzado para ${source.name} (${SCRAPE_TIMEOUT / 1000}s)`);
        controller.abort();
      }, SCRAPE_TIMEOUT);

      const apiUrl = getFirecrawlApiUrl();
      if (attempt === 0) {
        console.log(`  🌐 Using Firecrawl API: ${apiUrl}`);
      }

      // POST a Firecrawl API
      const fetchStart = Date.now();
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: url, // Usar el parámetro url, no source.url
          formats: ["markdown", "html"],
          onlyMainContent: true,
          waitFor: 0, // No esperar, scrapear inmediatamente
          removeBase64Images: true,
          timeout: 90000, // 90 segundos de timeout en Firecrawl
          mobile: false, // Desktop user agent (más rápido)
          skipTlsVerification: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const fetchDuration = Date.now() - fetchStart;
      console.log(`  ⏱️  Fetch completado en ${(fetchDuration / 1000).toFixed(2)}s`);

      // Verificar respuesta
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  ❌ Error HTTP ${response.status} de Firecrawl:`, errorText.substring(0, 200));
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: FirecrawlResponse = await response.json();

      if (!data.success || !data.data) {
        console.error(`  ❌ Firecrawl retornó error:`, data.error || "Sin datos");
        throw new Error(data.error || "Firecrawl no retornó datos");
      }

      console.log(`  ✓ Respuesta de Firecrawl recibida exitosamente`);

      // Parsear artículos usando la nueva función de categorías
      const articles = parseCategoryPage(data, source.name, url);

      const totalDuration = Date.now() - attemptStart;
      console.log(`  ✅ ${source.name} completado en ${(totalDuration / 1000).toFixed(2)}s`);

      return articles;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `  Intento ${attempt + 1}/${MAX_RETRIES} falló para ${source.name}:`,
        (error as Error).message
      );

      // Si no es el último intento, esperar antes de reintentar
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  throw new Error(
    `Scraping de ${source.name} falló después de ${MAX_RETRIES} intentos: ${lastError?.message}`
  );
}

/**
 * Parsea una página de categoría y extrae múltiples noticias
 * Esta función detecta "cards" de noticias en páginas de categorías
 *
 * @param response - Respuesta de Firecrawl API
 * @param sourceName - Nombre de la fuente
 * @param sourceUrl - URL de la página scrapeada
 * @returns Array de artículos extraídos
 */
export function parseCategoryPage(
  response: FirecrawlResponse,
  sourceName: string,
  sourceUrl: string
): ScrapedArticle[] {
  if (!response.data) {
    console.log(`  ⚠️  ${sourceName}: No data in response`);
    return [];
  }

  const articles: ScrapedArticle[] = [];
  const markdown = response.data.markdown || "";
  const html = response.data.html || "";

  console.log(`  📊 ${sourceName}: Parseando página de categoría...`);
  console.log(`  📄 markdown=${markdown.length} chars, html=${html.length} chars`);

  try {
    // ESTRATEGIA 1: Buscar enlaces en markdown con títulos
    // Patrón: [Título](URL)
    const markdownLinks = markdown.matchAll(/\[([^\]]{20,200})\]\((https?:\/\/[^\)]+)\)/g);
    const linksFound = Array.from(markdownLinks);

    console.log(`  🔍 Estrategia 1 (markdown links): ${linksFound.length} enlaces encontrados`);

    for (const match of linksFound.slice(0, 5)) { // Máximo 5 noticias
      const title = match[1].trim();
      const url = match[2];

      // Buscar contenido cercano al link
      const linkIndex = markdown.indexOf(match[0]);
      const contentAfter = markdown.substring(linkIndex + match[0].length, linkIndex + 500);
      const content = contentAfter
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '') // Remover otros links
        .replace(/[#*_]/g, '') // Remover markdown syntax
        .trim()
        .substring(0, 300);

      // Buscar imagen en markdown cercana
      const imageMatch = markdown.substring(linkIndex - 200, linkIndex + 200)
        .match(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/);
      const imageUrl = imageMatch ? imageMatch[2] : undefined;

      const article: ScrapedArticle = {
        id: crypto.randomUUID(),
        title,
        content: content || title, // Si no hay contenido, usar el título
        url,
        imageUrl,
        source: sourceName,
        selected: true,
        scrapedAt: new Date().toISOString(),
      };

      if (validateCategoryArticle(article)) {
        articles.push(article);
      }
    }

    // ESTRATEGIA 2: Si no encontramos suficientes, buscar en HTML
    if (articles.length < 3 && html) {
      console.log(`  🔍 Estrategia 2 (HTML parsing): Buscando noticias en HTML...`);

      // Buscar enlaces que parezcan noticias (con texto largo)
      const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{20,200})<\/a>/gi;
      const htmlLinks = Array.from(html.matchAll(linkPattern));

      console.log(`  📰 Encontrados ${htmlLinks.length} enlaces en HTML`);

      for (const match of htmlLinks.slice(0, 5)) {
        const url = match[1];
        const title = match[2].replace(/<[^>]+>/g, '').trim();

        // Filtrar URLs que no sean artículos
        if (!url.match(/https?:\/\//)) continue;
        if (url.includes('javascript:')) continue;
        if (url.match(/\/(login|registro|suscripcion|newsletter)/i)) continue;

        // Verificar si ya tenemos esta noticia
        if (articles.some(a => a.url === url)) continue;

        // Buscar imagen cercana
        const linkIndex = html.indexOf(match[0]);
        const htmlContext = html.substring(Math.max(0, linkIndex - 500), linkIndex + 500);
        const imgMatch = htmlContext.match(/<img[^>]+src=["']([^"']+)["']/i);
        const imageUrl = imgMatch ? imgMatch[1] : undefined;

        // Buscar contenido/descripción cercana
        const paragraphMatch = htmlContext.match(/<p[^>]*>([^<]{50,300})<\/p>/i);
        const content = paragraphMatch
          ? paragraphMatch[1].replace(/<[^>]+>/g, '').trim()
          : title;

        const article: ScrapedArticle = {
          id: crypto.randomUUID(),
          title,
          content,
          url: url.startsWith('http') ? url : new URL(url, sourceUrl).toString(),
          imageUrl: imageUrl?.startsWith('http') ? imageUrl : undefined,
          source: sourceName,
          selected: true,
          scrapedAt: new Date().toISOString(),
        };

        if (validateCategoryArticle(article)) {
          articles.push(article);
        }

        if (articles.length >= 5) break; // Máximo 5 noticias
      }
    }

    console.log(`  ✅ ${sourceName}: Extraídas ${articles.length} noticias de la página de categoría`);

    if (articles.length === 0) {
      console.warn(`  ⚠️  ${sourceName}: No se pudieron extraer noticias`);
      console.warn(`     URL: ${sourceUrl}`);
      console.warn(`     - Markdown preview: ${markdown.substring(0, 300)}`);
    }

    return articles;
  } catch (error) {
    console.error(`  ❌ Error parseando categoría de ${sourceName}:`, error);
    return [];
  }
}

/**
 * Valida un artículo de página de categoría
 * Requisitos más relajados que artículos individuales
 */
function validateCategoryArticle(article: ScrapedArticle): boolean {
  // Título mínimo 15 caracteres
  if (!article.title || article.title.length < 15) {
    console.log(`    ⚠️  Artículo rechazado: título muy corto (${article.title?.length || 0} chars)`);
    return false;
  }

  // URL debe ser válida
  if (!article.url || !article.url.match(/^https?:\/\/.+/)) {
    console.log(`    ⚠️  Artículo rechazado: URL inválida - "${article.url}"`);
    return false;
  }

  // Filtrar títulos que no parezcan noticias
  const lowercaseTitle = article.title.toLowerCase();
  const bannedWords = ['publicidad', 'suscríbete', 'newsletter', 'cookie', 'política de privacidad'];
  if (bannedWords.some(word => lowercaseTitle.includes(word))) {
    console.log(`    ⚠️  Artículo rechazado: título parece ser navegación/publicidad`);
    return false;
  }

  return true;
}

/**
 * Parsea la respuesta de Firecrawl y extrae artículos
 *
 * @param response - Respuesta de Firecrawl API
 * @param sourceName - Nombre de la fuente
 * @returns Array de artículos extraídos
 *
 * @example
 * ```ts
 * const response = { success: true, data: { markdown: "..." } };
 * const articles = parseFirecrawlResponse(response, "Primicias");
 * ```
 */
export function parseFirecrawlResponse(
  response: FirecrawlResponse,
  sourceName: string,
  _sourceUrl: string
): ScrapedArticle[] {
  if (!response.data) {
    console.log(`  ⚠️  ${sourceName}: No data in response`);
    return [];
  }

  const articles: ScrapedArticle[] = [];
  const markdown = response.data.markdown || "";
  const html = response.data.html || "";

  console.log(`  📊 ${sourceName}: markdown=${markdown.length} chars, html=${html.length} chars`);

  try {
    // Estrategia 1: Parsear por headers de markdown (## Título)
    const markdownHeaders = markdown.match(/^##\s+(.+?)$([\s\S]+?)(?=^##\s+|$)/gm);

    console.log(`  🔍 ${sourceName}: Estrategia 1 (markdown headers) encontró ${markdownHeaders?.length || 0} matches`);

    if (markdownHeaders && markdownHeaders.length > 0) {
      for (const match of markdownHeaders) {
        const lines = match.split("\n");
        const title = lines[0].replace(/^##\s+/, "").trim();
        const content = lines.slice(1).join("\n").trim();

        // Intentar extraer URL del contenido
        const urlMatch = content.match(/https?:\/\/[^\s)]+/);
        const url = urlMatch ? urlMatch[0] : "";

        const article: ScrapedArticle = {
          id: crypto.randomUUID(),
          title,
          content: content.substring(0, 500), // Limitar a 500 chars
          url,
          source: sourceName,
          selected: true,
          scrapedAt: new Date().toISOString(),
        };

        if (validateArticle(article)) {
          articles.push(article);
        }
      }
    }

    // Estrategia 2: Si no hay headers, intentar con HTML
    if (articles.length === 0 && html) {
      console.log(`  🔍 ${sourceName}: Probando Estrategia 2 (HTML parsing)...`);

      // Regex para encontrar títulos en HTML (h1, h2, h3)
      const htmlTitles = html.match(/<h[123][^>]*>(.+?)<\/h[123]>/gi);

      console.log(`  🔍 ${sourceName}: Estrategia 2 encontró ${htmlTitles?.length || 0} títulos HTML`);

      if (htmlTitles && htmlTitles.length > 0) {
        for (const titleTag of htmlTitles.slice(0, 20)) {
          // Limitar a 20 artículos
          const title = titleTag.replace(/<[^>]+>/g, "").trim();

          // Buscar contenido después del título
          const titleIndex = html.indexOf(titleTag);
          const nextTitleIndex = html.indexOf("<h", titleIndex + titleTag.length);
          const endIndex = nextTitleIndex > -1 ? nextTitleIndex : titleIndex + 1000;

          const contentHtml = html.substring(
            titleIndex + titleTag.length,
            endIndex
          );
          const content = contentHtml
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 500);

          // Intentar extraer URL
          const urlMatch = contentHtml.match(/href=["']([^"']+)["']/);
          const url = urlMatch ? urlMatch[1] : "";

          const article: ScrapedArticle = {
            id: crypto.randomUUID(),
            title,
            content,
            url,
            source: sourceName,
            selected: true,
            scrapedAt: new Date().toISOString(),
          };

          if (validateArticle(article)) {
            articles.push(article);
          }
        }
      }
    }

    console.log(`  ✅ ${sourceName}: Parseados ${articles.length} artículos válidos`);

    if (articles.length === 0) {
      console.warn(`  ⚠️  ${sourceName}: No se pudo extraer ningún artículo válido`);
      console.warn(`     - Markdown preview: ${markdown.substring(0, 200)}`);
      console.warn(`     - HTML preview: ${html.substring(0, 200)}`);
    }

    return articles;
  } catch (error) {
    console.error(`  ❌ Error parseando respuesta de ${sourceName}:`, error);
    return [];
  }
}

/**
 * Valida que un artículo tenga los datos mínimos requeridos
 *
 * @param article - Artículo a validar
 * @returns true si el artículo es válido
 *
 * @example
 * ```ts
 * const article = { title: "Título", content: "Contenido...", url: "https://...", source: "Primicias" };
 * const isValid = validateArticle(article); // true
 * ```
 */
export function validateArticle(article: ScrapedArticle): boolean {
  // Verificar título min 10 chars
  if (!article.title || article.title.length < 10) {
    console.log(`    ❌ Artículo rechazado: título muy corto (${article.title?.length || 0} chars)`);
    return false;
  }

  // Verificar contenido min 50 chars
  if (!article.content || article.content.length < 50) {
    console.log(`    ❌ Artículo rechazado: contenido muy corto (${article.content?.length || 0} chars) - "${article.title}"`);
    return false;
  }

  // Verificar que source existe
  if (!article.source) {
    console.log(`    ❌ Artículo rechazado: sin source`);
    return false;
  }

  // URL es opcional pero si existe debe ser válida
  if (article.url && !article.url.match(/^https?:\/\/.+/)) {
    console.log(`    ❌ Artículo rechazado: URL inválida - "${article.url}"`);
    return false;
  }

  return true;
}
