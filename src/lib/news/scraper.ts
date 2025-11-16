/**
 * Módulo de Scraping de Noticias
 *
 * Arquitectura 100% Crawl4AI:
 * - Extracción directa de artículos desde páginas de categoría
 * - Opción de enriquecimiento con contenido completo
 */

import {
  getActiveSources,
  updateSourceLastScraped,
} from "@/lib/db/queries/sources";
import type { NewsSource } from "@/lib/schema";
import { extractCategoryArticles, extractArticles } from "@/lib/crawl4ai";

/**
 * Estructura de un artículo scrapeado
 */
export interface ScrapedArticle {
  id?: string; // UUID generado para identificar la noticia
  title: string;
  content: string; // Excerpt/resumen del artículo
  fullContent?: string; // Contenido completo del artículo
  url: string;
  imageUrl?: string; // URL de la imagen principal
  author?: string; // Autor del artículo
  publishedDate?: string; // Fecha de publicación
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
  console.log("🔍 Iniciando scraping de todas las fuentes con Crawl4AI...");

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

    // 🧪 MODO TEST: Solo scrapear Primicias para diagnóstico
    const testMode = true;
    const primiciasSource = sources.find(s => s.name.toLowerCase().includes('primicias'));
    const sourcesToScrape = testMode && primiciasSource ? [primiciasSource] : sources;
    console.log(`🧪 MODO TEST ACTIVADO: Solo scrapeando ${sourcesToScrape.map(s => s.name).join(', ')}`);

    // Scrapear cada fuente
    const scrapePromises = sourcesToScrape.map(async (source) => {
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
 * Esta función es OPCIONAL. Después de extraer artículos de páginas de categoría,
 * puedes usarla para obtener el contenido completo de cada artículo.
 *
 * @param result - Resultado del scraping inicial
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
    enableEnrichment?: boolean;
  }
): Promise<ScrapeResult> {
  const enableEnrichment = options?.enableEnrichment ?? false;

  if (!enableEnrichment) {
    console.log("⏭️  Enriquecimiento deshabilitado, saltando...");
    return result;
  }

  console.log("🚀 Iniciando enriquecimiento con contenido completo...");

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

    // Procesar todas las fuentes EN PARALELO para mayor velocidad
    const enrichPromises = sources.map(async (sourceKey) => {
      const articles = result[sourceKey];

      if (articles.length === 0) {
        console.log(`  ⏭️  ${sourceKey}: Sin artículos para enriquecer`);
        return { sourceKey, mergedArticles: [], enrichedCount: 0, failedCount: 0 };
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

        // Contadores locales
        let enrichedCount = 0;
        let failedCount = 0;

        // Merge: Combinar datos básicos con contenido completo
        const mergedArticles = articles.map((article) => {
          const fullArticle = fullArticleMap.get(article.url);

          if (fullArticle) {
            enrichedCount++;
            return {
              ...article,
              fullContent: fullArticle.fullContent,
              author: fullArticle.author || article.author,
              publishedDate: fullArticle.publishedDate || article.publishedDate,
              imageUrl: fullArticle.imageUrl || article.imageUrl,
              metadata: fullArticle.metadata,
            };
          } else {
            failedCount++;
            console.warn(`  ⚠️  ${sourceKey}: No se pudo enriquecer ${article.url}`);
            return article;
          }
        });

        console.log(
          `  ✓ ${sourceKey}: ${enrichedCount}/${articles.length} artículos enriquecidos`
        );

        return { sourceKey, mergedArticles, enrichedCount, failedCount };
      } catch (error) {
        console.error(`  ✗ ${sourceKey} falló en enriquecimiento:`, error);
        // Mantener artículos originales si falla
        return { sourceKey, mergedArticles: articles, enrichedCount: 0, failedCount: articles.length };
      }
    });

    // Esperar a que todas las fuentes terminen (en paralelo)
    const enrichResults = await Promise.all(enrichPromises);

    // Combinar resultados
    for (const { sourceKey, mergedArticles, enrichedCount, failedCount } of enrichResults) {
      enrichedResult[sourceKey] = mergedArticles;
      totalEnriched += enrichedCount;
      totalFailed += failedCount;
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
 * Scrapea una fuente individual usando Crawl4AI
 *
 * @param source - Fuente a scrapear
 * @returns Array de artículos scrapeados
 *
 * @throws Error si el scraping falla
 *
 * @example
 * ```ts
 * const source = await getSourceByName("Primicias");
 * const articles = await scrapeSource(source);
 * ```
 */
export async function scrapeSource(source: NewsSource): Promise<ScrapedArticle[]> {
  // Verificar si hay múltiples URLs en scrapeConfig
  const scrapeConfig = source.scrapeConfig as ScrapeConfig | null;
  const urls = scrapeConfig?.urls || [source.url];

  // 🧪 MODO TEST: Solo scrapear la primera URL
  const testMode = true;
  const urlsToScrape = testMode ? urls.slice(0, 1) : urls;
  console.log(`  📋 ${source.name}: ${urlsToScrape.length}/${urls.length} URL(s) a scrapear (MODO TEST)`);

  const allArticles: ScrapedArticle[] = [];

  // Scrapear cada URL con Crawl4AI
  for (let urlIndex = 0; urlIndex < urlsToScrape.length; urlIndex++) {
    const url = urlsToScrape[urlIndex];
    const urlLabel = urlsToScrape.length > 1 ? `${urlIndex + 1}/${urlsToScrape.length}` : "";

    console.log(`  🔗 ${source.name} ${urlLabel}: ${url}`);

    try {
      // Usar extractCategoryArticles para páginas de categoría
      const articles = await extractCategoryArticles(url, source.name);

      // Los artículos ya vienen en el formato correcto de ScrapedArticle
      allArticles.push(...articles);
      console.log(`  ✓ ${source.name} ${urlLabel}: ${articles.length} artículos`);
    } catch (error) {
      console.error(
        `  ⚠️  ${source.name} ${urlLabel} falló con Crawl4AI:`,
        (error as Error).message
      );
      // Continuar con la siguiente URL
    }
  }

  console.log(
    `  ✅ ${source.name}: Total ${allArticles.length} artículos de ${urls.length} URL(s)`
  );

  return allArticles;
}
