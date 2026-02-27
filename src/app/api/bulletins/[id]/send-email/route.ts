/**
 * API Endpoint: /api/bulletins/[id]/send-email
 *
 * POST - Send bulletin email individually to each active subscriber with tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { bulletins } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getBulletinById } from "@/lib/db/queries/bulletins";
import { getActiveSubscribers } from "@/lib/db/queries/subscribers";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { generateBulletinEmail } from "@/lib/email/templates/bulletin";
import { createEmailSend } from "@/lib/db/queries/email-tracking";
import { createAuditLog } from "@/lib/db/queries/audit";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/bulletins/[id]/send-email
 *
 * Send bulletin email individually to each subscriber with tracking
 */
export async function POST(
  _request: NextRequest,
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

    // Prevención de envío duplicado
    if (bulletin.emailSentAt) {
      return NextResponse.json(
        {
          error: "Este boletín ya fue enviado por email",
          sentAt: bulletin.emailSentAt,
        },
        { status: 400 }
      );
    }

    // Validate bulletin status
    if (bulletin.status !== "published" && bulletin.status !== "authorized") {
      return NextResponse.json(
        {
          error:
            "El boletín debe estar publicado o autorizado para enviar emails",
          currentStatus: bulletin.status,
        },
        { status: 400 }
      );
    }

    // Get active subscribers
    const subscriberList = await getActiveSubscribers();

    if (subscriberList.length === 0) {
      return NextResponse.json(
        {
          error: "No hay suscriptores activos",
          message: "Agrega suscriptores antes de enviar el boletín",
        },
        { status: 400 }
      );
    }

    console.log(`  Found ${subscriberList.length} active subscribers`);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://ottoseguridadai.com";
    let sentCount = 0;
    let failedCount = 0;

    // Envío individual con tracking por suscriptor
    for (const subscriber of subscriberList) {
      try {
        const trackingId = crypto.randomUUID();
        const unsubscribeUrl = subscriber.unsubscribeToken
          ? `${appUrl}/api/unsubscribe/${subscriber.unsubscribeToken}`
          : undefined;
        const trackingPixelUrl = `${appUrl}/api/track/open/${trackingId}`;

        // Crear registro en email_sends
        await createEmailSend(
          bulletin.id,
          subscriber.id,
          subscriber.email,
          trackingId
        );

        // Generar HTML personalizado con tracking
        const { html, text, subject } = generateBulletinEmail(bulletin, {
          webViewUrl: `${appUrl}/bulletin/${bulletin.id}`,
          unsubscribeUrl,
          subscriberName: subscriber.name || undefined,
          trackingPixelUrl,
          trackingBaseUrl: `${appUrl}/api/track/click/${trackingId}`,
          trackingId,
        });

        // Enviar email individual
        const success = await sendEmail({
          to: subscriber.email,
          subject,
          html,
          text,
        });

        if (success) {
          sentCount++;
        } else {
          failedCount++;
        }

        // Rate limiting
        await delay(100);
      } catch (error) {
        console.error(
          `Error sending to ${subscriber.email}:`,
          error
        );
        failedCount++;
      }
    }

    // Marcar boletín como enviado
    await db
      .update(bulletins)
      .set({ emailSentAt: new Date() })
      .where(eq(bulletins.id, id));

    // Registrar auditoría
    await createAuditLog(id, "email_sent", {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    }, { subscriberCount: subscriberList.length, sentCount, failedCount });

    console.log(
      `✅ Email sending completed: ${sentCount} sent, ${failedCount} failed`
    );

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      totalSubscribers: subscriberList.length,
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
