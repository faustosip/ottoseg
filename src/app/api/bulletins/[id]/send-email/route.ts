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
import {
  createEmailSend,
  updateEmailSendStatus,
} from "@/lib/db/queries/email-tracking";
import { createAuditLog } from "@/lib/db/queries/audit";
import { errorResponse } from "@/lib/http/error-response";

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
          message: "Configure la variable de entorno RESEND_API_KEY",
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

    // La URL pública de la app se usa para construir enlaces (unsubscribe,
    // web view, tracking pixel). Si falta en producción es un error
    // configurable — fallamos temprano. En desarrollo caemos a localhost.
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appUrl =
      configuredAppUrl ||
      (process.env.NODE_ENV === "production"
        ? (() => {
            throw new Error(
              "NEXT_PUBLIC_APP_URL no está configurado en producción"
            );
          })()
        : "http://localhost:3000");

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Envío individual con tracking por suscriptor.
    // El registro en email_sends se crea como "pending" y se actualiza con el
    // resultado real que devuelve Resend (sent / failed + error_message).
    for (const subscriber of subscriberList) {
      const trackingId = crypto.randomUUID();

      try {
        const unsubscribeUrl = subscriber.unsubscribeToken
          ? `${appUrl}/api/unsubscribe/${subscriber.unsubscribeToken}`
          : undefined;
        const trackingPixelUrl = `${appUrl}/api/track/open/${trackingId}`;

        // Crear registro en email_sends (pendiente hasta confirmar envío)
        await createEmailSend(
          bulletin.id,
          subscriber.id,
          subscriber.email,
          trackingId,
          "pending"
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
        const result = await sendEmail({
          to: subscriber.email,
          subject,
          html,
          text,
          idempotencyKey: `bulletin-${bulletin.id}-${trackingId}`,
        });

        if (result.success) {
          sentCount++;
          await updateEmailSendStatus(trackingId, "sent");
        } else {
          failedCount++;
          errors.push(`${subscriber.email}: ${result.error}`);
          await updateEmailSendStatus(trackingId, "failed", result.error);
        }

        // Resend permite ~10 req/s; un pequeño respiro evita 429
        await delay(150);
      } catch (error) {
        const message = (error as Error).message;
        console.error(`Error sending to ${subscriber.email}:`, error);
        failedCount++;
        errors.push(`${subscriber.email}: ${message}`);
        await updateEmailSendStatus(trackingId, "failed", message).catch(
          () => {}
        );
      }
    }

    const auditUser = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    };
    const auditMetadata = {
      subscriberCount: subscriberList.length,
      sentCount,
      failedCount,
      errors: errors.slice(0, 5),
    };

    // Si no salió ningún correo NO marcamos el boletín como enviado, para
    // poder reintentar una vez corregida la configuración del proveedor.
    if (sentCount === 0) {
      await createAuditLog(id, "email_failed", auditUser, auditMetadata);

      console.error(
        `❌ Email sending failed for all ${subscriberList.length} subscribers: ${errors[0] ?? "unknown error"}`
      );

      return NextResponse.json(
        {
          error: "No se pudo enviar el boletín a ningún suscriptor",
          message: errors[0] ?? "Error desconocido",
          sentCount,
          failedCount,
          totalSubscribers: subscriberList.length,
        },
        { status: 502 }
      );
    }

    // Marcar boletín como enviado
    await db
      .update(bulletins)
      .set({ emailSentAt: new Date() })
      .where(eq(bulletins.id, id));

    // Registrar auditoría
    await createAuditLog(id, "email_sent", auditUser, auditMetadata);

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
    return errorResponse("Error enviando emails", 500, error);
  }
}
