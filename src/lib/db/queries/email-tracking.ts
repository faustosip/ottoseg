import { db } from "@/lib/db";
import {
  emailSends,
  emailClicks,
  type EmailSend,
} from "@/lib/schema";
import { eq, sql, isNotNull } from "drizzle-orm";

/**
 * Registrar un envío individual de email
 */
export async function createEmailSend(
  bulletinId: string,
  subscriberId: string | null,
  subscriberEmail: string,
  trackingId: string
): Promise<EmailSend> {
  const [send] = await db
    .insert(emailSends)
    .values({
      bulletinId,
      subscriberId,
      subscriberEmail,
      trackingId,
    })
    .returning();
  return send;
}

/**
 * Marcar email como abierto (incrementar openCount, setear openedAt si es primera vez)
 */
export async function recordEmailOpen(trackingId: string): Promise<void> {
  await db
    .update(emailSends)
    .set({
      openedAt: sql`COALESCE(${emailSends.openedAt}, now())`,
      openCount: sql`${emailSends.openCount} + 1`,
    })
    .where(eq(emailSends.trackingId, trackingId));
}

/**
 * Registrar clic en un link del email
 */
export async function recordEmailClick(
  emailSendId: string,
  url: string
): Promise<void> {
  await db.insert(emailClicks).values({ emailSendId, url });

  // Incrementar clickCount en el emailSend
  await db
    .update(emailSends)
    .set({ clickCount: sql`${emailSends.clickCount} + 1` })
    .where(eq(emailSends.id, emailSendId));
}

/**
 * Obtener emailSend por trackingId (para los endpoints de tracking)
 */
export async function getEmailSendByTrackingId(
  trackingId: string
): Promise<EmailSend | null> {
  const [send] = await db
    .select()
    .from(emailSends)
    .where(eq(emailSends.trackingId, trackingId))
    .limit(1);
  return send ?? null;
}

/**
 * Stats agregadas por boletín (para UI del boletín)
 */
export async function getEmailStatsByBulletin(bulletinId: string) {
  const [stats] = await db
    .select({
      totalSent: sql<number>`count(*) filter (where ${emailSends.status} = 'sent')`,
      totalFailed: sql<number>`count(*) filter (where ${emailSends.status} = 'failed')`,
      totalOpened: sql<number>`count(*) filter (where ${emailSends.openedAt} is not null)`,
      totalClicks: sql<number>`coalesce(sum(${emailSends.clickCount}), 0)`,
    })
    .from(emailSends)
    .where(eq(emailSends.bulletinId, bulletinId));

  const totalSent = Number(stats?.totalSent ?? 0);
  const totalOpened = Number(stats?.totalOpened ?? 0);

  return {
    totalSent,
    totalFailed: Number(stats?.totalFailed ?? 0),
    totalOpened,
    totalClicks: Number(stats?.totalClicks ?? 0),
    openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
  };
}

/**
 * Stats globales (para dashboard)
 */
export async function getOverallEmailStats() {
  const [stats] = await db
    .select({
      totalSent: sql<number>`count(*) filter (where ${emailSends.status} = 'sent')`,
      totalOpened: sql<number>`count(*) filter (where ${emailSends.openedAt} is not null)`,
      totalClicks: sql<number>`coalesce(sum(${emailSends.clickCount}), 0)`,
    })
    .from(emailSends);

  const totalSent = Number(stats?.totalSent ?? 0);
  const totalOpened = Number(stats?.totalOpened ?? 0);
  const totalClicks = Number(stats?.totalClicks ?? 0);

  return {
    totalSent,
    totalOpened,
    openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
    totalClicks,
    clickRate: totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0,
  };
}
