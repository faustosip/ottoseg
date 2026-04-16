/**
 * API Endpoint: POST /api/bulletins/[id]/fetch-full-content
 *
 * Fetches full article content from source URLs for all articles in classifiedNews.
 * Uses direct HTTP + Cheerio extraction (no Crawl4AI dependency).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { enrichBulletinFullContent } from "@/lib/news/content-fetcher";

// Allow up to 2 minutes for fetching
export const maxDuration = 120;

/**
 * POST /api/bulletins/[id]/fetch-full-content
 *
 * Fetches full article content for all articles in classifiedNews
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: bulletinId } = await params;
    const stats = await enrichBulletinFullContent(bulletinId);

    if (stats.total === 0) {
      return NextResponse.json(
        { error: "No hay noticias clasificadas para enriquecer" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("❌ Error fetching full content:", error);
    return NextResponse.json(
      {
        error: "Error al obtener contenido completo",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
