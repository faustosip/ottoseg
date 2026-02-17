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

/**
 * Parsear fecha del formato URL a Date object
 */
function parseUrlDate(dateStr: string): Date | null {
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

  return new Date(year, months[monthStr], day);
}

/**
 * Formatear fecha para URL
 */
function formatDateForUrl(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
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
    const parsedDate = parseUrlDate(id);
    if (parsedDate) {
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const [result] = await db
        .select()
        .from(bulletins)
        .where(
          and(
            gte(bulletins.date, startOfDay),
            lt(bulletins.date, endOfDay)
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
    const parsedDate = parseUrlDate(id);

    if (parsedDate) {
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const [result] = await db
        .select()
        .from(bulletins)
        .where(
          and(
            gte(bulletins.date, startOfDay),
            lt(bulletins.date, endOfDay)
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

  // Formatear fecha para mostrar
  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(bulletin.date);

  return <PublicBulletinView bulletin={bulletin} formattedDate={formattedDate} />;
}