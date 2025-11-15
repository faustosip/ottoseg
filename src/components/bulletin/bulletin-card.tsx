"use client";

import Link from "next/link";
import {
  DollarSign,
  Landmark,
  Users,
  Shield,
  Globe,
  Car,
  Video,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge, type BulletinStatus } from "./status-badge";
import { cn } from "@/lib/utils";

/**
 * Props para BulletinCard
 */
export interface BulletinCardProps {
  /**
   * ID del boletín
   */
  id: string;

  /**
   * Fecha del boletín
   */
  date: Date;

  /**
   * Estado del boletín
   */
  status: BulletinStatus;

  /**
   * Número total de noticias
   */
  totalNews: number;

  /**
   * Estado del video
   */
  videoStatus?: "not_started" | "processing" | "completed" | "failed";

  /**
   * Mapa de categorías con contenido
   * key: categoría, value: true si tiene contenido
   */
  categories: {
    economia?: boolean;
    politica?: boolean;
    sociedad?: boolean;
    seguridad?: boolean;
    internacional?: boolean;
    vial?: boolean;
  };

  /**
   * Timestamp de creación
   */
  createdAt: Date;

  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Iconos por categoría
 */
const CATEGORY_ICONS = {
  economia: DollarSign,
  politica: Landmark,
  sociedad: Users,
  seguridad: Shield,
  internacional: Globe,
  vial: Car,
};

/**
 * Colores por categoría
 */
const CATEGORY_COLORS = {
  economia: "text-green-600",
  politica: "text-blue-600",
  sociedad: "text-purple-600",
  seguridad: "text-red-600",
  internacional: "text-indigo-600",
  vial: "text-orange-600",
};

/**
 * Formatea una fecha al formato español completo
 */
function formatBulletinDate(date: Date): string {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];

  return `${dayName} ${day} de ${monthName}`;
}

/**
 * Formatea un timestamp a formato relativo
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Componente BulletinCard
 *
 * Card para mostrar un boletín en la lista del dashboard.
 * Incluye fecha, estado, categorías, y navegación.
 *
 * @example
 * ```tsx
 * <BulletinCard
 *   id="123"
 *   date={new Date()}
 *   status="ready"
 *   totalNews={18}
 *   videoStatus="completed"
 *   categories={{ economia: true, politica: true }}
 *   createdAt={new Date()}
 * />
 * ```
 */
export function BulletinCard({
  id,
  date,
  status,
  totalNews,
  videoStatus = "not_started",
  categories,
  createdAt,
  className,
}: BulletinCardProps) {
  const formattedDate = formatBulletinDate(date);
  const relativeTime = formatRelativeTime(createdAt);

  // Contar categorías con contenido
  const categoriesWithContent = Object.entries(categories).filter(
    ([, hasContent]) => hasContent
  ).length;

  return (
    <Link href={`/dashboard/bulletin/${id}`} className="block">
      <Card
        className={cn(
          "bulletin-card hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-2",
          className
        )}
      >
        <CardHeader className="pb-3">
          {/* Fecha grande */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-2xl font-bold text-gray-900 leading-tight">
              {formattedDate}
            </h3>
            <StatusBadge status={status} />
          </div>

          {/* Timestamp de creación */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{relativeTime}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Estadísticas */}
          <div className="flex items-center gap-6">
            {/* Total de noticias */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Noticias</p>
                <p className="text-sm font-semibold text-gray-900">
                  {totalNews}
                </p>
              </div>
            </div>

            {/* Estado del video */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full",
                  videoStatus === "completed" && "bg-green-50",
                  videoStatus === "processing" && "bg-purple-50",
                  videoStatus === "not_started" && "bg-gray-50",
                  videoStatus === "failed" && "bg-red-50"
                )}
              >
                <Video
                  className={cn(
                    "h-4 w-4",
                    videoStatus === "completed" && "text-green-600",
                    videoStatus === "processing" && "text-purple-600",
                    videoStatus === "not_started" && "text-gray-400",
                    videoStatus === "failed" && "text-red-600"
                  )}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">Video</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {videoStatus === "not_started" && "Pendiente"}
                  {videoStatus === "processing" && "Procesando"}
                  {videoStatus === "completed" && "Listo"}
                  {videoStatus === "failed" && "Error"}
                </p>
              </div>
            </div>
          </div>

          {/* Mini preview de categorías */}
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Categorías ({categoriesWithContent}/6)
            </p>
            <div className="flex items-center gap-2">
              {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => {
                const hasContent = categories[key as keyof typeof categories];
                const color = CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS];

                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                      hasContent
                        ? "bg-white border-2 border-current shadow-sm"
                        : "bg-gray-100 opacity-40"
                    )}
                    title={key.charAt(0).toUpperCase() + key.slice(1)}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        hasContent ? color : "text-gray-400"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
