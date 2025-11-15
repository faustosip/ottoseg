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
} from "@/lib/db/queries/bulletins";
import { scrapeAllSources, enrichWithFullContent } from "@/lib/news/scraper";

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

    // Verificar si ya existe boletín de hoy
    const todayBulletin = await getTodayBulletin();

    if (todayBulletin) {
      // Si existe y está en proceso (scraping, classifying, summarizing), retornar error
      if (
        todayBulletin.status === "scraping" ||
        todayBulletin.status === "classifying" ||
        todayBulletin.status === "summarizing"
      ) {
        return NextResponse.json(
          {
            error: "Ya existe un boletín en proceso para hoy",
            bulletinId: todayBulletin.id,
            status: todayBulletin.status,
          },
          { status: 409 }
        );
      }

      // Si existe pero falló o está listo, podemos crear uno nuevo (sobrescribir)
      console.log(
        `⚠️  Ya existe boletín de hoy (${todayBulletin.status}), se creará uno nuevo`
      );
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
    if (disableFirecrawl) {
      console.log("🔍 FASE 1: Iniciando scraping con Crawl4AI (Firecrawl deshabilitado)...");
    } else {
      console.log("🔍 FASE 1: Iniciando scraping con Firecrawl...");
    }
    const scrapeResult = await scrapeAllSources();

    console.log(
      `✅ FASE 1 completada: ${scrapeResult.metadata.totalArticles} artículos descubiertos`
    );

    // Actualizar bulletin con raw news (sin metadata)
    const { metadata, ...rawNewsOnly } = scrapeResult;
    await updateBulletinRawNews(
      bulletin.id,
      rawNewsOnly,
      scrapeResult.metadata.totalArticles
    );

    // Crear log de FASE 1
    const phase1Duration = Date.now() - startTime;
    await createBulletinLog(
      bulletin.id,
      "scraping",
      "completed",
      `FASE 1 (Firecrawl) completada: ${scrapeResult.metadata.totalArticles} artículos de ${scrapeResult.metadata.sourcesSuccess} fuentes`,
      {
        duration: phase1Duration,
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
          enableCrawl4AI: true,
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

    // Actualizar status a 'draft' (listo para edición)
    await updateBulletinStatus(bulletin.id, "draft");

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
