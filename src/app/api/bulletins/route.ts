/**
 * API Endpoint: GET /api/bulletins
 *
 * Lista todos los boletines con paginación y filtros
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAllBulletins } from "@/lib/db/queries/bulletins";

/**
 * GET /api/bulletins
 *
 * Lista boletines con paginación y filtros
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Parsear query params
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || undefined;
    const orderBy = (searchParams.get("orderBy") ||
      "createdAt") as "createdAt" | "date";
    const order = (searchParams.get("order") || "desc") as "asc" | "desc";

    // Validar límites
    const validLimit = Math.min(Math.max(limit, 1), 100); // Entre 1 y 100
    const validPage = Math.max(page, 1);
    const offset = (validPage - 1) * validLimit;

    console.log(
      `📊 Obteniendo boletines: page=${validPage}, limit=${validLimit}, status=${status}`
    );

    // Obtener boletines
    const bulletins = await getAllBulletins({
      limit: validLimit,
      offset,
      status,
      orderBy,
      order,
    });

    console.log(`✅ Se encontraron ${bulletins.length} boletines`);

    // Preparar metadata de paginación
    const metadata = {
      page: validPage,
      limit: validLimit,
      total: bulletins.length,
      hasMore: bulletins.length === validLimit,
    };

    // Retornar respuesta
    return NextResponse.json({
      success: true,
      bulletins,
      metadata,
    });
  } catch (error) {
    console.error("❌ Error obteniendo boletines:", error);

    return NextResponse.json(
      {
        error: "Error obteniendo boletines",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
