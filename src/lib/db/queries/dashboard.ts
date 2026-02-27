import { db } from "@/lib/db";
import {
  bulletins,
  subscribers,
  emailSends,
  bulletinLogs,
  bulletinAuditLogs,
} from "@/lib/schema";
import { and, eq, sql, count, sum, avg, desc, gte, isNotNull } from "drizzle-orm";

// ============================================================================
// KPIs
// ============================================================================

export async function getDashboardKPIs() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Boletines
  const [totalBulletinsRow] = await db.select({ count: count() }).from(bulletins);
  const [publishedRow] = await db
    .select({ count: count() })
    .from(bulletins)
    .where(eq(bulletins.status, "published"));
  const [publishedThisWeekRow] = await db
    .select({ count: count() })
    .from(bulletins)
    .where(and(eq(bulletins.status, "published"), gte(bulletins.createdAt, oneWeekAgo)));

  // Suscriptores
  const [activeSubsRow] = await db
    .select({ count: count() })
    .from(subscribers)
    .where(eq(subscribers.isActive, true));
  const [newSubsRow] = await db
    .select({ count: count() })
    .from(subscribers)
    .where(gte(subscribers.createdAt, oneWeekAgo));

  // Email
  const [sentRow] = await db
    .select({ count: count() })
    .from(emailSends)
    .where(eq(emailSends.status, "sent"));
  const [openedRow] = await db
    .select({ count: count() })
    .from(emailSends)
    .where(isNotNull(emailSends.openedAt));

  const totalSent = sentRow?.count ?? 0;
  const totalOpened = openedRow?.count ?? 0;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  // Noticias
  const [newsRow] = await db
    .select({
      total: sum(bulletins.totalNews),
      avg: avg(bulletins.totalNews),
    })
    .from(bulletins)
    .where(eq(bulletins.status, "published"));

  return {
    bulletins: {
      total: totalBulletinsRow?.count ?? 0,
      published: publishedRow?.count ?? 0,
      publishedThisWeek: publishedThisWeekRow?.count ?? 0,
    },
    subscribers: {
      active: activeSubsRow?.count ?? 0,
      newThisWeek: newSubsRow?.count ?? 0,
    },
    email: {
      totalSent,
      totalOpened,
      openRate,
    },
    news: {
      total: Number(newsRow?.total ?? 0),
      avgPerBulletin: Math.round(Number(newsRow?.avg ?? 0)),
    },
  };
}

// ============================================================================
// Trend: boletines por semana
// ============================================================================

export async function getBulletinTrend(weeks = 12) {
  const rows = await db.execute<{ week: string; count: number }>(sql`
    SELECT
      date_trunc('week', created_at)::date AS week,
      count(*)::int AS count
    FROM bulletins
    WHERE created_at >= now() - interval '${sql.raw(String(weeks))} weeks'
    GROUP BY 1
    ORDER BY 1
  `);

  return (rows as Array<{ week: string; count: number }>).map((r) => ({
    week: new Date(r.week).toLocaleDateString("es-EC", { day: "2-digit", month: "short" }),
    count: Number(r.count),
  }));
}

// ============================================================================
// Email performance por boletín
// ============================================================================

export async function getEmailPerformanceByBulletin(limit = 10) {
  const rows = await db.execute<{ bulletin_date: string; sent: number; opened: number }>(sql`
    SELECT
      b.date::date AS bulletin_date,
      count(*)::int AS sent,
      count(es.opened_at)::int AS opened
    FROM email_sends es
    JOIN bulletins b ON b.id = es.bulletin_id
    WHERE es.status = 'sent'
    GROUP BY b.id, b.date
    ORDER BY b.date DESC
    LIMIT ${limit}
  `);

  return (rows as Array<{ bulletin_date: string; sent: number; opened: number }>)
    .reverse()
    .map((r) => ({
      bulletinDate: new Date(r.bulletin_date).toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "short",
      }),
      sent: Number(r.sent),
      opened: Number(r.opened),
    }));
}

// ============================================================================
// Noticias por categoría
// ============================================================================

export async function getNewsByCategory() {
  const publishedBulletins = await db
    .select({ classifiedNews: bulletins.classifiedNews })
    .from(bulletins)
    .where(eq(bulletins.status, "published"));

  const categoryCounts: Record<string, number> = {};
  const categoryLabels: Record<string, string> = {
    economia: "Economía",
    politica: "Política",
    sociedad: "Sociedad",
    seguridad: "Seguridad",
    internacional: "Internacional",
    vial: "Vial",
  };

  for (const b of publishedBulletins) {
    const cn = b.classifiedNews as Record<string, unknown[]> | null;
    if (!cn) continue;
    for (const [key, articles] of Object.entries(cn)) {
      if (Array.isArray(articles)) {
        categoryCounts[key] = (categoryCounts[key] || 0) + articles.length;
      }
    }
  }

  return Object.entries(categoryCounts)
    .map(([key, value]) => ({
      category: categoryLabels[key] || key,
      count: value,
    }))
    .sort((a, b) => b.count - a.count);
}

// ============================================================================
// Noticias por fuente
// ============================================================================

export async function getNewsBySource() {
  const publishedBulletins = await db
    .select({ classifiedNews: bulletins.classifiedNews })
    .from(bulletins)
    .where(eq(bulletins.status, "published"));

  const sourceCounts: Record<string, number> = {};

  for (const b of publishedBulletins) {
    const cn = b.classifiedNews as Record<string, Array<{ source?: string }>> | null;
    if (!cn) continue;
    for (const articles of Object.values(cn)) {
      if (!Array.isArray(articles)) continue;
      for (const article of articles) {
        if (article.source) {
          sourceCounts[article.source] = (sourceCounts[article.source] || 0) + 1;
        }
      }
    }
  }

  return Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

// ============================================================================
// Pipeline performance
// ============================================================================

export async function getPipelinePerformance() {
  const rows = await db
    .select({
      step: bulletinLogs.step,
      avgDuration: avg(bulletinLogs.duration),
    })
    .from(bulletinLogs)
    .where(isNotNull(bulletinLogs.duration))
    .groupBy(bulletinLogs.step);

  return rows.map((r) => {
    const avgMs = Math.round(Number(r.avgDuration ?? 0));
    return {
      step: r.step,
      avgDuration: avgMs,
      avgDurationFormatted: avgMs >= 60000
        ? `${(avgMs / 60000).toFixed(1)}min`
        : `${(avgMs / 1000).toFixed(1)}s`,
      status: avgMs > 120000 ? "slow" : avgMs > 60000 ? "warning" : "normal",
    };
  });
}

// ============================================================================
// Actividad reciente (audit logs)
// ============================================================================

export async function getRecentActivity(limit = 5) {
  return db
    .select()
    .from(bulletinAuditLogs)
    .orderBy(desc(bulletinAuditLogs.createdAt))
    .limit(limit);
}
