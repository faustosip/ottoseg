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
 * Componente Separador Horizontal
 */
function ClassicSeparator() {
  return (
    <hr
      className="border-0 border-t-2 my-6"
      style={{ borderColor: CLASSIC_DESIGN.colors.accent }}
    />
  );
}

/**
 * Componente de Sección de Categoría
 */
interface CategorySectionProps {
  number: number;
  categoryName: string;
  data?: CategoryData;
}

function CategorySection({ number, categoryName, data }: CategorySectionProps) {
  // Si no hay datos, no mostrar la sección
  if (!data || !data.summary) {
    return null;
  }

  return (
    <section className="classic-section mb-[60px]">
      {/* Título de categoría numerado y subrayado */}
      <h2
        className="classic-section-title text-[44px] leading-[1.3] font-bold underline mb-6"
        style={{
          fontFamily: CLASSIC_DESIGN.typography.fontFamily.heading,
          color: CLASSIC_DESIGN.colors.text,
        }}
      >
        {number}. {categoryName}
      </h2>

      {/* Título de la noticia */}
      {data.title && (
        <h3
          className="classic-news-title text-[42px] leading-[1.4] font-bold text-center my-6"
          style={{
            fontFamily: CLASSIC_DESIGN.typography.fontFamily.body,
            color: CLASSIC_DESIGN.colors.primary,
          }}
        >
          {data.title}
        </h3>
      )}

      {/* Imagen */}
      {data.imageUrl && (
        <div className="classic-news-image-container flex justify-center my-8">
          <Image
            src={data.imageUrl}
            alt={data.title || categoryName}
            width={450}
            height={300}
            className="classic-news-image max-w-[450px] w-full h-auto"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}

      {/* Contenido del resumen */}
      <div
        className="classic-news-content text-[37px] leading-[1.5] text-justify my-6"
        style={{
          fontFamily: CLASSIC_DESIGN.typography.fontFamily.body,
          color: CLASSIC_DESIGN.colors.text,
        }}
      >
        {data.summary}
      </div>

      {/* Link "Leer más" */}
      {data.sourceUrl && (
        <div className="text-right mt-4">
          <Link
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="classic-link text-[37px] font-bold underline"
            style={{ color: CLASSIC_DESIGN.colors.secondary }}
          >
            Leer más
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
      <header
        className="classic-header relative h-[485px] w-full flex flex-col items-center justify-center"
        style={{
          backgroundImage: "url('/bulletin-assets/classic/header-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Fallback si no hay imagen */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200 -z-10" />

        {/* Título principal */}
        <h1
          className="classic-title text-[44px] leading-[1.2] font-bold text-center uppercase tracking-wide px-4"
          style={{
            fontFamily: CLASSIC_DESIGN.typography.fontFamily.heading,
            color: CLASSIC_DESIGN.colors.text,
          }}
        >
          RESUMEN DIARIO DE NOTICIAS
        </h1>

        {/* Fecha */}
        <p
          className="classic-date text-[22px] text-center mt-4"
          style={{
            fontFamily: CLASSIC_DESIGN.typography.fontFamily.body,
            color: CLASSIC_DESIGN.colors.text,
          }}
        >
          {formattedDate}
        </p>
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

      {/* FOOTER */}
      <footer className="classic-footer mt-12">
        {/* Imagen decorativa del footer */}
        <div
          className="classic-footer-image w-full h-auto mb-6"
          style={{
            backgroundImage: "url('/bulletin-assets/classic/footer-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "200px",
          }}
        >
          {/* Fallback si no hay imagen */}
          <div className="w-full h-full bg-gradient-to-t from-gray-100 to-gray-200" />
        </div>

        {/* Logo corporativo */}
        <div className="classic-logo-container flex justify-center pb-12">
          <Image
            src="/bulletin-assets/classic/logo.png"
            alt="OttoSeguridad Logo"
            width={120}
            height={80}
            className="classic-logo max-h-[80px] w-auto"
            style={{ objectFit: "contain" }}
            // Fallback si no hay logo
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
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

          .classic-title {
            font-size: 36px !important;
          }

          .classic-date {
            font-size: 18px !important;
          }

          .classic-section-title {
            font-size: 36px !important;
          }

          .classic-news-title {
            font-size: 32px !important;
          }

          .classic-news-content {
            font-size: 28px !important;
          }

          .classic-link {
            font-size: 28px !important;
          }
        }

        /* Mobile */
        @media (max-width: 767px) {
          .classic-header {
            height: 300px !important;
          }

          .classic-title {
            font-size: 28px !important;
            padding: 0 16px;
          }

          .classic-date {
            font-size: 16px !important;
          }

          .classic-section {
            margin-bottom: 40px;
          }

          .classic-section-title {
            font-size: 28px !important;
          }

          .classic-news-title {
            font-size: 24px !important;
            text-align: left !important;
          }

          .classic-news-image {
            max-width: 100%;
          }

          .classic-news-content {
            font-size: 18px !important;
            text-align: left !important;
          }

          .classic-link {
            font-size: 18px !important;
          }

          .classic-content {
            padding: 0 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
