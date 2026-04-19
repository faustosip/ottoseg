import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * GET /api/unsubscribe/[token]
 *
 * Endpoint PÚBLICO (sin autenticación). Rate-limited por IP (10/min) para
 * mitigar ataques de fuerza bruta sobre tokens de desuscripción.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const ip = getClientIp(_request);

  const rl = await checkRateLimit("unsubscribe", ip, 10, 60);
  if (!rl.allowed) return rateLimitResponse(rl);

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
