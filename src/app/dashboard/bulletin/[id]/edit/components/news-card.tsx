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

interface NewsCardProps {
  article: BulletinNews;
  onToggle: () => void;
}

export function NewsCard({ article, onToggle }: NewsCardProps) {
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
            {/* Título */}
            <label
              htmlFor={`news-${article.id}`}
              className="block cursor-pointer"
            >
              <h3 className="font-semibold text-base line-clamp-2 hover:text-primary">
                {article.title}
              </h3>
            </label>

            {/* Contenido/Resumen */}
            {article.content && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.content}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
