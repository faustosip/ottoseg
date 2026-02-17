/**
 * API Endpoint: /api/bulletins/[id]/add-manual-news
 *
 * POST - Add a manual news item to a bulletin's classified news
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { bulletins } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getBulletinById } from "@/lib/db/queries/bulletins";
import type { ClassifiedArticle } from "@/lib/news/classifier";

/**
 * Schema for manual news - accepts any category string (dynamic categories)
 */
const ManualNewsSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
  category: z.string().min(1, "La categoría es requerida"),
  source: z.string().optional().default("Manual"),
  url: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * POST /api/bulletins/[id]/add-manual-news
 *
 * Add a manual news item to the bulletin
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    console.log(`📝 Adding manual news to bulletin: ${id}`);

    // Get bulletin
    const bulletin = await getBulletinById(id);

    if (!bulletin) {
      return NextResponse.json(
        { error: "Boletín no encontrado" },
        { status: 404 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validationResult = ManualNewsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const newsData = validationResult.data;

    // Create the new article
    const newArticle: ClassifiedArticle = {
      title: newsData.title,
      content: newsData.content,
      url: newsData.url || "",
      source: newsData.source || "Manual",
      imageUrl: newsData.imageUrl || undefined,
    };

    // Get existing classified news or create new structure
    const existingClassified = (bulletin.classifiedNews as Record<string, ClassifiedArticle[]> | null) || {};

    // Add the new article to the appropriate category
    const category = newsData.category;
    const updatedClassified: Record<string, ClassifiedArticle[]> = {
      ...existingClassified,
      [category]: [...(existingClassified[category] || []), newArticle],
    };

    // Update the bulletin
    await db
      .update(bulletins)
      .set({
        classifiedNews: updatedClassified,
        // If bulletin was in draft and now has news, update to ready
        status: bulletin.status === "draft" ? "ready" : bulletin.status,
      })
      .where(eq(bulletins.id, id));

    console.log(`✅ Manual news added to category: ${category}`);

    return NextResponse.json({
      success: true,
      message: "Noticia agregada exitosamente",
      category,
      article: newArticle,
    });
  } catch (error) {
    console.error("❌ Error adding manual news:", error);

    return NextResponse.json(
      {
        error: "Error agregando noticia",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
