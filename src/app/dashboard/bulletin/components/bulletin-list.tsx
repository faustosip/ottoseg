"use client";

import { BulletinCard } from "@/components/bulletin/bulletin-card";
import type { Bulletin } from "@/lib/schema";

/**
 * Props para BulletinList
 */
export interface BulletinListProps {
  bulletins: Bulletin[];
}

/**
 * Componente BulletinList
 *
 * Renderiza una lista de boletines en un grid responsive
 */
export function BulletinList({ bulletins }: BulletinListProps) {
  if (bulletins.length === 0) {
    return null;
  }

  return (
    <div className="bulletin-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bulletins.map((bulletin) => {
        // Determinar estado del video
        const videoStatus = bulletin.videoStatus as
          | "not_started"
          | "processing"
          | "completed"
          | "failed"
          | undefined;

        // Determinar categorías con contenido
        const categories = {
          economia: !!bulletin.economia,
          politica: !!bulletin.politica,
          sociedad: !!bulletin.sociedad,
          seguridad: !!bulletin.seguridad,
          internacional: !!bulletin.internacional,
          vial: !!bulletin.vial,
        };

        return (
          <BulletinCard
            key={bulletin.id}
            id={bulletin.id}
            date={bulletin.date}
            status={bulletin.status as any}
            totalNews={bulletin.totalNews || 0}
            videoStatus={videoStatus || "not_started"}
            categories={categories}
            createdAt={bulletin.createdAt}
          />
        );
      })}
    </div>
  );
}
