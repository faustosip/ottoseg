/**
 * API Endpoint: /api/bulletins/categories
 *
 * GET  - Lista todas las categorías activas (o todas si ?all=true)
 * POST - Crea una nueva categoría
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getActiveCategories,
  getAllCategories,
  createCategory,
} from "@/lib/db/queries/bulletins";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    // Si piden todas, requiere autenticación
    if (all) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }

      const categories = await getAllCategories();
      return NextResponse.json({ categories });
    }

    // Las categorías activas son públicas (se usan en la vista pública)
    const categories = await getActiveCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, displayName, displayOrder } = body;

    if (!name || !displayName) {
      return NextResponse.json(
        { error: "name y displayName son requeridos" },
        { status: 400 }
      );
    }

    const category = await createCategory({
      name,
      displayName,
      displayOrder: displayOrder ?? 0,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Error al crear categoría" },
      { status: 500 }
    );
  }
}
