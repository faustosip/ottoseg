import Link from "next/link";
import { AlertCircle, Plus } from "lucide-react";
import {
  getAllBulletins,
  getTodayBulletin,
  getBulletinEmailStats,
} from "@/lib/db/queries/bulletins";
import { Topline } from "@/components/dashboard/topline";
import { PageHeader } from "@/components/dashboard/page-header";
import { FooterNote } from "@/components/dashboard/footer-note";
import { BulletinTimeline } from "@/components/bulletin/bulletin-timeline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BulletinListPage() {
  const bulletins = await getAllBulletins({
    limit: 50,
    orderBy: "date",
    order: "desc",
  });

  const todayBulletin = await getTodayBulletin();
  const hasTodayBulletin = !!todayBulletin;
  const canGenerate =
    !hasTodayBulletin || todayBulletin?.status === "failed";

  const emailStatsMap = await getBulletinEmailStats(bulletins.map((b) => b.id));
  const emailStats: Record<string, { sent: number; opened: number }> = {};
  for (const [id, stat] of emailStatsMap.entries()) {
    emailStats[id] = stat;
  }

  return (
    <>
      <Topline crumbs={["Operación", "Boletines"]} />
      <PageHeader
        title="Boletines"
        lede="Histórico de envíos y borradores. Agrupados por semana."
        actions={
          canGenerate ? (
            <Link
              href="/dashboard/bulletin/generate"
              className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white transition-shadow hover:shadow-[0_6px_18px_rgba(214,40,40,.36)]"
              style={{
                background: "var(--otto-primary)",
                boxShadow: "0 4px 14px rgba(214,40,40,.28)",
              }}
            >
              <Plus className="h-4 w-4" />
              Generar boletín
            </Link>
          ) : (
            <Link
              href={`/dashboard/bulletin/${todayBulletin!.id}`}
              className="inline-flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[var(--otto-bg)]"
              style={{
                background: "var(--otto-surface)",
                borderColor: "var(--otto-rule)",
                color: "var(--otto-ink)",
              }}
              title="Ya existe un boletín para hoy"
            >
              Ver boletín de hoy →
            </Link>
          )
        }
      />

      {hasTodayBulletin && todayBulletin?.status !== "failed" ? (
        <div
          className="mb-[22px] flex items-start gap-3 rounded-[12px] border p-3.5"
          style={{
            background: "var(--otto-primary-soft)",
            borderColor: "var(--otto-primary)",
            color: "var(--otto-primary-ink)",
          }}
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            style={{ color: "var(--otto-primary)" }}
          />
          <div className="flex-1 text-[13px] leading-[1.5]">
            <strong className="font-semibold">
              Boletín de hoy ya existe.
            </strong>{" "}
            Solo puedes generar uno por día.{" "}
            <Link
              href={`/dashboard/bulletin/${todayBulletin!.id}`}
              className="font-semibold underline underline-offset-2"
              style={{ color: "var(--otto-primary-ink)" }}
            >
              Ver boletín →
            </Link>
          </div>
        </div>
      ) : null}

      <BulletinTimeline bulletins={bulletins} emailStats={emailStats} />

      <FooterNote>OttoSeguridad · Console · Boletines</FooterNote>
    </>
  );
}
