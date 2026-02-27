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
import { generateBulletinEmail } from "@/lib/email/templates/bulletin";

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
          message: "Configure las variables de entorno SMTP_USER y SMTP_PASS",
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

    // Allow custom recipient email from request body
    const body = await request.json().catch(() => ({}));
    const recipientEmail = body.email || session.user.email;
    const recipientName = body.name || session.user.name || undefined;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://ottoseguridadai.com";

    // Generar email sin tracking (prueba)
    const { html, text, subject } = generateBulletinEmail(bulletin, {
      webViewUrl: `${appUrl}/bulletin/${bulletin.id}`,
      subscriberName: recipientName,
    });

    const success = await sendEmail({
      to: recipientEmail,
      subject: `[PRUEBA] ${subject}`,
      html,
      text,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Error al enviar email de prueba" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sentTo: recipientEmail,
    });
  } catch (error) {
    console.error("❌ Error sending test email:", error);

    return NextResponse.json(
      {
        error: "Error enviando email de prueba",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
