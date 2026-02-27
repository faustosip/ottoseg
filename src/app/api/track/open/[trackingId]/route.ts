import { NextRequest } from "next/server";
import { recordEmailOpen } from "@/lib/db/queries/email-tracking";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/**
 * GET /api/track/open/[trackingId]
 *
 * Endpoint PÚBLICO - registra apertura de email y devuelve pixel 1x1
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await context.params;

  // Fire-and-forget: registrar apertura
  recordEmailOpen(trackingId).catch(() => {});

  return new Response(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
