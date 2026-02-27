/**
 * API Endpoint: POST /api/news/scrape
 *
 * Pipeline Híbrido de Scraping:
 * - FASE 1 (Firecrawl): Descubre URLs en páginas de categorías
 * - FASE 2 (Crawl4AI): Extrae contenido completo de artículos
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  createBulletin,
  getTodayBulletin,
  updateBulletinRawNews,
  updateBulletinFullArticles,
  updateBulletinStatus,
  createBulletinLog,
  updateBulletinClassification,
} from "@/lib/db/queries/bulletins";
import { scrapeAllSources, enrichWithFullContent, type ScrapedArticle } from "@/lib/news/scraper";
import { checkCrawl4AIHealth } from "@/lib/crawl4ai";

// Timeout máximo del servidor: 4 minutos (debe ser menor que el frontend de 5 min)
export const maxDuration = 240;

/**
 * Verifica si un proceso de boletín quedó atascado
 * Un proceso se considera atascado si lleva más de 10 minutos desde su creación
 */
function isStaleProcess(bulletin: { createdAt: Date }): boolean {
  const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutos
  const timeSinceCreation = Date.now() - new Date(bulletin.createdAt).getTime();

  if (timeSinceCreation > STALE_THRESHOLD_MS) {
    console.log(`⚠️  Boletín atascado detectado (${Math.round(timeSinceCreation / 1000 / 60)} minutos desde creación)`);
    return true;
  }

  return false;
}

