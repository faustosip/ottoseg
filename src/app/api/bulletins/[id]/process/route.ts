/**
 * API Endpoint: POST /api/bulletins/[id]/process
 *
 * Instant processing: builds classifiedNews from existing category data
 * (no AI needed - categories already assigned during scraping),
 * then fires off summarization in the background.
 *
 * Returns immediately so the user can view the bulletin while summaries generate.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getBulletinById,
  updateBulletinStatus,
  updateBulletinClassification,
} from "@/lib/db/queries/bulletins";
import { summarizeByCategory } from "@/lib/news/summarizer";
import type { ClassifiedNews, ClassifiedArticle } from "@/lib/news/classifier";
import type { ScrapeResult, ScrapedArticle } from "@/lib/news/scraper";

/**
 * Build classifiedNews instantly from rawNews by grouping articles
 * by their existing `category` field (assigned during scraping from URL patterns).
 * No AI call needed.
 */
function buildClassifiedFromRaw(rawNews: ScrapeResult): ClassifiedNews {
  const classified: ClassifiedNews = {
    economia: [],
    politica: [],
    sociedad: [],
    seguridad: [],
    internacional: [],
    vial: [],
  };

  // Collect articles from all sources
  const allSources: ScrapedArticle[][] = [
    rawNews.primicias || [],
    rawNews.laHora || [],
    rawNews.elComercio || [],
    rawNews.teleamazonas || [],
    rawNews.ecu911 || [],
  ];

  for (const articles of allSources) {
    for (const article of articles) {
      // Skip deselected articles
      if (article.selected === false) continue;

      const mapped: ClassifiedArticle = {
        title: article.title,
        content: article.content,
        url: article.url,
        source: article.source,
        imageUrl: article.imageUrl,
      };

      const category = article.category as keyof ClassifiedNews | undefined;
      if (category && classified[category]) {
        classified[category].push(mapped);
      } else {
        // Articles without category go to "sociedad" as default
        classified.sociedad.push(mapped);
      }
    }
  }

  return classified;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: bulletinId } = await params;

    // Get bulletin
    const bulletin = await getBulletinById(bulletinId);

    if (!bulletin) {
      return NextResponse.json(
        { error: "Boletín no encontrado" },
        { status: 404 }
      );
    }

    if (!bulletin.rawNews) {
      return NextResponse.json(
        { error: "El boletín no tiene noticias scrapeadas" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const rawNews = bulletin.rawNews as unknown as ScrapeResult;

    // Step 1: Build classifiedNews INSTANTLY from existing categories (no AI)
    const classified = buildClassifiedFromRaw(rawNews);

    const counts = {
      economia: classified.economia.length,
      politica: classified.politica.length,
      sociedad: classified.sociedad.length,
      seguridad: classified.seguridad.length,
      internacional: classified.internacional.length,
      vial: classified.vial.length,
    };
    const total = Object.values(counts).reduce((s, c) => s + c, 0);

    console.log(`⚡ Clasificación instantánea: ${total} artículos`, counts);

    // Step 2: Save classifiedNews to DB
    await updateBulletinClassification(
      bulletinId,
      classified as unknown as Record<string, unknown>
    );
    await updateBulletinStatus(bulletinId, "summarizing");

    const duration = Date.now() - startTime;
    console.log(`✅ Procesamiento instantáneo en ${duration}ms - Resúmenes generándose en background`);

    // Step 3: Fire-and-forget summarization in background
    // This works because the app runs as standalone Node.js (output: "standalone")
    void summarizeByCategory(classified, bulletinId).catch((err) => {
      console.error("❌ Background summarization failed:", err);
      void updateBulletinStatus(bulletinId, "failed").catch(() => {});
    });

    // Return immediately - don't wait for summaries
    return NextResponse.json({
      success: true,
      bulletinId,
      classified: counts,
      total,
      duration,
      message: "Clasificación completada. Resúmenes generándose en background.",
    });
  } catch (error) {
    console.error("❌ Error en procesamiento:", error);

    return NextResponse.json(
      {
        error: "Error procesando boletín",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
