"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { NewsSource } from "@/lib/schema";

interface SourceCardProps {
  source: NewsSource;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (isActive: boolean) => void;
}

/**
 * Componente de tarjeta para mostrar una fuente de noticias
 */
export function SourceCard({ source, onEdit, onDelete, onToggleActive }: SourceCardProps) {
  const getStatusIcon = () => {
    if (!source.lastScraped) {
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }

    switch (source.lastScrapedStatus) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "partial":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (!source.lastScraped) {
      return "Nunca scrapeado";
    }

    const date = new Date(source.lastScraped);
    const timeAgo = formatTimeAgo(date);

    switch (source.lastScrapedStatus) {
      case "success":
        return `Exitoso - ${timeAgo}`;
      case "failed":
        return `Fallido - ${timeAgo}`;
      case "partial":
        return `Parcial - ${timeAgo}`;
      default:
        return timeAgo;
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold truncate">{source.name}</h3>
            <Badge variant={source.isActive ? "default" : "secondary"}>
              {source.isActive ? "Activa" : "Inactiva"}
            </Badge>
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 truncate"
          >
            <span className="truncate">{source.url}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleActive(!source.isActive)}
            >
              {source.isActive ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Desactivar
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Activar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-2xl font-bold">{source.totalScraped || 0}</div>
          <div className="text-xs text-muted-foreground">Total scrapeado</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {source.isActive ? "Activa" : "Inactiva"}
          </div>
          <div className="text-xs text-muted-foreground">Estado</div>
        </div>
      </div>

      {/* Last scrape status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
        {getStatusIcon()}
        <span className="truncate">{getStatusText()}</span>
      </div>

      {/* Scrape config indicator */}
      {source.scrapeConfig !== null && source.scrapeConfig !== undefined && (
        <div className="mt-2 pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Configuración personalizada
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Formatea una fecha como tiempo relativo (ej: "hace 2 horas")
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "hace un momento";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays} días`;

  return date.toLocaleDateString();
}