/**
 * POST /api/news/scrape
 *
 * Scrapea noticias y crea boletín
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log(`🔐 Usuario autenticado: ${session.user.email}`);

    // Verificar salud de Crawl4AI antes de iniciar
    console.log("🏥 Verificando conexión con Crawl4AI...");
    const isCrawl4AIHealthy = await checkCrawl4AIHealth();
    if (!isCrawl4AIHealthy) {
      console.error("❌ Crawl4AI no está disponible");
      return NextResponse.json(
        {
          error: "El servicio de scraping (Crawl4AI) no está disponible. Verifica que el servicio esté corriendo.",
          details: `URL configurada: ${process.env.CRAWL4AI_API_URL || 'http://crawl4ai_api:11235'}`,
        },
        { status: 503 }
      );
    }
    console.log("✅ Crawl4AI disponible");

    // Verificar si ya existe boletín de hoy
    const todayBulletin = await getTodayBulletin();

    if (todayBulletin) {
      // Verificar si el boletín está "realmente" en proceso o solo quedó atascado
      const isStale = isStaleProcess(todayBulletin);

      // Solo permitir re-creación si el boletín falló o quedó atascado
      if (todayBulletin.status === "failed") {
        console.log(`⚠️  Boletín de hoy falló (${todayBulletin.status}), se creará uno nuevo`);
      } else if (isStale) {
        console.log(`⚠️  Boletín de hoy quedó atascado (${todayBulletin.status}), se creará uno nuevo`);
      } else {
        // Boletín existe y está en proceso o completado → bloquear
        return NextResponse.json(
          {
            error: "Ya existe un boletín para hoy",
            bulletinId: todayBulletin.id,
            status: todayBulletin.status,
          },
          { status: 409 }
        );
      }
    }

    // Crear nuevo bulletin con status 'scraping'
    const bulletin = await createBulletin({ status: "scraping" });

    console.log(`📄 Boletín creado: ${bulletin.id}`);

    // Crear log de inicio
    await createBulletinLog(
      bulletin.id,
      "scraping",
      "in_progress",
      "Iniciando scraping de fuentes",
      { startTime }
    );

    // Obtener configuración del request body
    const body = await request.json().catch(() => ({}));
    const disableFirecrawl = process.env.DISABLE_FIRECRAWL === "true";
    const enableCrawl4AI = body.enableCrawl4AI ?? true; // Habilitado por defecto

    // FASE 1: Scrapear todas las fuentes
    const phase1Start = Date.now();
    if (disableFirecrawl) {
      console.log("🔍 FASE 1: Iniciando scraping con Crawl4AI (Firecrawl deshabilitado)...");
    } else {
      console.log("🔍 FASE 1: Iniciando scraping con Firecrawl...");
    }
    console.log(`⏱️  TIMESTAMP: ${new Date().toISOString()}`);

    const scrapeResult = await scrapeAllSources();

    const phase1Duration = (Date.now() - phase1Start) / 1000;
    console.log(
      `✅ FASE 1 completada: ${scrapeResult.metadata.totalArticles} artículos descubiertos en ${phase1Duration.toFixed(2)}s`
    );

    // Actualizar bulletin con raw news (sin metadata)
    const { metadata, ...rawNewsOnly } = scrapeResult;
    await updateBulletinRawNews(
      bulletin.id,
      rawNewsOnly,
      scrapeResult.metadata.totalArticles
    );

    // Crear log de FASE 1
    await createBulletinLog(
      bulletin.id,
      "scraping",
      "completed",
      `FASE 1 (Firecrawl) completada: ${scrapeResult.metadata.totalArticles} artículos de ${scrapeResult.metadata.sourcesSuccess} fuentes`,
      {
        duration: phase1Duration * 1000, // Convertir segundos a milisegundos
        totalArticles: scrapeResult.metadata.totalArticles,
        sourcesSuccess: scrapeResult.metadata.sourcesSuccess,
        sourcesFailed: scrapeResult.metadata.sourcesFailed,
      }
    );

    // FASE 2: Enriquecer con Crawl4AI (opcional)
    // Si ya usamos Crawl4AI en FASE 1, saltamos FASE 2
    let enrichedResult = scrapeResult;
    let crawl4aiStats = null;

    if (disableFirecrawl) {
      console.log("⏭️  FASE 2 omitida: Ya se usó Crawl4AI en FASE 1");
      crawl4aiStats = {
        enabled: false,
        reason: "Already used in FASE 1",
      };
    } else if (enableCrawl4AI) {
      console.log("🚀 FASE 2: Enriqueciendo con Crawl4AI...");

      try {
        const phase2Start = Date.now();

        // Crear log de inicio FASE 2
        await createBulletinLog(
          bulletin.id,
          "enrichment",
          "in_progress",
          "Iniciando enriquecimiento con Crawl4AI",
          { startTime: phase2Start }
        );

        // Enriquecer artículos con contenido completo
        enrichedResult = await enrichWithFullContent(scrapeResult, {
          maxConcurrency: 5,
          enableEnrichment: true,
        });

        const phase2Duration = Date.now() - phase2Start;

        // Calcular estadísticas
        const totalArticles = scrapeResult.metadata.totalArticles;
        const enrichedCount = Object.values(enrichedResult)
          .filter((value) => Array.isArray(value))
          .reduce((count: number, articles: Array<{ fullContent?: string }>) => {
            return (
              count +
              articles.filter((article) => article.fullContent).length
            );
          }, 0);

        crawl4aiStats = {
          enabled: true,
          totalArticles,
          enrichedArticles: enrichedCount,
          failedArticles: totalArticles - enrichedCount,
          successRate: ((enrichedCount / totalArticles) * 100).toFixed(2) + "%",
          duration: phase2Duration,
        };

        // Actualizar bulletin con artículos completos
        const { metadata: _metadata, ...fullArticlesOnly } = enrichedResult;
        await updateBulletinFullArticles(
          bulletin.id,
          fullArticlesOnly,
          crawl4aiStats
        );

        // Crear log de FASE 2
        await createBulletinLog(
          bulletin.id,
          "enrichment",
          "completed",
          `FASE 2 (Crawl4AI) completada: ${enrichedCount}/${totalArticles} artículos enriquecidos`,
          crawl4aiStats
        );

        console.log(
          `✅ FASE 2 completada: ${enrichedCount}/${totalArticles} artículos enriquecidos`
        );
      } catch (error) {
        console.error("❌ Error en FASE 2 (Crawl4AI):", error);

        // Log de error pero continuar
        await createBulletinLog(
          bulletin.id,
          "enrichment",
          "failed",
          `Error en enriquecimiento: ${(error as Error).message}`,
          { error: (error as Error).message }
        );

        // Crawl4AI falló, pero tenemos los datos de Firecrawl
        crawl4aiStats = {
          enabled: true,
          failed: true,
          error: (error as Error).message,
        };
      }
    } else {
      console.log("⏭️  FASE 2 (Crawl4AI) deshabilitada");
      crawl4aiStats = { enabled: false };
    }

    // CLASIFICACIÓN AUTOMÁTICA: Organizar artículos por categoría (sin IA)
    console.log("📂 Iniciando clasificación automática por URL...");
    const classificationStart = Date.now();

    const classified = {
      economia: [] as ScrapedArticle[],
      politica: [] as ScrapedArticle[],
      sociedad: [] as ScrapedArticle[],
      seguridad: [] as ScrapedArticle[],
      internacional: [] as ScrapedArticle[],
      vial: [] as ScrapedArticle[],
    };

    // Clasificar artículos basándose en el campo category ya asignado
    const allArticles = [
      ...enrichedResult.primicias,
      ...enrichedResult.laHora,
      ...enrichedResult.elComercio,
      ...enrichedResult.teleamazonas,
      ...enrichedResult.ecu911,
    ];

    let classifiedCount = 0;
    let unclassifiedCount = 0;

    for (const article of allArticles) {
      if (article.category) {
        classified[article.category].push(article);
        classifiedCount++;
      } else {
        console.warn(`  ⚠️  Artículo sin categoría: ${article.title.substring(0, 50)}...`);
        unclassifiedCount++;
      }
    }

    const classificationDuration = Date.now() - classificationStart;

    console.log(`✅ Clasificación automática completada: ${classifiedCount} artículos clasificados, ${unclassifiedCount} sin clasificar`);
    console.log(`  📊 Distribución:`);
    console.log(`     Economía: ${classified.economia.length}`);
    console.log(`     Política: ${classified.politica.length}`);
    console.log(`     Sociedad: ${classified.sociedad.length}`);
    console.log(`     Seguridad: ${classified.seguridad.length}`);
    console.log(`     Internacional: ${classified.internacional.length}`);
    console.log(`     Vial: ${classified.vial.length}`);

    // Guardar clasificación en la base de datos
    await updateBulletinClassification(bulletin.id, classified);

    // Log de clasificación
    await createBulletinLog(
      bulletin.id,
      "classification",
      "completed",
      `Clasificación automática por URL: ${classifiedCount} artículos clasificados`,
      {
        duration: classificationDuration,
        totalArticles: allArticles.length,
        classified: classifiedCount,
        unclassified: unclassifiedCount,
        distribution: {
          economia: classified.economia.length,
          politica: classified.politica.length,
          sociedad: classified.sociedad.length,
          seguridad: classified.seguridad.length,
          internacional: classified.internacional.length,
          vial: classified.vial.length,
        },
      }
    );

    // Actualizar status a 'scraped' (listo para revisión, pendiente de generar resúmenes)
    await updateBulletinStatus(bulletin.id, "scraped");

    // Calcular duración total
    const duration = Date.now() - startTime;

    // Preparar respuesta
    const response = {
      success: true,
      bulletinId: bulletin.id,
      totalNews: scrapeResult.metadata.totalArticles,
      sources: {
        primicias: enrichedResult.primicias.length,
        laHora: enrichedResult.laHora.length,
        elComercio: enrichedResult.elComercio.length,
        teleamazonas: enrichedResult.teleamazonas.length,
        ecu911: enrichedResult.ecu911.length,
      },
      metadata: {
        sourcesSuccess: scrapeResult.metadata.sourcesSuccess,
        sourcesFailed: scrapeResult.metadata.sourcesFailed,
        errors: scrapeResult.metadata.errors,
        duration: `${(duration / 1000).toFixed(2)}s`,
      },
      crawl4ai: crawl4aiStats,
    };

    console.log(`✅ Pipeline híbrido completado en ${(duration / 1000).toFixed(2)}s`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Error en scraping:", error);

    const duration = Date.now() - startTime;

    // Intentar actualizar el bulletin si se creó
    try {
      const todayBulletin = await getTodayBulletin();
      if (todayBulletin && todayBulletin.status === "scraping") {
        await updateBulletinStatus(todayBulletin.id, "failed");
        await createBulletinLog(
          todayBulletin.id,
          "scraping",
          "failed",
          `Error en scraping: ${(error as Error).message}`,
          { duration, error: (error as Error).message }
        );
      }
    } catch (logError) {
      console.error("Error logging failure:", logError);
    }

    return NextResponse.json(
      {
        error: "Error scrapeando noticias",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
