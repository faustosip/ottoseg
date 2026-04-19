/**
 * API Endpoint: POST /api/news/classify
 *
 * Clasifica noticias de un boletín usando IA
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import {
  getBulletinById,
  updateBulletinStatus,
  updateBulletinClassification,
} from "@/lib/db/queries/bulletins";
import { classifyNews, type ClassifiedArticle, type ClassifiedNews } from "@/lib/news/classifier";
import { errorResponse } from "@/lib/http/error-response";

// Allow up to 3 minutes for AI classification
export const maxDuration = 180;

/**
 * Schema de validación para el body
 */
const ClassifyRequestSchema = z.object({
  bulletinId: z.string().uuid("bulletinId debe ser un UUID válido"),
});

/**
 * POST /api/news/classify
 *
 * Clasifica noticias de un boletín
 */
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log(`🔐 Usuario autenticado: ${session.user.id}`);

    // Parsear y validar body
    const body = await request.json();
    const validationResult = ClassifyRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { bulletinId } = validationResult.data;

    // Obtener bulletin
    const bulletin = await getBulletinById(bulletinId);

    if (!bulletin) {
      return NextResponse.json(
        { error: "Boletín no encontrado" },
        { status: 404 }
      );
    }

    console.log(`📄 Boletín encontrado: ${bulletin.id}`);

    // Verificar que tenga rawNews
    if (!bulletin.rawNews) {
      return NextResponse.json(
        {
          error: "El boletín no tiene noticias scrapeadas",
          bulletinId: bulletin.id,
          status: bulletin.status,
        },
        { status: 400 }
      );
    }

    // Actualizar status a 'classifying'
    await updateBulletinStatus(bulletinId, "classifying");

    console.log("🤖 Iniciando clasificación con IA...");

    // Clasificar noticias
    const classified = await classifyNews(
      bulletin.rawNews as Parameters<typeof classifyNews>[0],
      bulletinId
    );

    // Merge fullContent from fullArticles or rawNews into classified articles
    const fullContentMap = new Map<string, string>();

    // Build map from fullArticles (enriched content)
    if (bulletin.fullArticles) {
      const fullArticles = bulletin.fullArticles as Record<string, Array<{ url?: string; title?: string; fullContent?: string }>>;
      for (const articles of Object.values(fullArticles)) {
        if (!Array.isArray(articles)) continue;
        for (const article of articles) {
          if (article.fullContent) {
            if (article.url) fullContentMap.set(article.url, article.fullContent);
            if (article.title) fullContentMap.set(article.title.trim().toLowerCase(), article.fullContent);
          }
        }
      }
    }

    // Also check rawNews for fullContent (in case enrichment was done in-place)
    if (bulletin.rawNews) {
      const rawNews = bulletin.rawNews as Record<string, Array<{ url?: string; title?: string; fullContent?: string }>>;
      for (const articles of Object.values(rawNews)) {
        if (!Array.isArray(articles)) continue;
        for (const article of articles) {
          if (article.fullContent) {
            if (article.url && !fullContentMap.has(article.url)) {
              fullContentMap.set(article.url, article.fullContent);
            }
            if (article.title && !fullContentMap.has(article.title.trim().toLowerCase())) {
              fullContentMap.set(article.title.trim().toLowerCase(), article.fullContent);
            }
          }
        }
      }
    }

    // Merge fullContent into classified articles
    if (fullContentMap.size > 0) {
      console.log(`  📝 Merging fullContent from ${fullContentMap.size} sources`);
      const categories = Object.keys(classified) as Array<keyof ClassifiedNews>;
      for (const category of categories) {
        classified[category] = classified[category].map((article: ClassifiedArticle) => {
          const fullContent = (article.url && fullContentMap.get(article.url))
            || fullContentMap.get(article.title.trim().toLowerCase());
          if (fullContent) {
            return { ...article, fullContent };
          }
          return article;
        });
      }

      // Save updated classifiedNews with fullContent to DB
      await updateBulletinClassification(bulletinId, classified as unknown as Record<string, unknown>);
      console.log("  ✅ fullContent merged into classifiedNews");
    }

    // Calcular breakdown
    const breakdown: Record<string, number> = {};
    for (const category of Object.keys(classified) as Array<keyof ClassifiedNews>) {
      breakdown[category] = classified[category].length;
    }

    const totalClassified = Object.values(breakdown).reduce(
      (sum, count) => sum + count,
      0
    );

    console.log(`✅ Clasificación completada: ${totalClassified} noticias`);
    console.log("  Distribución:", breakdown);

    // Actualizar status a 'classified'
    await updateBulletinStatus(bulletinId, "classified");

    // Retornar respuesta
    const response = {
      success: true,
      bulletinId,
      classified,
      totalClassified,
      breakdown,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Error en clasificación:", error);
    return errorResponse("Error clasificando noticias", 500, error);
  }
}
