import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/users/me - Obtener isActive y allowedMenus del usuario actual
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [result] = await db
      .select({
        isActive: user.isActive,
        allowedMenus: user.allowedMenus,
      })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!result) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error getting user info:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
