import { notFound } from "next/navigation";
import { getBulletinById, getBulletinLogs } from "@/lib/db/queries/bulletins";
import { getAuditLogsByBulletin } from "@/lib/db/queries/audit";
import { StatusBadge } from "@/components/bulletin/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BulletinDetailTabs } from "./components/bulletin-detail-tabs";
import { BulletinActions } from "./components/bulletin-actions";
import { DeleteBulletinButton } from "@/components/bulletin/delete-bulletin-button";
import { ShareButton } from "@/components/bulletin/share-button";

/**
 * Props de la página
 */
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Página Detalle de Boletín
 *
 * Muestra toda la información de un boletín específico con tabs
 */
export default async function BulletinDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Cargar boletín
  const bulletin = await getBulletinById(id);

  // 404 si no existe
  if (!bulletin) {
    notFound();
  }

  // Cargar logs y auditoría
  const logs = await getBulletinLogs(id);
  const auditLogs = await getAuditLogsByBulletin(id);

  // Formatear fecha
  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(bulletin.date);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        {/* Botón volver */}
        <Link href="/dashboard/bulletin">
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a la lista
          </Button>
        </Link>

        {/* Título y Status */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 capitalize">
              {formattedDate}
            </h1>
            <p className="text-gray-600">
              Boletín ID: <span className="font-mono text-sm">{id}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={bulletin.status as "scraping" | "scraped" | "classifying" | "summarizing" | "ready" | "authorized" | "published" | "failed"} />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Autorizar / Publicar */}
          <BulletinActions
            bulletinId={id}
            status={bulletin.status}
            hasClassifiedNews={!!bulletin.classifiedNews}
            hasVideo={!!bulletin.manualVideoUrl}
          />

          {/* Compartir link público (solo cuando está publicado) */}
          {bulletin.status === "published" && bulletin.classifiedNews ? (
            <ShareButton bulletinId={id} bulletinDate={bulletin.date} />
          ) : null}

          {/* Eliminar */}
          <DeleteBulletinButton
            bulletinId={id}
            bulletinDate={formattedDate}
            isPublished={bulletin.status === "published"}
          />
        </div>
      </div>

      {/* Tabs de contenido */}
      <BulletinDetailTabs bulletin={bulletin} logs={logs as Parameters<typeof BulletinDetailTabs>[0]['logs']} auditLogs={auditLogs} />
    </div>
  );
}
