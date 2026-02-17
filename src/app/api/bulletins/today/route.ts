import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTodayBulletin } from "@/lib/db/queries/bulletins";

/**
 * GET /api/bulletins/today
 *
 * Returns today's bulletin if it exists (used for duplicate prevention).
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const bulletin = await getTodayBulletin();

    if (!bulletin) {
      return NextResponse.json({ bulletin: null });
    }

    return NextResponse.json({
      bulletin: {
        id: bulletin.id,
        status: bulletin.status,
        date: bulletin.date,
      },
    });
  } catch (error) {
    console.error("Error checking today's bulletin:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
