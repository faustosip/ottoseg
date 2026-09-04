/**
 * API Endpoint: /api/bulletins/[id]/send-test-email
 *
 * POST - Send a test email to the current user (no tracking)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getBulletinById } from "@/lib/db/queries/bulletins";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { requireAdmin } from "@/lib/auth-guard";
import { generateBulletinEmail } from "@/lib/email/templates/bulletin";
import { errorResponse } from "@/lib/http/error-response";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/bulletins/[id]/send-test-email
 *
 * Sends a test email to the currently authenticated user
 * No tracking pixel, no URL rewriting, no DB records
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          error: "Email no configurado",
          message: "Configure la variable de entorno RESEND_API_KEY",
        },
        { status: 503 }
      );
    }

    const { id } = await context.params;
    const bulletin = await getBulletinById(id);

    if (!bulletin) {
      return NextResponse.json(
        { error: "Boletín no encontrado" },
        { status: 404 }
      );
    }

    // Restricción: un usuario normal solo puede enviarse la prueba a su
    // propio correo (evita usar el endpoint como relay desde el dominio
    // corporativo). Un administrador puede enviarla a cualquier dirección.
    const body = await request.json().catch(() => ({}));
    const requestedEmail: string | undefined =
      typeof body.email === "string" ? body.email.trim() : undefined;
    const recipientName = body.name || session.user.name || undefined;
    let recipientEmail = session.user.email;

    if (
      requestedEmail &&
      requestedEmail.toLowerCase() !== session.user.email.toLowerCase()
    ) {
      const admin = await requireAdmin();
      if (!admin.ok) {
        return NextResponse.json(
          {
            error:
              "Solo un administrador puede enviar el email de prueba a otra dirección.",
          },
          { status: 403 }
        );
      }

      if (!EMAIL_RE.test(requestedEmail)) {
        return NextResponse.json(
          { error: "Dirección de correo inválida" },
          { status: 400 }
        );
      }

      recipientEmail = requestedEmail;
      console.log(
        `📧 Test email: admin ${session.user.email} -> ${recipientEmail} (bulletin ${id})`
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://ottoseguridadai.com";

    // Generar email sin tracking (prueba)
    const { html, text, subject } = generateBulletinEmail(bulletin, {
      webViewUrl: `${appUrl}/bulletin/${bulletin.id}`,
      subscriberName: recipientName,
    });

    const result = await sendEmail({
      to: recipientEmail,
      subject: `[PRUEBA] ${subject}`,
      html,
      text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Error al enviar email de prueba", message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sentTo: recipientEmail,
    });
  } catch (error) {
    console.error("❌ Error sending test email:", error);

    return errorResponse("Error enviando email de prueba", 500, error);
  }
}
