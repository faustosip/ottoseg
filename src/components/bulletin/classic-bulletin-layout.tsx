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
    <section className="classic-section mb-[60px]">
      {/* Título de categoría numerado y subrayado */}
      <h2
        className="classic-section-title text-[24px] leading-[1.3] mb-6"
        style={{
          fontWeight: 700,
          color: "#000000",
          textDecorationLine: "underline",
        }}
      >
        {number}. {categoryName}
      </h2>

      {/* Título de la noticia - Color azul específico */}
      {firstNewsTitle && (
        <h3
          className="classic-news-title text-[22px] leading-[1.4] text-center my-6"
          style={{
            fontWeight: 700,
            color: "rgb(0, 74, 173)", // Azul específico del diseño original
          }}
        >
          {firstNewsTitle}
        </h3>
      )}

      {/* Imagen */}
      {firstNewsImageUrl && (
        <div className="classic-news-image-container flex justify-center my-6">
          <Image
            src={firstNewsImageUrl}
            alt={firstNewsTitle || categoryName}
            width={455}
            height={256}
            className="classic-news-image w-full h-auto"
            style={{
              maxWidth: "455px",
              objectFit: "cover"
            }}
          />
        </div>
      )}

      {/* Contenido del resumen */}
      <div
        className="classic-news-content text-[16px] leading-[1.6] text-justify my-6 mt-6"
        style={{
          fontWeight: 400,
          color: "#000000",
        }}
      >
        {data.summary}
      </div>

      {/* Imagen del mapa de cierres viales (solo para categoría Vial) */}
      {roadClosureMapUrl && isImageUrl(roadClosureMapUrl) && (
        <div className="my-6">
          <h4
            className="text-[18px] leading-[1.4] text-center mb-4"
            style={{
              fontWeight: 700,
              color: "rgb(0, 74, 173)",
            }}
          >
            Mapa de Cierres Viales
          </h4>
          <div className="classic-news-image-container flex justify-center">
            <Image
              src={roadClosureMapUrl}
              alt="Mapa de Cierres Viales"
              width={455}
              height={400}
              className="classic-news-image w-full h-auto rounded-lg"
              style={{
                maxWidth: "455px",
                objectFit: "contain"
              }}
            />
          </div>
        </div>
      )}

      {/* Link "Leer más" */}
      {firstNewsUrl && (
        <div className="text-right mt-4">
          <Link
            href={firstNewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="classic-link text-[16px] underline"
            style={{
              fontWeight: 700,
              color: "rgb(0, 74, 173)"
            }}
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
      <header className="classic-header relative w-full">
        {/* Banner Image */}
        <div className="w-full">
          <Image
            src="/banner.png"
            alt="Resumen Diario de Noticias"
            width={1920}
            height={485}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* Título y fecha sobre fondo blanco */}
        <div className="bg-white py-8">
          {/* Título principal */}
          <h1
            className="classic-title text-center px-4 text-[28px]"
            style={{
              fontWeight: 700,
              color: "#000000",
            }}
          >
            RESUMEN DIARIO DE NOTICIAS
          </h1>

          {/* Fecha */}
          <p
            className="classic-date text-center mt-4 px-4 text-[20px]"
            style={{
              fontWeight: 400,
              color: "#000000",
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
            font-size: 24px !important;
          }

          .classic-date {
            font-size: 18px !important;
          }

          .classic-section-title {
            font-size: 22px !important;
          }

          .classic-news-title {
            font-size: 20px !important;
          }

          .classic-news-content {
            font-size: 15px !important;
          }

          .classic-link {
            font-size: 15px !important;
          }
        }

        /* Mobile */
        @media (max-width: 767px) {
          .classic-header {
            height: 300px !important;
          }

          .classic-title {
            font-size: 20px !important;
            padding: 0 16px;
          }

          .classic-date {
            font-size: 14px !important;
          }

          .classic-section {
            margin-bottom: 40px;
          }

          .classic-section-title {
            font-size: 18px !important;
          }

          .classic-news-title {
            font-size: 16px !important;
            text-align: left !important;
          }

          .classic-news-image {
            max-width: 100%;
          }

          .classic-news-content {
            font-size: 14px !important;
            text-align: left !important;
          }

          .classic-link {
            font-size: 14px !important;
          }

          .classic-content {
            padding: 0 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
