/**
 * API Endpoint: POST /api/news/summarize
 *
 * Genera resúmenes para cada categoría de un boletín
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import {
  getBulletinById,
  updateBulletinStatus,
} from "@/lib/db/queries/bulletins";
import { summarizeByCategory } from "@/lib/news/summarizer";
import { errorResponse } from "@/lib/http/error-response";

// Allow up to 3 minutes for AI summarization (6 categories in parallel)
export const maxDuration = 180;

/**
 * Schema de validación para el body
 */
const SummarizeRequestSchema = z.object({
  bulletinId: z.string().uuid("bulletinId debe ser un UUID válido"),
  streaming: z.boolean().optional().default(false),
});

/**
 * POST /api/news/summarize
 *
 * Genera resúmenes para un boletín
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
    const validationResult = SummarizeRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { bulletinId, streaming } = validationResult.data;

    // Obtener bulletin
    const bulletin = await getBulletinById(bulletinId);

    if (!bulletin) {
      return NextResponse.json(
        { error: "Boletín no encontrado" },
        { status: 404 }
      );
    }

    console.log(`📄 Boletín encontrado: ${bulletin.id}`);

    // Verificar que tenga classifiedNews
    if (!bulletin.classifiedNews) {
      return NextResponse.json(
        {
          error: "El boletín no tiene noticias clasificadas",
          bulletinId: bulletin.id,
          status: bulletin.status,
        },
        { status: 400 }
      );
    }

    // Actualizar status a 'summarizing'
    await updateBulletinStatus(bulletinId, "summarizing");

    console.log("📝 Iniciando generación de resúmenes...");

    // Por ahora solo soportamos modo no-streaming
    // TODO: Implementar streaming con streamText() en fase futura
    if (streaming) {
      return NextResponse.json(
        {
          error: "El modo streaming aún no está implementado",
          message: "Use streaming: false",
        },
        { status: 501 }
      );
    }

    // Generar resúmenes
    const summaries = await summarizeByCategory(
      bulletin.classifiedNews as Parameters<typeof summarizeByCategory>[0],
      bulletinId
    );

    console.log("✅ Resúmenes generados exitosamente");

    // El status se actualiza a 'ready' dentro de summarizeByCategory

    // Retornar respuesta
    const response = {
      success: true,
      bulletinId,
      summaries,
      categoriesGenerated: Object.keys(summaries).length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Error en summarización:", error);
    return errorResponse("Error generando resúmenes", 500, error);
  }
}
