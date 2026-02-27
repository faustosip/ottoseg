/**
 * API Endpoints: /api/bulletins/[id]
 *
 * CRUD para boletines individuales
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { bulletins } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getBulletinById } from "@/lib/db/queries/bulletins";
import { createAuditLog } from "@/lib/db/queries/audit";

/**
 * Schema de validación para PATCH
 */
const UpdateBulletinSchema = z.object({
  economia: z.string().optional(),
  politica: z.string().optional(),
  sociedad: z.string().optional(),
  seguridad: z.string().optional(),
  internacional: z.string().optional(),
  vial: z.string().optional(),
  designVersion: z.string().optional(),
  roadClosureMapUrl: z.string().url().optional().nullable(),
  manualVideoUrl: z.string().url().optional().nullable(),
  status: z
    .enum([
      "draft",
      "scraping",
      "scraped",
      "classifying",
      "summarizing",
      "ready",
      "authorized",
      "published",
      "failed",
    ])
    .optional(),
});

/**
 * GET /api/bulletins/[id]
 *
 * Obtiene un boletín por ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    console.log(`📄 Obteniendo boletín: ${id}`);

    // Obtener bulletin
    const bulletin = await getBulletinById(id);

    if (!bulletin) {
      return NextResponse.json(
        { error: "Boletín no encontrado" },
        { status: 404 }
      );
    }

    console.log(`✅ Boletín encontrado: ${bulletin.id}`);

    return NextResponse.json({
      success: true,
      bulletin,
    });
  } catch (error) {
    console.error("❌ Error obteniendo boletín:", error);

    return NextResponse.json(
      {
        error: "Error obteniendo boletín",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bulletins/[id]
 *
 * Actualiza un boletín
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    console.log(`✏️  Actualizando boletín: ${id}`);

    // Verificar que existe
    const existingBulletin = await getBulletinById(id);

    if (!existingBulletin) {
      return NextResponse.json(
        { error: "Boletín no encontrado" },
        { status: 404 }
      );
    }

    // Parsear y validar body
    const body = await request.json();
    const validationResult = UpdateBulletinSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Si se reactiva (published -> authorized), limpiar emailSentAt para permitir re-envío
    const isReactivation = updates.status === "authorized" && existingBulletin.status === "published";
    const dbUpdates = isReactivation
      ? { ...updates, emailSentAt: null }
      : updates;

    console.log("  Actualizando campos:", Object.keys(dbUpdates));

    // Actualizar bulletin
    const [updatedBulletin] = await db
      .update(bulletins)
      .set(dbUpdates)
      .where(eq(bulletins.id, id))
      .returning();

    // Registrar auditoría para cambios de estado importantes
    if (updates.status === "authorized" || updates.status === "published") {
      // Detectar reactivación (published -> authorized)
      const action = updates.status === "authorized" && existingBulletin.status === "published"
        ? "reactivated"
        : updates.status;

      await createAuditLog(id, action, {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }, action === "reactivated" ? { previousStatus: existingBulletin.status } : undefined);
    }

    console.log(`✅ Boletín actualizado: ${updatedBulletin.id}`);

    return NextResponse.json({
      success: true,
      bulletin: updatedBulletin,
    });
  } catch (error) {
    console.error("❌ Error actualizando boletín:", error);

    return NextResponse.json(
      {
        error: "Error actualizando boletín",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bulletins/[id]
 *
 * Elimina un boletín
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    console.log(`🗑️  Eliminando boletín: ${id}`);

    // Verificar que existe
    const existingBulletin = await getBulletinById(id);

    if (!existingBulletin) {
      return NextResponse.json(
        { error: "Boletín no encontrado" },
        { status: 404 }
      );
    }

    // Opcional: Prevenir eliminación de boletines publicados
    if (existingBulletin.status === "published") {
      return NextResponse.json(
        {
          error: "No se pueden eliminar boletines publicados",
          bulletinId: id,
          status: existingBulletin.status,
        },
        { status: 403 }
      );
    }

    // Registrar auditoría antes de eliminar
    await createAuditLog(id, "deleted", {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    }, { previousStatus: existingBulletin.status });

    // Eliminar bulletin (cascade eliminará logs también)
    await db.delete(bulletins).where(eq(bulletins.id, id));

    console.log(`✅ Boletín eliminado: ${id}`);

    return NextResponse.json({
      success: true,
      message: "Boletín eliminado exitosamente",
      deletedId: id,
    });
  } catch (error) {
    console.error("❌ Error eliminando boletín:", error);

    return NextResponse.json(
      {
        error: "Error eliminando boletín",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
