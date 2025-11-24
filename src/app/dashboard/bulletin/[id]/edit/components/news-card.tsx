"use client";

/**
 * Tarjeta de Noticia Individual
 * Muestra una noticia con checkbox para seleccionar/deseleccionar
 */

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import type { BulletinNews } from "@/lib/schema";
import Image from "next/image";

/**
 * Configuración de colores por categoría
 */
const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  economia: {
    bg: "bg-emerald-100 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-700",
    label: "Economía",
  },
  politica: {
    bg: "bg-blue-100 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
    label: "Política",
  },
  sociedad: {
    bg: "bg-purple-100 dark:bg-purple-950",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
    label: "Sociedad",
  },
  seguridad: {
    bg: "bg-red-100 dark:bg-red-950",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-300 dark:border-red-700",
    label: "Seguridad",
  },
  internacional: {
    bg: "bg-orange-100 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-300 dark:border-orange-700",
    label: "Internacional",
  },
  vial: {
    bg: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
    label: "Vial",
  },
};

interface NewsCardProps {
  article: BulletinNews;
  onToggle: () => void;
}

export function NewsCard({ article, onToggle }: NewsCardProps) {
  // Obtener configuración de color para la categoría
  const categoryConfig = article.category
    ? CATEGORY_COLORS[article.category]
    : null;

  return (
    <Card
      className={`transition-all ${
        article.selected
          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
          : "opacity-60 hover:opacity-80"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <Checkbox
              checked={article.selected}
              onCheckedChange={onToggle}
              id={`news-${article.id}`}
            />
          </div>

          {/* Imagen */}
          {article.imageUrl && (
            <div className="flex-shrink-0">
              <div className="relative w-32 h-24 rounded-md overflow-hidden bg-muted">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Si la imagen falla, ocultar el contenedor
                    e.currentTarget.parentElement!.style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          {/* Contenido */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Título con badge de categoría */}
            <div className="flex items-start gap-2">
              <label
                htmlFor={`news-${article.id}`}
                className="block cursor-pointer flex-1"
              >
                <h3 className="font-semibold text-base line-clamp-2 hover:text-primary">
                  {article.title}
                </h3>
              </label>

              {/* Badge de Categoría */}
              {categoryConfig && (
                <Badge
                  className={`${categoryConfig.bg} ${categoryConfig.text} ${categoryConfig.border} border font-semibold flex-shrink-0`}
                  variant="outline"
                >
                  {categoryConfig.label}
                </Badge>
              )}
            </div>

            {/* Contenido/Resumen */}
            {article.content && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.content}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {article.source}
              </Badge>

              {article.scrapedAt && (
                <span>
                  {new Date(article.scrapedAt).toLocaleString("es-EC", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              )}

              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver original
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {article.imageUrl && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Con imagen
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
