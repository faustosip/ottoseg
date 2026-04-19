import { NextRequest } from "next/server";
import {
  getEmailSendByTrackingId,
  recordEmailClick,
} from "@/lib/db/queries/email-tracking";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const FALLBACK_URL = "https://ottoseguridadai.com";

/**
 * Valida que la URL objetivo sea una URL HTTP(S) absoluta y bien formada.
 *
 * Esto evita que un atacante construya un enlace como
 * `/api/track/click/<id>?url=javascript:alert(1)` o con esquemas `data:` /
 * `file:` que podrían desencadenar ejecución o robo de sesión cuando el
 * enlace se abre en un webview/cliente de correo.
 *
 * Nota: no limitamos la URL a dominios específicos porque los boletines
 * legítimamente enlazan a múltiples fuentes de noticias externas.
 */
function sanitizeRedirect(raw: string | null): string {
  if (!raw) return FALLBACK_URL;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return FALLBACK_URL;
    }
    return parsed.toString();
  } catch {
    return FALLBACK_URL;
  }
}

/**
 * GET /api/track/click/[trackingId]?url=encoded_url
 *
 * Endpoint PÚBLICO - registra clic en link del email y redirige a URL original.
 * La URL de destino se valida para evitar abuso de open redirect con esquemas
 * peligrosos (`javascript:`, `data:`, `file:`, etc.).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await context.params;
  const rawUrl = new URL(request.url).searchParams.get("url");
  const redirectTo = sanitizeRedirect(rawUrl);
  const ip = getClientIp(request);

  // Rate limit por IP (60/min). Siempre redirigimos — el usuario legítimo no
  // debe sufrir por nuestro rate-limit — pero sólo registramos el click si no
  // se ha excedido, para no contaminar la métrica ni llenar la BD.
  const rl = await checkRateLimit("track-click", ip, 60, 60);
  if (rl.allowed && rawUrl && redirectTo !== FALLBACK_URL) {
    getEmailSendByTrackingId(trackingId)
      .then((emailSend) => {
        if (emailSend) {
          return recordEmailClick(emailSend.id, redirectTo);
        }
      })
      .catch(() => {});
  }

  return Response.redirect(redirectTo, 302);
}
