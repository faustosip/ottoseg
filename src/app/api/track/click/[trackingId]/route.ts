import { NextRequest } from "next/server";
import {
  getEmailSendByTrackingId,
  recordEmailClick,
} from "@/lib/db/queries/email-tracking";

const FALLBACK_URL = "https://ottoseguridadai.com";

/**
 * GET /api/track/click/[trackingId]?url=encoded_url
 *
 * Endpoint PÚBLICO - registra clic en link del email y redirige a URL original
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await context.params;
  const url = new URL(request.url).searchParams.get("url");
  const redirectTo = url || FALLBACK_URL;

  // Registrar clic (fire-and-forget)
  if (url) {
    getEmailSendByTrackingId(trackingId)
      .then((emailSend) => {
        if (emailSend) {
          return recordEmailClick(emailSend.id, url);
        }
      })
      .catch(() => {});
  }

  return Response.redirect(redirectTo, 302);
}
