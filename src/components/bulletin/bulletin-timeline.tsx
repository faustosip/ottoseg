"use client";

import { useMemo, useState } from "react";
import type { Bulletin } from "@/lib/schema";
import {
  BulletinsToolbar,
  type BulletinFilter,
} from "./bulletins-toolbar";
import { BulletinWeekSection } from "./bulletin-week-section";
import {
  BulletinCardRow,
  type BulletinCardPillVariant,
} from "./bulletin-card-row";

type EmailStat = { sent: number; opened: number };

type Props = {
  bulletins: Bulletin[];
  emailStats: Record<string, EmailStat>;
};

function statusToFilter(status: string): BulletinFilter | "other" {
  if (status === "published") return "sent";
  if (status === "draft") return "draft";
  if (status === "failed") return "error";
  return "other";
}

function statusToPill(
  status: string,
): { label: string; variant: BulletinCardPillVariant } {
  switch (status) {
    case "published":
      return { label: "enviado", variant: "ok" };
    case "failed":
      return { label: "error", variant: "err" };
    case "draft":
      return { label: "borrador", variant: "muted" };
    case "ready":
    case "authorized":
    case "video_processing":
    case "summarizing":
    case "classifying":
    case "scraping":
      return { label: "en pipeline", variant: "run" };
    default:
      return { label: status, variant: "muted" };
  }
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  // Monday-based week (1 = Mon). Sun=0 → -6, else 1-day.
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function endOfWeek(start: Date): Date {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatDayMonth(d: Date) {
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}

function formatMonthYear(d: Date) {
  return `${MONTHS_ES[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
}

function isoWeekKey(d: Date): string {
  const start = startOfWeek(d);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
}

function getNewsTitle(b: Bulletin): string {
  const cn = b.classifiedNews as Record<string, Array<{ title?: string }>> | null;
  if (cn) {
    for (const articles of Object.values(cn)) {
      if (Array.isArray(articles) && articles.length > 0 && articles[0]?.title) {
        return articles[0].title!;
      }
    }
  }
  return `Boletín ${formatDayMonth(new Date(b.date))}`;
}

function categoryCount(b: Bulletin): number {
  const cn = b.classifiedNews as Record<string, unknown[]> | null;
  if (!cn) return 0;
  return Object.values(cn).filter(
    (arr) => Array.isArray(arr) && arr.length > 0,
  ).length;
}

export function BulletinTimeline({ bulletins, emailStats }: Props) {
  const [filter, setFilter] = useState<BulletinFilter>("all");

  const counts = useMemo(() => {
    const c: Record<BulletinFilter, number> = {
      all: bulletins.length,
      sent: 0,
      draft: 0,
      error: 0,
    };
    for (const b of bulletins) {
      const f = statusToFilter(b.status);
      if (f !== "other") c[f]++;
    }
    return c;
  }, [bulletins]);

  const filtered = useMemo(() => {
    if (filter === "all") return bulletins;
    return bulletins.filter((b) => statusToFilter(b.status) === filter);
  }, [bulletins, filter]);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { start: Date; end: Date; items: Bulletin[] }
    >();
    for (const b of filtered) {
      const date = new Date(b.date);
      const key = isoWeekKey(date);
      if (!map.has(key)) {
        const start = startOfWeek(date);
        map.set(key, { start, end: endOfWeek(start), items: [] });
      }
      map.get(key)!.items.push(b);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.start.getTime() - a.start.getTime(),
    );
  }, [filtered]);

  const monthLabel = formatMonthYear(new Date());

  const todayKey = isoWeekKey(new Date());
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekKey = isoWeekKey(lastWeek);

  return (
    <>
      <BulletinsToolbar
        active={filter}
        counts={counts}
        onChange={setFilter}
        monthLabel={monthLabel}
      />

      {grouped.length === 0 ? (
        <div
          className="rounded-[14px] px-6 py-12 text-center text-[13px]"
          style={{
            background: "var(--otto-surface)",
            border: "1px solid var(--otto-rule)",
            color: "var(--otto-muted)",
          }}
        >
          <b
            className="mb-1.5 block text-[15px] font-semibold"
            style={{ color: "var(--otto-ink)" }}
          >
            Sin boletines
          </b>
          No hay boletines que coincidan con este filtro.
        </div>
      ) : (
        grouped.map((group) => {
          const key = isoWeekKey(group.start);
          let title: string;
          if (key === todayKey) {
            title = `Esta semana · ${formatDayMonth(group.start)} – ${formatDayMonth(group.end)}`;
          } else if (key === lastWeekKey) {
            title = `Semana pasada · ${formatDayMonth(group.start)} – ${formatDayMonth(group.end)}`;
          } else {
            title = `${formatDayMonth(group.start)} – ${formatDayMonth(group.end)}`;
          }

          const sent = group.items.filter((b) => b.status === "published").length;
          const errored = group.items.filter((b) => b.status === "failed").length;
          const inPipe = group.items.filter(
            (b) => statusToFilter(b.status) === "other",
          ).length;
          const drafted = group.items.filter((b) => b.status === "draft").length;
          let openSum = 0;
          let sentSum = 0;
          for (const b of group.items) {
            const stat = emailStats[b.id];
            if (stat && stat.sent > 0) {
              openSum += stat.opened;
              sentSum += stat.sent;
            }
          }
          const avgOpen =
            sentSum > 0 ? Math.round((openSum / sentSum) * 100) : null;

          const statsParts: string[] = [];
          if (sent > 0) statsParts.push(`${sent} enviado${sent === 1 ? "" : "s"}`);
          if (inPipe > 0)
            statsParts.push(`${inPipe} en pipeline`);
          if (drafted > 0) statsParts.push(`${drafted} borrador${drafted === 1 ? "" : "es"}`);
          if (errored > 0)
            statsParts.push(`${errored} error${errored === 1 ? "" : "es"}`);
          if (avgOpen !== null) statsParts.push(`prom. apertura · ${avgOpen}%`);

          return (
            <BulletinWeekSection
              key={key}
              title={title}
              stats={statsParts.join(" · ")}
            >
              {group.items.map((b) => {
                const stat = emailStats[b.id];
                const openRate =
                  stat && stat.sent > 0
                    ? Math.round((stat.opened / stat.sent) * 100)
                    : null;
                const totalNews = b.totalNews ?? 0;
                const cats = categoryCount(b);
                const meta: Array<{ value: React.ReactNode; label: string }> = [
                  { value: totalNews, label: totalNews === 1 ? "noticia" : "noticias" },
                ];
                if (cats > 0)
                  meta.push({
                    value: cats,
                    label: cats === 1 ? "categoría" : "categorías",
                  });
                if (stat && stat.sent > 0) {
                  meta.push({
                    value: stat.sent.toLocaleString("es-EC"),
                    label: "destinatarios",
                  });
                }
                return (
                  <BulletinCardRow
                    key={b.id}
                    href={`/dashboard/bulletin/${b.id}`}
                    date={b.date}
                    title={getNewsTitle(b)}
                    summary={
                      b.status === "failed"
                        ? "Boletín no se envió. Revisa los logs."
                        : null
                    }
                    meta={meta}
                    pill={statusToPill(b.status)}
                    openRate={openRate}
                    openCount={stat?.opened ?? null}
                    isError={b.status === "failed"}
                  />
                );
              })}
            </BulletinWeekSection>
          );
        })
      )}
    </>
  );
}
