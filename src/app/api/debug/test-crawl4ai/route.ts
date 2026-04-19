/**
 * API Endpoint: GET /api/debug/test-crawl4ai
 *
 * Endpoint de depuración para probar Crawl4AI (sin autenticación)
 */

import { NextResponse } from "next/server";
import { scrapeAllSources } from "@/lib/news/scraper";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    console.log("🚀 Iniciando test de Crawl4AI...\n");

    const result = await scrapeAllSources();

    console.log("\n📊 RESULTADOS DEL SCRAPING:");
    console.log("═══════════════════════════════════════════════\n");
    console.log(`Total de artículos: ${result.metadata.totalArticles}`);
    console.log(`Fuentes exitosas: ${result.metadata.sourcesSuccess}`);
    console.log(`Fuentes fallidas: ${result.metadata.sourcesFailed}\n`);

    // Preparar respuesta detallada
    const response = {
      success: true,
      metadata: result.metadata,
      articlesPerSource: {
        primicias: result.primicias.length,
        laHora: result.laHora.length,
        elComercio: result.elComercio.length,
        teleamazonas: result.teleamazonas.length,
        ecu911: result.ecu911.length,
      },
      sampleArticles: {
        primicias: result.primicias.slice(0, 3).map(a => ({
          title: a.title,
          url: a.url,
          excerpt: a.content.substring(0, 150) + "...",
          imageUrl: a.imageUrl,
          publishedDate: a.publishedDate,
        })),
      },
      errors: result.metadata.errors,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ Error en test-crawl4ai:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error interno",
        // En producción no se expone el mensaje crudo ni el stack para evitar
        // fuga de información sobre la arquitectura interna.
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
        stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined,
      },
      { status: 500 }
    );
  }
}
