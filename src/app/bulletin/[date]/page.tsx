import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { bulletins } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { PublicBulletinView } from "@/components/bulletin/public-bulletin-view";
import type { Metadata } from "next";

/**
 * Props de la página pública con fecha
 */
interface PageProps {
  params: Promise<{
    date: string; // formato: 01-dic-2025
  }>;
}

/**
 * Parsear fecha del formato URL a Date object
 */
function parseUrlDate(dateStr: string): Date | null {
  // Formato esperado: 01-dic-2025
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
 * Generar metadata dinámica para SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const parsedDate = parseUrlDate(date);

  if (!parsedDate) {
    return {
      title: "Boletín no encontrado",
    };
  }

  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);

  return {
    title: `Boletín - ${formattedDate}`,
    description: "Boletín informativo de noticias de Ecuador - Otto Seguridad",
    openGraph: {
      title: `Boletín - ${formattedDate}`,
      description: "Boletín informativo de noticias de Ecuador - Otto Seguridad",
      type: "article",
    },
  };
}

/**
 * Página pública del Boletín por fecha
 *
 * Formato de URL: /bulletin/01-dic-2025
 * Más amigable para personas mayores
 */
export default async function PublicBulletinByDatePage({ params }: PageProps) {
  const { date } = await params;

  // Parsear la fecha de la URL
  const parsedDate = parseUrlDate(date);
  if (!parsedDate) {
    notFound();
  }

  // Buscar boletín por fecha
  // Creamos un rango para el día completo
  const startOfDay = new Date(parsedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(parsedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const [bulletin] = await db
    .select()
    .from(bulletins)
    .where(
      and(
        eq(bulletins.date, parsedDate),
        // Solo mostrar boletines listos o publicados
      )
    )
    .limit(1);

  // 404 si no existe o no está listo/publicado
  if (!bulletin || (bulletin.status !== "published" && bulletin.status !== "ready")) {
    notFound();
  }

  // Solo mostrar si tiene noticias clasificadas
  if (!bulletin.classifiedNews) {
    notFound();
  }

  // Formatear fecha para mostrar
  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);

  return <PublicBulletinView bulletin={bulletin} formattedDate={formattedDate} />;
}