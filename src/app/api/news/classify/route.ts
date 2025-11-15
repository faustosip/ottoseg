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
} from "@/lib/db/queries/bulletins";
import { classifyNews } from "@/lib/news/classifier";

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

    console.log(`🔐 Usuario autenticado: ${session.user.email}`);

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
      bulletin.rawNews as any,
      bulletinId
    );

    // Calcular breakdown
    const breakdown = {
      economia: classified.economia.length,
      politica: classified.politica.length,
      sociedad: classified.sociedad.length,
      seguridad: classified.seguridad.length,
      internacional: classified.internacional.length,
      vial: classified.vial.length,
    };

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

    return NextResponse.json(
      {
        error: "Error clasificando noticias",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
