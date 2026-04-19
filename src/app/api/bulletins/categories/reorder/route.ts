/**
 * API Endpoint: /api/bulletins/categories/reorder
 *
 * PUT - Reordena categorías masivamente
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { updateCategory } from "@/lib/db/queries/bulletins";

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "orderedIds debe ser un array no vacío" },
        { status: 400 }
      );
    }

    // Actualizar displayOrder de cada categoría según su posición
    await Promise.all(
      orderedIds.map((id: string, index: number) =>
        updateCategory(id, { displayOrder: index })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering categories:", error);
    return NextResponse.json(
      { error: "Error al reordenar categorías" },
      { status: 500 }
    );
  }
}
