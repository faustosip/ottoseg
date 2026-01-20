import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Estados posibles de un boletín
 */
export type BulletinStatus =
  | "draft"
  | "scraping"
  | "classifying"
  | "summarizing"
  | "ready"
  | "authorized"
  | "video_processing"
  | "published"
  | "failed";

/**
 * Props para StatusBadge
 */
export interface StatusBadgeProps {
  /**
   * Estado del boletín
   */
  status: BulletinStatus;

  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Configuración de colores y textos por estado
 */
const STATUS_CONFIG: Record<
  BulletinStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
    showSpinner: boolean;
  }
> = {
  draft: {
    label: "Borrador",
    variant: "secondary",
    className: "bg-gray-100 text-gray-700 border-gray-300",
    showSpinner: false,
  },
  scraping: {
    label: "Scraping...",
    variant: "default",
    className: "bg-blue-100 text-blue-700 border-blue-300",
    showSpinner: true,
  },
  classifying: {
    label: "Clasificando...",
    variant: "default",
    className: "bg-blue-100 text-blue-700 border-blue-300",
    showSpinner: true,
  },
  summarizing: {
    label: "Resumiendo...",
    variant: "default",
    className: "bg-blue-100 text-blue-700 border-blue-300",
    showSpinner: true,
  },
  ready: {
    label: "Listo",
    variant: "default",
    className: "bg-green-100 text-green-700 border-green-300",
    showSpinner: false,
  },
  authorized: {
    label: "Autorizado",
    variant: "default",
    className: "bg-amber-100 text-amber-700 border-amber-300",
    showSpinner: false,
  },
  video_processing: {
    label: "Procesando Video...",
    variant: "default",
    className: "bg-purple-100 text-purple-700 border-purple-300",
    showSpinner: true,
  },
  published: {
    label: "Publicado",
    variant: "default",
    className: "bg-emerald-100 text-emerald-700 border-emerald-300",
    showSpinner: false,
  },
  failed: {
    label: "Error",
    variant: "destructive",
    className: "bg-red-100 text-red-700 border-red-300",
    showSpinner: false,
  },
};

/**
 * Componente StatusBadge
 *
 * Muestra un badge con el estado actual del boletín.
 * Incluye colores apropiados y spinner animado para estados de carga.
 *
 * @example
 * ```tsx
 * <StatusBadge status="ready" />
 * <StatusBadge status="scraping" />
 * <StatusBadge status="failed" />
 * ```
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    console.error(`Unknown status: ${status}`);
    return (
      <Badge variant="outline" className={className}>
        Desconocido
      </Badge>
    );
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "font-medium border",
        config.className,
        config.showSpinner && "gap-1.5",
        className
      )}
    >
      {config.showSpinner && (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}

/**
 * Hook helper para obtener información del status
 */
export function getStatusInfo(status: BulletinStatus) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.draft;
}

/**
 * Verifica si un status es de procesamiento (loading)
 */
export function isProcessingStatus(status: BulletinStatus): boolean {
  return ["scraping", "classifying", "summarizing", "video_processing"].includes(
    status
  );
}

/**
 * Verifica si un status es final (completado o fallido)
 */
export function isFinalStatus(status: BulletinStatus): boolean {
  return ["ready", "authorized", "published", "failed"].includes(status);
}
