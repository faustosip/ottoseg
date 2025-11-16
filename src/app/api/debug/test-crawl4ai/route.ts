/**
 * API Endpoint: GET /api/debug/test-crawl4ai
 *
 * Endpoint de depuración para probar Crawl4AI (sin autenticación)
 */

import { NextResponse } from "next/server";
import { scrapeAllSources } from "@/lib/news/scraper";

export async function GET() {
  try {
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
        message: (error as Error).message,
        stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined,
      },
      { status: 500 }
    );
  }
}
