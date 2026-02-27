import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/unsubscribe/[token]
 *
 * Endpoint PÚBLICO (sin autenticación)
 * Desactiva al suscriptor y redirige a página de confirmación
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  try {
    // Buscar suscriptor por token
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.unsubscribeToken, token))
      .limit(1);

    if (subscriber && subscriber.isActive) {
      // Desactivar suscriptor
      await db
        .update(subscribers)
        .set({ isActive: false })
        .where(eq(subscribers.id, subscriber.id));
    }

    // Redirigir a página de confirmación (incluso si ya estaba desuscrito)
    return Response.redirect(
      new URL(`/unsubscribe/${token}`, _request.url),
      302
    );
  } catch (error) {
    console.error("Error en desuscripción:", error);
    return Response.redirect(
      new URL(`/unsubscribe/${token}`, _request.url),
      302
    );
  }
}
