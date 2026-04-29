"use client";

import Image from "next/image";
import Link from "next/link";
import { CLASSIC_DESIGN } from "@/lib/bulletin/design-system";

/**
 * Datos de una categoría de noticias
 */
export interface CategoryData {
  title: string;
  summary: string;
  imageUrl?: string;
  sourceUrl?: string;
  news?: Array<{
    title: string;
    content: string;
    url?: string;
    source?: string;
  }>;
}

/**
 * Datos completos del boletín
 */
export interface BulletinData {
  date: Date;
  economia?: CategoryData;
  politica?: CategoryData;
  sociedad?: CategoryData;
  seguridad?: CategoryData;
  internacional?: CategoryData;
  vial?: CategoryData;
  roadClosureMapUrl?: string | null;
}

/**
 * Props para ClassicBulletinLayout
 */
export interface ClassicBulletinLayoutProps {
  bulletin: BulletinData;
  editable?: boolean;
}

/**
 * Formatea una fecha al formato español completo
 * Ejemplo: "Martes 11 de Noviembre de 2025"
 */
function formatClassicDate(date: Date): string {
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
  const year = date.getFullYear();

  return `${dayName} ${day} de ${monthName} de ${year}`;
}

/**
 * Configuración de categorías con números y nombres
 */
const CATEGORIES = [
  { number: 1, key: "economia" as const, name: "Economía" },
  { number: 2, key: "politica" as const, name: "Política" },
  { number: 3, key: "sociedad" as const, name: "Sociedad" },
  { number: 4, key: "seguridad" as const, name: "Seguridad" },
  { number: 5, key: "internacional" as const, name: "Internacional" },
  { number: 6, key: "vial" as const, name: "Vial" },
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
 * Componente Separador Horizontal
 */
function ClassicSeparator() {
  return (
    <div
      aria-hidden
      className="my-6 flex items-center justify-center gap-2"
      style={{ color: "#c9c9c9" }}
    >
      <span
        style={{
          flex: 1,
          height: "1px",
          background: "var(--otto-rule)",
        }}
      />
      <span
        style={{
          fontFamily:
            "var(--font-jetbrains-mono), ui-monospace, monospace",
          fontSize: "10px",
          letterSpacing: ".4em",
          color: "#a0a0a8",
        }}
      >
        · · ·
      </span>
      <span
        style={{
          flex: 1,
          height: "1px",
          background: "var(--otto-rule)",
        }}
      />
    </div>
  );
}

/**
 * Componente de Sección de Categoría
 */
interface CategorySectionProps {
  number: number;
  categoryName: string;
  data?: CategoryData;
  roadClosureMapUrl?: string | null;
}

function CategorySection({ number, categoryName, data, roadClosureMapUrl }: CategorySectionProps) {
  // Si no hay datos, no mostrar la sección
  if (!data || !data.summary) {
    return null;
  }

  // Obtener la primera noticia con imagen si existe
  const newsWithImage = data.news?.find((n) => n.url);
  const firstNewsTitle = newsWithImage?.title || data.title;
  const firstNewsUrl = newsWithImage?.url;
  const firstNewsImageUrl = data.imageUrl; // Ya viene del CategoryData

  return (
    <section className="classic-section mb-10">
      {/* Tag editorial — categoría · número */}
      <div
        className="mb-2 flex items-center gap-2"
        style={{
          fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
          fontSize: "10px",
          letterSpacing: ".18em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: "rgb(214, 40, 40)",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "20px",
            height: "2px",
            background: "rgb(214, 40, 40)",
          }}
        />
        {categoryName} · {String(number).padStart(2, "0")}
      </div>

      {/* Título de categoría */}
      <h2
        className="classic-section-title text-[22px] leading-[1.2] mb-4"
        style={{
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 700,
          color: "#0e0e10",
          letterSpacing: "-.5px",
        }}
      >
        {categoryName}
      </h2>

      {/* Título de la noticia */}
      {firstNewsTitle && (
        <h3
          className="classic-news-title text-[18px] leading-[1.35] mb-3"
          style={{
            fontWeight: 700,
            color: "rgb(214, 40, 40)",
          }}
        >
          {firstNewsTitle}
        </h3>
      )}

      {/* Imagen */}
      {firstNewsImageUrl && (
        <div className="classic-news-image-container my-4">
          <Image
            src={firstNewsImageUrl}
            alt={firstNewsTitle || categoryName}
            width={455}
            height={256}
            className="classic-news-image h-auto w-full rounded-[8px]"
            style={{
              maxWidth: "455px",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      {/* Contenido del resumen */}
      <div
        className="classic-news-content text-[15px] leading-[1.6] text-justify mt-3"
        style={{
          fontWeight: 400,
          color: "#1a1a1a",
        }}
      >
        {data.summary}
      </div>

      {/* Imagen del mapa de cierres viales (solo para categoría Vial) */}
      {roadClosureMapUrl && isImageUrl(roadClosureMapUrl) && (
        <div className="my-4">
          <h4
            className="mb-2.5 text-[15px] leading-[1.4]"
            style={{
              fontWeight: 700,
              color: "rgb(214, 40, 40)",
            }}
          >
            Mapa de cierres viales
          </h4>
          <div className="classic-news-image-container">
            <Image
              src={roadClosureMapUrl}
              alt="Mapa de Cierres Viales"
              width={455}
              height={400}
              className="classic-news-image h-auto w-full rounded-[8px]"
              style={{
                maxWidth: "455px",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      )}

      {/* Link "Leer más" */}
      {firstNewsUrl && (
        <div className="mt-3 text-right">
          <Link
            href={firstNewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="classic-link inline-flex items-center gap-1 text-[14px] hover:underline"
            style={{
              fontWeight: 700,
              color: "rgb(214, 40, 40)",
            }}
          >
            Leer más →
          </Link>
        </div>
      )}
    </section>
  );
}

/**
 * Componente ClassicBulletinLayout
 *
 * Replica exactamente el diseño HTML clásico tradicional del boletín.
 * Optimizado para audiencia mayor familiarizada con este formato.
 *
 * Características:
 * - Header con imagen decorativa de fondo
 * - Título "RESUMEN DIARIO DE NOTICIAS" centrado
 * - Fecha en formato español completo
 * - 6 secciones numeradas con títulos subrayados
 * - Separadores horizontales grises
 * - Imágenes centradas
 * - Texto justificado con tipografía grande
 * - Footer con logo corporativo
 *
 * @example
 * ```tsx
 * <ClassicBulletinLayout bulletin={bulletinData} />
 * ```
 */
export function ClassicBulletinLayout({
  bulletin,
  editable: _editable = false,
}: ClassicBulletinLayoutProps) {
  const formattedDate = formatClassicDate(bulletin.date);

  return (
    <div
      className="classic-bulletin w-full mx-auto px-0"
      style={{
        maxWidth: CLASSIC_DESIGN.layout.maxWidth,
        fontFamily: CLASSIC_DESIGN.typography.fontFamily.body,
        backgroundColor: CLASSIC_DESIGN.colors.background,
      }}
    >
      {/* HEADER */}
      <header className="classic-header relative w-full">
        {/* Banner Image */}
        <div
          className="w-full overflow-hidden"
          style={{ maxHeight: "180px" }}
        >
          <Image
            src="/banner.png"
            alt="Resumen Diario de Noticias"
            width={1920}
            height={485}
            className="h-auto w-full object-cover"
            style={{ maxHeight: "180px" }}
            priority
          />
        </div>

        {/* Título y fecha sobre fondo blanco */}
        <div className="bg-white py-6">
          {/* Título principal */}
          <h1
            className="classic-title text-center px-4 text-[24px]"
            style={{
              fontWeight: 700,
              color: "#000000",
              letterSpacing: "0.5px",
            }}
          >
            RESUMEN DIARIO DE NOTICIAS
          </h1>

          {/* Fecha */}
          <p
            className="classic-date text-center mt-2 px-4 text-[15px]"
            style={{
              fontWeight: 400,
              color: "#4a4a4a",
            }}
          >
            {formattedDate}
          </p>
        </div>
      </header>

      {/* Separador después del header */}
      <ClassicSeparator />

      {/* CONTENIDO - Secciones de categorías */}
      <main
        className="classic-content"
        style={{ padding: `0 ${CLASSIC_DESIGN.layout.containerPadding}` }}
      >
        {CATEGORIES.map((category, index) => {
          const categoryData = bulletin[category.key];

          return (
            <div key={category.key}>
              <CategorySection
                number={category.number}
                categoryName={category.name}
                data={categoryData}
                roadClosureMapUrl={category.key === "vial" ? bulletin.roadClosureMapUrl : undefined}
              />

              {/* Separador entre secciones (excepto después de la última) */}
              {categoryData &&
                categoryData.summary &&
                index < CATEGORIES.length - 1 && <ClassicSeparator />}
            </div>
          );
        })}
      </main>

      {/* Separador antes del footer */}
      <ClassicSeparator />

      {/* FOOTER — minimalista institucional */}
      <footer className="classic-footer pb-10 pt-8 text-center">
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
      </footer>

      {/* ESTILOS RESPONSIVE */}
      <style jsx>{`
        /* Tablets */
        @media (max-width: 1023px) {
          .classic-bulletin {
            max-width: 100%;
            padding: 0 24px;
          }
        }

        /* Mobile */
        @media (max-width: 767px) {
          .classic-title {
            font-size: 20px !important;
          }

          .classic-date {
            font-size: 13px !important;
          }

          .classic-section {
            margin-bottom: 32px;
          }

          .classic-section-title {
            font-size: 18px !important;
          }

          .classic-news-title {
            font-size: 16px !important;
          }

          .classic-news-content {
            font-size: 14px !important;
            text-align: left !important;
          }

          .classic-link {
            font-size: 13px !important;
          }

          .classic-content {
            padding: 0 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
