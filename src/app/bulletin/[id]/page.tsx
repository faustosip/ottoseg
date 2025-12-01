import { notFound } from "next/navigation";
import { getBulletinById } from "@/lib/db/queries/bulletins";
import { PublicBulletinView } from "@/components/bulletin/public-bulletin-view";
import type { Metadata } from "next";

/**
 * Props de la página pública
 */
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Generar metadata dinámica para SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const bulletin = await getBulletinById(id);

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
    description: "Boletín informativo de noticias de Ecuador",
    openGraph: {
      title: `Boletín - ${formattedDate}`,
      description: "Boletín informativo de noticias de Ecuador",
      type: "article",
      publishedTime: bulletin.publishedAt?.toISOString(),
    },
  };
}

/**
 * Página pública del Boletín
 *
 * Vista sin autenticación para compartir boletines
 * Solo muestra el contenido del boletín sin menús de la aplicación
 */
export default async function PublicBulletinPage({ params }: PageProps) {
  const { id } = await params;

  // Cargar boletín
  const bulletin = await getBulletinById(id);

  // 404 si no existe o no está listo/publicado
  if (!bulletin || (bulletin.status !== "published" && bulletin.status !== "ready")) {
    notFound();
  }

  // Solo mostrar si tiene noticias clasificadas
  if (!bulletin.classifiedNews) {
    notFound();
  }

  // Formatear fecha
  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(bulletin.date);

  return <PublicBulletinView bulletin={bulletin} formattedDate={formattedDate} />;
}