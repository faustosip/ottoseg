"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MODERN_DESIGN } from "@/lib/bulletin/design-system";
import type { BulletinData, CategoryData } from "./classic-bulletin-layout";
import { stripSpamTail } from "@/lib/bulletin/content-sanitizer";

const OTTO_RED = "#d62828";
const OTTO_RED_INK = "#7a1414";
const OTTO_RED_SOFT = "#fde2e2";

function getDomain(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function readingTime(text?: string): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

/**
 * Props para ModernBulletinLayout
 */
export interface ModernBulletinLayoutProps {
  bulletin: BulletinData;
  editable?: boolean;
}

/**
 * Formatea una fecha al formato moderno compacto
 * Ejemplo: "11 de Noviembre, 2025"
 */
function formatModernDate(date: Date): string {
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

  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${monthName}, ${year}`;
}

/**
 * Configuración de categorías con claves y nombres
 */
const CATEGORIES = [
  { key: "economia" as const, name: "Economía" },
  { key: "politica" as const, name: "Política" },
  { key: "sociedad" as const, name: "Sociedad" },
  { key: "seguridad" as const, name: "Seguridad" },
  { key: "internacional" as const, name: "Internacional" },
  { key: "vial" as const, name: "Vial" },
];

/**
 * Verifica si una URL parece ser de una imagen válida
 */
function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  const allowedImageDomains = [
    'supa.ottoseguridadai.com',
    'minback.ottoseguridadai.com',
    'images.unsplash.com',
  ];

  try {
    const urlObj = new URL(url);
    if (allowedImageDomains.some(domain => urlObj.hostname.includes(domain))) {
      return true;
    }
  } catch {
    return false;
  }

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const urlLower = url.toLowerCase();
  if (imageExtensions.some(ext => urlLower.includes(ext))) {
    return true;
  }

  if (url.includes('/storage/')) {
    return true;
  }

  const blockedDomains = ['google.com/maps', 'maps.google', 'waze.com'];
  if (blockedDomains.some(domain => url.includes(domain))) {
    return false;
  }

  return false;
}

/**
 * Componente de Badge de Categoría
 */
interface CategoryBadgeProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  hasContent: boolean;
  count?: number;
}

function CategoryBadge({
  name,
  isActive,
  onClick,
  hasContent,
  count,
}: CategoryBadgeProps) {
  if (!hasContent) return null;

  return (
    <button
      onClick={onClick}
      className={`modern-category-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
        isActive
          ? "text-white shadow-md"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
      style={{
        fontFamily: MODERN_DESIGN.typography.fontFamily.body,
        background: isActive ? OTTO_RED : undefined,
        boxShadow: isActive ? "0 4px 14px rgba(214,40,40,.28)" : undefined,
      }}
    >
      {name}
      {typeof count === "number" ? (
        <span
          className="inline-flex items-center justify-center rounded-full px-1.5"
          style={{
            fontFamily:
              "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSize: "10px",
            letterSpacing: ".04em",
            background: isActive ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.06)",
            color: isActive ? "#fff" : "#6c6c72",
            minWidth: "20px",
            height: "18px",
          }}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

/**
 * Componente de Card de Noticia Individual
 */
interface NewsItemCardProps {
  categoryName: string;
  newsItem: {
    title: string;
    content: string;
    fullContent?: string;
    url?: string;
    source?: string;
    imageUrl?: string;
  };
}

function NewsItemCard({
  categoryName,
  newsItem,
  rank,
  featured,
}: NewsItemCardProps & { rank?: number; featured?: boolean }) {
  const rawText = newsItem.fullContent || newsItem.content || "";
  const text = stripSpamTail(rawText);
  const minutes = readingTime(text);
  const domain = getDomain(newsItem.url);
  const imageUrl = (newsItem as { imageUrl?: string }).imageUrl;

  return (
    <article
      className={`modern-news-card group relative overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-1 ${
        featured ? "md:col-span-2 lg:col-span-2" : ""
      }`}
      style={{
        borderColor: "#e6e5e1",
        boxShadow:
          "0 1px 2px rgba(14,14,16,.04), 0 4px 14px rgba(14,14,16,.04)",
      }}
    >
      {/* Imagen */}
      {imageUrl ? (
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: featured ? "21 / 9" : "16 / 9",
            background: "#f5f5f5",
          }}
        >
          <Image
            src={imageUrl}
            alt={newsItem.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement).style.display =
                "none";
            }}
          />
          {/* Ranking badge */}
          {typeof rank === "number" ? (
            <div
              className="absolute left-3 top-3 inline-flex items-center justify-center rounded-full text-white"
              style={{
                width: "28px",
                height: "28px",
                background: "rgba(14,14,16,.78)",
                backdropFilter: "blur(4px)",
                fontFamily:
                  "var(--font-jetbrains-mono), ui-monospace, monospace",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: ".04em",
              }}
            >
              {String(rank).padStart(2, "0")}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Contenido textual */}
      <div className="p-5">
        {/* Meta line: categoría · fuente · tiempo */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{
              background: OTTO_RED_SOFT,
              color: OTTO_RED_INK,
              letterSpacing: ".08em",
            }}
          >
            {categoryName}
          </span>
          <span
            className="text-[11px]"
            style={{
              fontFamily:
                "var(--font-jetbrains-mono), ui-monospace, monospace",
              color: "#6c6c72",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {domain ?? newsItem.source ?? "Otto"}
          </span>
          <span
            className="text-[11px]"
            style={{
              fontFamily:
                "var(--font-jetbrains-mono), ui-monospace, monospace",
              color: "#a0a0a8",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            · {minutes} min
          </span>
        </div>

        {/* Título */}
        <h3
          className={`modern-news-title m-0 mb-2 font-bold transition-colors group-hover:text-[var(--otto-primary)] ${
            featured ? "line-clamp-2 text-[24px]" : "line-clamp-2 text-[19px]"
          }`}
          style={{
            fontFamily: MODERN_DESIGN.typography.fontFamily.heading,
            color: "#0e0e10",
            letterSpacing: "-.4px",
            lineHeight: 1.25,
          }}
        >
          {newsItem.title}
        </h3>

        {/* Excerpt */}
        <p
          className={`modern-news-summary m-0 ${featured ? "line-clamp-3" : "line-clamp-2"}`}
          style={{
            fontFamily: MODERN_DESIGN.typography.fontFamily.body,
            color: "#3c3c40",
            fontSize: "13.5px",
            lineHeight: 1.55,
            marginBottom: "14px",
          }}
        >
          {text}
        </p>

        {/* CTA */}
        {newsItem.url && (
          <Link
            href={newsItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="modern-read-more inline-flex items-center gap-1.5 text-[12.5px] font-bold transition-all"
            style={{ color: OTTO_RED, letterSpacing: ".02em" }}
          >
            Leer nota completa
            <svg
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        )}
      </div>
    </article>
  );
}

/**
 * Componente de Card de Noticia (para compatibilidad con formato antiguo)
 */
interface NewsCardProps {
  categoryName: string;
  data: CategoryData;
  roadClosureMapUrl?: string | null;
}

function NewsCard({ categoryName, data, roadClosureMapUrl }: NewsCardProps) {
  // Si hay noticias individuales, renderizar cada una
  if (data.news && data.news.length > 0) {
    return (
      <>
        {data.news.map((newsItem, index) => (
          <NewsItemCard
            key={`${categoryName}-${index}`}
            categoryName={categoryName}
            newsItem={newsItem}
            rank={index + 1}
            featured={index === 0}
          />
        ))}
        {/* Imagen del mapa de cierres viales */}
        {roadClosureMapUrl && isImageUrl(roadClosureMapUrl) && (
          <article className="modern-news-card bg-white rounded-xl shadow-sm overflow-hidden col-span-full">
            <div className="p-6">
              <h3
                className="text-xl font-bold mb-4 text-center"
                style={{ color: MODERN_DESIGN.colors.primary }}
              >
                Mapa de Cierres Viales
              </h3>
              <div className="flex justify-center">
                <Image
                  src={roadClosureMapUrl}
                  alt="Mapa de Cierres Viales"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg"
                  style={{ maxWidth: "600px", objectFit: "contain" }}
                />
              </div>
            </div>
          </article>
        )}
      </>
    );
  }

  // Fallback: renderizar como antes si solo hay summary
  return (
    <article className="modern-news-card bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group hover:-translate-y-1">
      {/* Badge de categoría */}
      <div className="px-6 pt-6">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: "#eff6ff",
            color: MODERN_DESIGN.colors.primary,
          }}
        >
          {categoryName}
        </span>
      </div>

      {/* Contenido textual */}
      <div className="p-6">
        {/* Título */}
        {data.title && (
          <h3
            className="modern-news-title text-2xl font-bold mb-3 line-clamp-2"
            style={{
              fontFamily: MODERN_DESIGN.typography.fontFamily.heading,
              color: MODERN_DESIGN.colors.primary,
            }}
          >
            {data.title}
          </h3>
        )}

        {/* Resumen */}
        {data.summary && (
          <p
            className="modern-news-summary text-base leading-relaxed mb-4 line-clamp-3"
            style={{
              fontFamily: MODERN_DESIGN.typography.fontFamily.body,
              color: "#1f2937",
            }}
          >
            {data.summary}
          </p>
        )}

        {/* Imagen del mapa de cierres viales (cuando no hay noticias individuales) */}
        {roadClosureMapUrl && isImageUrl(roadClosureMapUrl) && (
          <div className="mt-4">
            <h4
              className="text-lg font-bold mb-3 text-center"
              style={{ color: MODERN_DESIGN.colors.primary }}
            >
              Mapa de Cierres Viales
            </h4>
            <div className="flex justify-center">
              <Image
                src={roadClosureMapUrl}
                alt="Mapa de Cierres Viales"
                width={400}
                height={300}
                className="w-full h-auto rounded-lg"
                style={{ maxWidth: "400px", objectFit: "contain" }}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Componente ModernBulletinLayout
 *
 * Diseño web moderno y responsive para el boletín de noticias.
 * Optimizado para usuarios que prefieren interfaces contemporáneas.
 *
 * Características:
 * - Header con gradiente azul
 * - Navegación por pestañas de categorías
 * - Cards con sombras y efectos hover
 * - Grid responsive (ajusta automáticamente)
 * - Animaciones suaves
 * - Tipografía compacta y moderna
 * - Border-radius en todos los elementos
 *
 * @example
 * ```tsx
 * <ModernBulletinLayout bulletin={bulletinData} />
 * ```
 */
export function ModernBulletinLayout({
  bulletin,
  editable: _editable = false,
}: ModernBulletinLayoutProps) {
  const formattedDate = formatModernDate(bulletin.date);

  // Estado para la categoría activa (null = todas)
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filtrar categorías con contenido
  const categoriesWithContent = CATEGORIES.filter((category) => {
    const data = bulletin[category.key];
    return data && (data.summary || (data.news && data.news.length > 0));
  });

  // Stats agregados
  const totalNews = categoriesWithContent.reduce((acc, cat) => {
    const d = bulletin[cat.key];
    return acc + (d?.news?.length ?? (d?.summary ? 1 : 0));
  }, 0);

  const totalReadingTime = categoriesWithContent.reduce((acc, cat) => {
    const d = bulletin[cat.key];
    if (d?.news && d.news.length > 0) {
      return (
        acc +
        d.news.reduce(
          (a, n) => a + readingTime(n.content || ""),
          0,
        )
      );
    }
    if (d?.summary) return acc + readingTime(d.summary);
    return acc;
  }, 0);

  // Conteo por categoría para los pills
  const countByCategory: Record<string, number> = {};
  categoriesWithContent.forEach((cat) => {
    const d = bulletin[cat.key];
    countByCategory[cat.key] =
      d?.news?.length ?? (d?.summary ? 1 : 0);
  });

  // Obtener noticias filtradas
  const filteredNews = activeCategory
    ? CATEGORIES.filter((cat) => cat.key === activeCategory)
    : categoriesWithContent;

  return (
    <div
      className="modern-bulletin w-full mx-auto px-6 py-8 animate-fadeIn"
      style={{
        maxWidth: MODERN_DESIGN.layout.maxWidth,
        fontFamily: MODERN_DESIGN.typography.fontFamily.body,
        backgroundColor: MODERN_DESIGN.colors.background,
      }}
    >
      {/* HEADER — fondo negro institucional con destello rojo */}
      <header
        className="modern-header relative mb-8 overflow-hidden rounded-2xl px-8 py-14 text-left"
        style={{
          background: "linear-gradient(135deg, #0e0e10 0%, #1d1d20 100%)",
        }}
      >
        {/* Glow rojo radial */}
        <div
          aria-hidden
          className="absolute -right-[120px] -top-[120px] h-[360px] w-[360px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, #d62828 0%, transparent 65%)",
            opacity: 0.55,
          }}
        />

        {/* Patrón de grid sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10">
          {/* Tag editorial */}
          <div
            className="mb-3 inline-flex items-center gap-2"
            style={{
              fontFamily:
                "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "10px",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "#fbcdcd",
            }}
          >
            <span
              aria-hidden
              style={{
                width: "8px",
                height: "8px",
                background: "#d62828",
                transform: "rotate(45deg)",
                display: "inline-block",
              }}
            />
            Edición · {formattedDate}
          </div>

          {/* Título principal */}
          <h1
            className="modern-title m-0 mb-2 font-bold text-white"
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              letterSpacing: "-1.4px",
              lineHeight: 1.05,
            }}
          >
            Resumen Diario de Noticias
          </h1>

          {/* Subtítulo */}
          <p
            className="modern-date m-0 mb-5 max-w-[480px] text-[14px] leading-[1.55]"
            style={{
              color: "#bdbdc4",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            }}
          >
            Lo más relevante de Ecuador y el mundo, curado por OttoSeguridad.
          </p>

          {/* Stats line */}
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            style={{
              fontFamily:
                "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "10px",
              letterSpacing: ".14em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "#7c7c83",
            }}
          >
            <div className="inline-flex items-baseline gap-1.5">
              <span
                style={{
                  fontFamily:
                    "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-.5px",
                  textTransform: "none",
                }}
              >
                {totalNews}
              </span>
              <span>notas</span>
            </div>
            <span style={{ color: "rgba(255,255,255,.18)" }}>·</span>
            <div className="inline-flex items-baseline gap-1.5">
              <span
                style={{
                  fontFamily:
                    "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-.5px",
                  textTransform: "none",
                }}
              >
                {categoriesWithContent.length}
              </span>
              <span>secciones</span>
            </div>
            <span style={{ color: "rgba(255,255,255,.18)" }}>·</span>
            <div className="inline-flex items-baseline gap-1.5">
              <span
                style={{
                  fontFamily:
                    "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-.5px",
                  textTransform: "none",
                }}
              >
                ~{totalReadingTime}
              </span>
              <span>min lectura</span>
            </div>
          </div>
        </div>
      </header>

      {/* NAVEGACIÓN DE CATEGORÍAS */}
      <nav
        className="modern-category-nav mb-8 overflow-x-auto pb-2"
        aria-label="Navegación de categorías"
      >
        <div className="flex gap-3 min-w-max">
          {/* Badge "Todas" */}
          <button
            onClick={() => setActiveCategory(null)}
            className={`modern-category-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              activeCategory === null
                ? "text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            style={{
              fontFamily: MODERN_DESIGN.typography.fontFamily.body,
              background: activeCategory === null ? OTTO_RED : undefined,
              boxShadow:
                activeCategory === null
                  ? "0 4px 14px rgba(214,40,40,.28)"
                  : undefined,
            }}
          >
            Todas
            <span
              className="inline-flex items-center justify-center rounded-full px-1.5"
              style={{
                fontFamily:
                  "var(--font-jetbrains-mono), ui-monospace, monospace",
                fontSize: "10px",
                letterSpacing: ".04em",
                background:
                  activeCategory === null
                    ? "rgba(255,255,255,.2)"
                    : "rgba(0,0,0,.06)",
                color: activeCategory === null ? "#fff" : "#6c6c72",
                minWidth: "20px",
                height: "18px",
              }}
            >
              {totalNews}
            </span>
          </button>

          {/* Badges de categorías */}
          {CATEGORIES.map((category) => {
            const data = bulletin[category.key];
            const hasContent = data && (data.summary || (data.news && data.news.length > 0));
            return (
              <CategoryBadge
                key={category.key}
                name={category.name}
                isActive={activeCategory === category.key}
                onClick={() => setActiveCategory(category.key)}
                hasContent={!!hasContent}
                count={countByCategory[category.key]}
              />
            );
          })}
        </div>
      </nav>

      {/* GRID DE NOTICIAS */}
      <main className="modern-news-grid">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((category) => {
            const data = bulletin[category.key];
            if (!data || (!data.summary && (!data.news || data.news.length === 0))) return null;

            return (
              <NewsCard
                key={category.key}
                categoryName={category.name}
                data={data}
                roadClosureMapUrl={category.key === "vial" ? bulletin.roadClosureMapUrl : undefined}
              />
            );
          })}
        </div>

        {/* Mensaje si no hay noticias */}
        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay noticias disponibles en esta categoría.
            </p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer
        className="modern-footer mt-12 pt-8 text-center"
        style={{ borderTop: "1px solid #e6e5e1" }}
      >
        <div className="flex justify-center">
          <div
            className="flex h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-[10px]"
            style={{ background: "#000" }}
          >
            <Image
              src="/logos/buho-seguridad.png"
              alt="OttoSeguridad"
              width={88}
              height={48}
              className="h-auto w-[40px] object-contain"
            />
          </div>
        </div>
        <div
          className="mt-3"
          style={{
            fontFamily:
              "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "14px",
            fontWeight: 700,
            color: "#0e0e10",
            letterSpacing: "-.2px",
          }}
        >
          OttoSeguridad
        </div>
        <div
          className="mt-1"
          style={{
            fontFamily:
              "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSize: "10px",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "#6c6c72",
          }}
        >
          Resumen Diario · {formattedDate}
        </div>
        <div
          className="mt-3 pb-2"
          style={{
            fontFamily:
              "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSize: "9px",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "#a0a0a8",
          }}
        >
          Inteligencia · Análisis · Curaduría
        </div>
      </footer>

      {/* ESTILOS ADICIONALES */}
      <style jsx>{`
        /* Animación de fade-in */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        /* Scrollbar personalizado para navegación */
        .modern-category-nav {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }

        .modern-category-nav::-webkit-scrollbar {
          height: 6px;
        }

        .modern-category-nav::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 3px;
        }

        .modern-category-nav::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }

        .modern-category-nav::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }

        /* Line clamp utilities */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Responsive adjustments */
        @media (max-width: 1023px) {
          .modern-title {
            font-size: 36px !important;
          }

          .modern-news-title {
            font-size: 22px !important;
          }

          .modern-news-summary {
            font-size: 15px !important;
          }
        }

        @media (max-width: 767px) {
          .modern-header {
            padding: 32px 24px !important;
            border-radius: 12px !important;
          }

          .modern-title {
            font-size: 28px !important;
          }

          .modern-date {
            font-size: 13px !important;
          }

          .modern-category-badge {
            font-size: 13px !important;
            padding: 6px 12px !important;
          }

          .modern-news-title {
            font-size: 20px !important;
          }

          .modern-news-summary {
            font-size: 14px !important;
          }

          .modern-card-image {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
