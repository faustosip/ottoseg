/**
 * API Endpoint: /api/bulletins/[id]/send-email
 *
 * POST - Send bulletin email to all active subscribers
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getBulletinById } from "@/lib/db/queries/bulletins";
import { getActiveSubscribers } from "@/lib/db/queries/subscribers";
import { sendBulkEmail, isEmailConfigured } from "@/lib/email";
import { generateBulletinEmail } from "@/lib/email/templates/bulletin";

/**
 * POST /api/bulletins/[id]/send-email
 *
 * Send bulletin email to all active subscribers
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check if email is configured
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

    console.log(`📧 Sending bulletin email: ${id}`);

    // Get bulletin
    const bulletin = await getBulletinById(id);

    if (!bulletin) {
      return NextResponse.json(
        { error: "Boletín no encontrado" },
        { status: 404 }
      );
    }

    // Validate bulletin status
    if (bulletin.status !== "published" && bulletin.status !== "authorized") {
      return NextResponse.json(
        {
          error: "El boletín debe estar publicado o autorizado para enviar emails",
          currentStatus: bulletin.status,
        },
        { status: 400 }
      );
    }

    // Get active subscribers
    const subscribers = await getActiveSubscribers();

    if (subscribers.length === 0) {
      return NextResponse.json(
        {
          error: "No hay suscriptores activos",
          message: "Agrega suscriptores antes de enviar el boletín",
        },
        { status: 400 }
      );
    }

    console.log(`  Found ${subscribers.length} active subscribers`);

    // Generate email content
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webViewUrl = `${appUrl}/bulletin/${bulletin.id}`;

    const { html, text, subject } = generateBulletinEmail(bulletin, {
      webViewUrl,
      // unsubscribeUrl could be added later if needed
    });

    // Send emails
    console.log(`  Sending emails...`);
    const result = await sendBulkEmail(
      subscribers.map((s) => ({ email: s.email, name: s.name })),
      subject,
      html,
      text
    );

    console.log(`✅ Email sending completed: ${result.sent} sent, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      sentCount: result.sent,
      failedCount: result.failed,
      totalSubscribers: subscribers.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("❌ Error sending bulletin email:", error);

    return NextResponse.json(
      {
        error: "Error enviando emails",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
