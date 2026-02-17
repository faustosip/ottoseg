import { notFound, redirect } from "next/navigation";
import { getBulletinById } from "@/lib/db/queries/bulletins";
import { PublicBulletinView } from "@/components/bulletin/public-bulletin-view";
import { db } from "@/lib/db";
import { bulletins } from "@/lib/schema";
import { and, gte, lt } from "drizzle-orm";
import type { Metadata } from "next";

/**
 * Props de la página pública
 */
interface PageProps {
  params: Promise<{
    id: string; // puede ser UUID o formato de fecha
  }>;
}

// Ecuador is UTC-5 (no DST)
const EC_OFFSET_HOURS = 5;

/**
 * Parsear fecha del formato URL a rango UTC que cubre el día en Ecuador
 */
function parseUrlDate(dateStr: string): { start: Date; end: Date } | null {
  // Formato esperado: 16-feb-2026
  const months: Record<string, number> = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3,
    'may': 4, 'jun': 5, 'jul': 6, 'ago': 7,
    'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
  };

  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0]);
  const monthStr = parts[1].toLowerCase();
  const year = parseInt(parts[2]);

  if (!months.hasOwnProperty(monthStr)) return null;
  if (isNaN(day) || isNaN(year)) return null;

  // 00:00 Ecuador = 05:00 UTC
  const start = new Date(Date.UTC(year, months[monthStr], day, EC_OFFSET_HOURS, 0, 0, 0));
  // 00:00 next day Ecuador = 05:00 UTC next day
  const end = new Date(Date.UTC(year, months[monthStr], day + 1, EC_OFFSET_HOURS, 0, 0, 0));

  return { start, end };
}

/**
 * Formatear fecha para URL (siempre en timezone Ecuador)
 */
function formatDateForUrl(date: Date): string {
  // Convert UTC to Ecuador time by subtracting offset
  const ecTime = new Date(date.getTime() - EC_OFFSET_HOURS * 60 * 60 * 1000);
  const day = ecTime.getUTCDate().toString().padStart(2, '0');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const month = months[ecTime.getUTCMonth()];
  const year = ecTime.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Detectar si es UUID
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Generar metadata dinámica para SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  let bulletin = null;

  // Si es UUID, buscar por ID
  if (isUUID(id)) {
    bulletin = await getBulletinById(id);
  } else {
    // Si es formato de fecha, buscar por fecha
    const dateRange = parseUrlDate(id);
    if (dateRange) {
      const [result] = await db
        .select()
        .from(bulletins)
        .where(
          and(
            gte(bulletins.date, dateRange.start),
            lt(bulletins.date, dateRange.end)
          )
        )
        .limit(1);
      bulletin = result;
    }
  }

  if (!bulletin) {
    return {
      title: "Boletín no encontrado",
    };
  }

  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Guayaquil",
  }).format(bulletin.date);

  return {
    title: `Boletín - ${formattedDate}`,
    description: "Boletín informativo de noticias de Ecuador - Otto Seguridad",
    openGraph: {
      title: `Boletín - ${formattedDate}`,
      description: "Boletín informativo de noticias de Ecuador - Otto Seguridad",
      type: "article",
      publishedTime: bulletin.publishedAt?.toISOString(),
    },
  };
}

/**
 * Página pública del Boletín
 *
 * Maneja tanto UUID como formato de fecha
 * Redirige UUID a formato de fecha para mejor UX
 */
export default async function PublicBulletinPage({ params }: PageProps) {
  const { id } = await params;

  let bulletin = null;
  let shouldRedirect = false;

  // Detectar si es UUID
  if (isUUID(id)) {
    // Buscar por UUID
    bulletin = await getBulletinById(id);
    shouldRedirect = true; // Marcar para redirección
  } else {
    // Intentar parsear como fecha
    const dateRange = parseUrlDate(id);

    if (dateRange) {
      // Buscar por fecha dentro del rango del día (timezone Ecuador)
      const [result] = await db
        .select()
        .from(bulletins)
        .where(
          and(
            gte(bulletins.date, dateRange.start),
            lt(bulletins.date, dateRange.end)
          )
        )
        .limit(1);
      bulletin = result;
    }
  }

  // 404 si no se encuentra
  if (!bulletin) {
    notFound();
  }

  // Verificar estado
  if (bulletin.status !== "published" && bulletin.status !== "ready") {
    notFound();
  }

  // Verificar que tenga contenido
  if (!bulletin.classifiedNews) {
    notFound();
  }

  // Si es UUID, redirigir a formato de fecha
  if (shouldRedirect) {
    const dateUrl = formatDateForUrl(bulletin.date);
    redirect(`/bulletin/${dateUrl}`);
  }

  // Formatear fecha para mostrar (siempre en timezone Ecuador)
  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Guayaquil",
  }).format(bulletin.date);

  return <PublicBulletinView bulletin={bulletin} formattedDate={formattedDate} />;
}