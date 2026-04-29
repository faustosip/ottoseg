"use client";

/**
 * Tarjeta de Noticia Individual
 * Muestra una noticia con checkbox para seleccionar/deseleccionar
 */

import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import type { BulletinNews } from "@/lib/schema";
import Image from "next/image";
import { visualFor } from "@/lib/categories/visuals";

interface NewsCardProps {
  article: BulletinNews;
  onToggle?: () => void;
}

export function NewsCard({ article, onToggle }: NewsCardProps) {
  const visual = article.category ? visualFor(article.category) : null;
  const categoryLabel = article.category
    ? article.category.charAt(0).toUpperCase() + article.category.slice(1)
    : null;

  return (
    <div
      className="rounded-[12px] border transition-all"
      style={{
        background: article.selected
          ? "var(--otto-primary-soft)"
          : "var(--otto-surface)",
        borderColor: article.selected
          ? "var(--otto-primary)"
          : "var(--otto-rule)",
        opacity: article.selected ? 1 : 0.85,
      }}
    >
      <div className="flex gap-4 p-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-1">
          <Checkbox
            checked={article.selected}
            onCheckedChange={onToggle}
            id={`news-${article.id}`}
            className="data-[state=checked]:bg-[var(--otto-primary)] data-[state=checked]:border-[var(--otto-primary)]"
          />
        </div>

        {/* Imagen */}
        {article.imageUrl && (
          <div className="flex-shrink-0">
            <div
              className="relative h-24 w-32 overflow-hidden rounded-[8px]"
              style={{ background: "var(--otto-rule-2)" }}
            >
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.parentElement!.style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Título con badge de categoría */}
          <div className="flex items-start gap-3">
            <label
              htmlFor={`news-${article.id}`}
              className="block flex-1 cursor-pointer"
            >
              <h3
                className="font-display line-clamp-2 m-0 text-[15px] font-semibold leading-[1.3]"
                style={{
                  letterSpacing: "-.2px",
                  color: "var(--otto-ink)",
                }}
              >
                {article.title}
              </h3>
            </label>

            {/* Badge de categoría */}
            {visual && categoryLabel && (
              <span
                className="font-mono-otto flex-shrink-0 rounded-[5px] px-2 py-1"
                style={{
                  fontSize: "9px",
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  background: visual.color,
                  color: "#fff",
                }}
              >
                {categoryLabel}
              </span>
            )}
          </div>

          {/* Contenido/Resumen */}
          {article.content && (
            <p
              className="line-clamp-2 m-0 text-[13px] leading-[1.45]"
              style={{ color: "var(--otto-muted)" }}
            >
              {article.content}
            </p>
          )}

          {/* Metadata */}
          <div
            className="font-mono-otto flex flex-wrap items-center gap-3"
            style={{
              fontSize: "10px",
              letterSpacing: ".06em",
              textTransform: "none",
              color: "var(--otto-muted)",
              fontWeight: 500,
            }}
          >
            <span
              className="rounded-[5px] px-2 py-0.5"
              style={{
                background: "var(--otto-rule-2)",
                color: "var(--otto-ink-2)",
                fontWeight: 600,
              }}
            >
              {article.source}
            </span>

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
                className="flex items-center gap-1 hover:underline"
                style={{ color: "var(--otto-primary)" }}
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
    </div>
  );
}
