"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MODERN_DESIGN } from "@/lib/bulletin/design-system";
import type { BulletinData, CategoryData } from "./classic-bulletin-layout";

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
 * Componente de Badge de Categoría
 */
interface CategoryBadgeProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  hasContent: boolean;
}

function CategoryBadge({
  name,
  isActive,
  onClick,
  hasContent,
}: CategoryBadgeProps) {
  if (!hasContent) return null;

  return (
    <button
      onClick={onClick}
      className={`
        modern-category-badge px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap
        ${
          isActive
            ? "bg-[#004aad] text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }
      `}
      style={{
        fontFamily: MODERN_DESIGN.typography.fontFamily.body,
      }}
    >
      {name}
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
    url?: string;
    source?: string;
  };
}

function NewsItemCard({ categoryName, newsItem }: NewsItemCardProps) {
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
        {newsItem.source && (
          <span className="ml-2 text-xs text-gray-500">
            • {newsItem.source}
          </span>
        )}
      </div>

      {/* Contenido textual */}
      <div className="p-6">
        {/* Título */}
        <h3
          className="modern-news-title text-2xl font-bold mb-3 line-clamp-2"
          style={{
            fontFamily: MODERN_DESIGN.typography.fontFamily.heading,
            color: MODERN_DESIGN.colors.primary,
          }}
        >
          {newsItem.title}
        </h3>

        {/* Contenido */}
        <p
          className="modern-news-summary text-base leading-relaxed mb-4 line-clamp-3"
          style={{
            fontFamily: MODERN_DESIGN.typography.fontFamily.body,
            color: "#1f2937",
          }}
        >
          {newsItem.content}
        </p>

        {/* Link "Leer más" */}
        {newsItem.url && (
          <Link
            href={newsItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="modern-read-more inline-flex items-center gap-2 text-sm font-semibold hover:underline"
            style={{ color: MODERN_DESIGN.colors.secondary }}
          >
            Leer más
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
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
}

function NewsCard({ categoryName, data }: NewsCardProps) {
  // Si hay noticias individuales, renderizar cada una
  if (data.news && data.news.length > 0) {
    return (
      <>
        {data.news.map((newsItem, index) => (
          <NewsItemCard
            key={`${categoryName}-${index}`}
            categoryName={categoryName}
            newsItem={newsItem}
          />
        ))}
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
      {/* HEADER CON GRADIENTE */}
      <header
        className="modern-header relative rounded-2xl px-6 py-12 mb-8 text-center"
        style={{
          background: "linear-gradient(135deg, #004aad 0%, #1a62ff 100%)",
        }}
      >
        {/* Título principal */}
        <h1
          className="modern-title text-5xl font-bold text-white mb-3"
          style={{
            fontFamily: MODERN_DESIGN.typography.fontFamily.heading,
            fontSize: MODERN_DESIGN.typography.sizes.mainTitle,
          }}
        >
          Resumen Diario de Noticias
        </h1>

        {/* Fecha */}
        <p
          className="modern-date text-white"
          style={{
            opacity: 0.9,
            fontSize: MODERN_DESIGN.typography.sizes.date,
            fontFamily: MODERN_DESIGN.typography.fontFamily.body,
          }}
        >
          {formattedDate}
        </p>
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
            className={`
              modern-category-badge px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap
              ${
                activeCategory === null
                  ? "bg-[#004aad] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
            style={{
              fontFamily: MODERN_DESIGN.typography.fontFamily.body,
            }}
          >
            Todas
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
      <footer className="modern-footer mt-12 pt-8 border-t border-gray-200">
        {/* Logo corporativo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/bulletin-assets/modern/logo.png"
            alt="OttoSeguridad Logo"
            width={100}
            height={60}
            className="modern-logo max-h-16 w-auto"
            style={{ objectFit: "contain" }}
            // Fallback si no hay logo
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        </div>

        {/* Texto de copyright */}
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} OttoSeguridad. Todos los derechos
          reservados.
        </p>
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
