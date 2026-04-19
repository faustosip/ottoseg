import { NextRequest } from "next/server";
import { recordEmailOpen } from "@/lib/db/queries/email-tracking";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/**
 * GET /api/track/open/[trackingId]
 *
 * Endpoint PÚBLICO - registra apertura de email y devuelve pixel 1x1.
 * Rate-limited por IP (60/min) para mitigar flooding malicioso de la tabla
 * de tracking. Si se excede, devuelve igual el pixel (no interrumpimos la
 * experiencia del lector del email) pero no registra la apertura.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await context.params;
  const ip = getClientIp(_request);

  const rl = await checkRateLimit("track-open", ip, 60, 60);
  if (rl.allowed) {
    recordEmailOpen(trackingId).catch(() => {});
  }

  return new Response(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
