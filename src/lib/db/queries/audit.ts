import { db } from "@/lib/db";
import { bulletinAuditLogs, type BulletinAuditLog } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

interface AuditUser {
  id: string;
  name: string;
  email: string;
}

export async function createAuditLog(
  bulletinId: string,
  action: string,
  user: AuditUser,
  metadata?: Record<string, unknown>
): Promise<BulletinAuditLog> {
  const [log] = await db
    .insert(bulletinAuditLogs)
    .values({
      bulletinId,
      action,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      metadata,
    })
    .returning();
  return log;
}

export async function getAuditLogsByBulletin(
  bulletinId: string
): Promise<BulletinAuditLog[]> {
  return db
    .select()
    .from(bulletinAuditLogs)
    .where(eq(bulletinAuditLogs.bulletinId, bulletinId))
    .orderBy(desc(bulletinAuditLogs.createdAt));
}

export async function getRecentAuditLogs(
  limit = 50
): Promise<BulletinAuditLog[]> {
  return db
    .select()
    .from(bulletinAuditLogs)
    .orderBy(desc(bulletinAuditLogs.createdAt))
    .limit(limit);
}
