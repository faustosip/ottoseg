import { notFound } from "next/navigation";
import { getBulletinById, getBulletinLogs } from "@/lib/db/queries/bulletins";
import { getAuditLogsByBulletin } from "@/lib/db/queries/audit";
import { StatusBadge } from "@/components/bulletin/status-badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BulletinDetailTabs } from "./components/bulletin-detail-tabs";
import { BulletinActions } from "./components/bulletin-actions";
import { DeleteBulletinButton } from "@/components/bulletin/delete-bulletin-button";
import { ShareButton } from "@/components/bulletin/share-button";
import { Topline } from "@/components/dashboard/topline";
import { FooterNote } from "@/components/dashboard/footer-note";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BulletinDetailPage({ params }: PageProps) {
  const { id } = await params;

  const bulletin = await getBulletinById(id);

  if (!bulletin) {
    notFound();
  }

  const logs = await getBulletinLogs(id);
  const auditLogs = await getAuditLogsByBulletin(id);

  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(bulletin.date);

  return (
    <>
      <Topline crumbs={["Operación", "Boletines", formattedDate]} />

      <div className="mb-[18px]">
        <Link
          href="/dashboard/bulletin"
          className="font-mono-otto inline-flex items-center gap-1.5 text-[11px]"
          style={{
            color: "var(--otto-muted)",
            letterSpacing: ".1em",
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la lista
        </Link>
      </div>

      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-[18px]">
        <div className="min-w-[280px] flex-1">
          <h1
            className="font-display m-0 mb-1.5 text-[38px] font-bold capitalize leading-[1.05]"
            style={{
              letterSpacing: "-1.4px",
              color: "var(--otto-ink)",
            }}
          >
            {formattedDate}
          </h1>
          <p
            className="m-0 max-w-[640px] text-[14px] leading-[1.55]"
            style={{ color: "var(--otto-muted)" }}
          >
            Boletín ID:{" "}
            <span
              className="font-mono-otto"
              style={{
                fontSize: "11px",
                letterSpacing: ".06em",
                textTransform: "none",
                color: "var(--otto-ink-2)",
              }}
            >
              {id}
            </span>
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2.5 pt-2">
          <StatusBadge
            status={
              bulletin.status as
                | "scraping"
                | "scraped"
                | "classifying"
                | "summarizing"
                | "ready"
                | "authorized"
                | "published"
                | "failed"
            }
          />
        </div>
      </div>

      <div
        className="mb-[22px] flex flex-wrap items-center gap-2.5 rounded-[14px] border bg-white p-3.5"
        style={{
          borderColor: "var(--otto-rule)",
          boxShadow: "var(--otto-shadow-1)",
        }}
      >
        <BulletinActions
          bulletinId={id}
          status={bulletin.status}
          hasClassifiedNews={!!bulletin.classifiedNews}
          hasVideo={!!bulletin.manualVideoUrl}
        />
        {bulletin.status === "published" && bulletin.classifiedNews ? (
          <ShareButton bulletinId={id} bulletinDate={bulletin.date} />
        ) : null}
        <DeleteBulletinButton
          bulletinId={id}
          bulletinDate={formattedDate}
          isPublished={bulletin.status === "published"}
        />
      </div>

      <BulletinDetailTabs
        bulletin={bulletin}
        logs={logs as Parameters<typeof BulletinDetailTabs>[0]["logs"]}
        auditLogs={auditLogs}
      />

      <FooterNote>OttoSeguridad · Console · Boletín</FooterNote>
    </>
  );
}
