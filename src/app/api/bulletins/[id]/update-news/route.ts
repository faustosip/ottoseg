/**
 * API Endpoint: PATCH /api/bulletins/[id]/update-news
 *
 * Actualiza la selección de noticias en un boletín
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateBulletinRawNews } from "@/lib/db/queries/bulletins";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/bulletins/[id]/update-news
 *
 * Actualiza las noticias seleccionadas
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener parámetros
    const { id } = await context.params;

    // Obtener body
    const body = await request.json();
    const { newsData } = body;

    if (!newsData) {
      return NextResponse.json(
        { error: "newsData es requerido" },
        { status: 400 }
      );
    }

    // Contar noticias seleccionadas
    const totalSelected = Object.values(newsData as Record<string, unknown[]>).reduce(
      (sum, articles) => {
        return (
          sum +
          articles.filter(
            (article: unknown) =>
              typeof article === "object" &&
              article !== null &&
              "selected" in article &&
              article.selected === true
          ).length
        );
      },
      0
    );

    console.log(
      `📝 Actualizando selección de noticias para boletín ${id}: ${totalSelected} seleccionadas`
    );

    // Actualizar boletín
    const bulletin = await updateBulletinRawNews(id, newsData, totalSelected);

    return NextResponse.json({
      success: true,
      bulletinId: bulletin.id,
      totalSelected,
      message: "Selección actualizada correctamente",
    });
  } catch (error) {
    console.error("❌ Error actualizando selección de noticias:", error);

    return NextResponse.json(
      {
        error: "Error actualizando selección",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
