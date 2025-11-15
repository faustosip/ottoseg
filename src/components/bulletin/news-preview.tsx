"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Fuentes de noticias soportadas
 */
export type NewsSource =
  | "primicias"
  | "la_hora"
  | "el_comercio"
  | "teleamazonas"
  | "ecu911";

/**
 * Props para NewsPreview
 */
export interface NewsPreviewProps {
  /**
   * Título de la noticia
   */
  title: string;

  /**
   * Contenido completo de la noticia
   */
  content: string;

  /**
   * URL de la noticia original
   */
  url?: string;

  /**
   * Fuente de la noticia
   */
  source: NewsSource;

  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Configuración de fuentes con colores
 */
const SOURCE_CONFIG: Record<
  NewsSource,
  {
    name: string;
    color: string;
    bgColor: string;
  }
> = {
  primicias: {
    name: "Primicias",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  la_hora: {
    name: "La Hora",
    color: "text-red-700",
    bgColor: "bg-red-50",
  },
  el_comercio: {
    name: "El Comercio",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
  },
  teleamazonas: {
    name: "Teleamazonas",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
  },
  ecu911: {
    name: "ECU 911",
    color: "text-green-700",
    bgColor: "bg-green-50",
  },
};

/**
 * Componente NewsPreview
 *
 * Muestra una vista previa de una noticia con título, snippet de contenido,
 * badge de fuente y modal para ver el contenido completo.
 *
 * @example
 * ```tsx
 * <NewsPreview
 *   title="Banco Central ajusta tasas"
 *   content="El Banco Central del Ecuador anunció..."
 *   url="https://www.primicias.ec/economia/..."
 *   source="primicias"
 * />
 * ```
 */
export function NewsPreview({
  title,
  content,
  url,
  source,
  className,
}: NewsPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = SOURCE_CONFIG[source];

  // Crear snippet de contenido (primeras 150 caracteres)
  const snippet =
    content.length > 150 ? `${content.substring(0, 150)}...` : content;

  return (
    <div
      className={cn(
        "news-preview rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow",
        className
      )}
    >
      {/* Header con badge de fuente */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Badge
          variant="outline"
          className={cn(
            "font-medium border-0",
            config.color,
            config.bgColor
          )}
        >
          {config.name}
        </Badge>
        {url && (
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Abrir noticia original"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Título */}
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {title}
      </h4>

      {/* Snippet de contenido */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{snippet}</p>

      {/* Botón "Ver más" con modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Ver más
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={cn(
                  "font-medium border-0",
                  config.color,
                  config.bgColor
                )}
              >
                {config.name}
              </Badge>
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              Contenido completo de la noticia de {config.name}
            </DialogDescription>
          </DialogHeader>

          {/* Contenido completo */}
          <div className="mt-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>

          {/* Link a noticia original */}
          {url && (
            <div className="mt-6 pt-4 border-t">
              <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Ver noticia original
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Helper para obtener la configuración de una fuente
 */
export function getSourceConfig(source: NewsSource) {
  return SOURCE_CONFIG[source];
}

/**
 * Helper para obtener todas las fuentes
 */
export function getAllSources(): NewsSource[] {
  return Object.keys(SOURCE_CONFIG) as NewsSource[];
}
