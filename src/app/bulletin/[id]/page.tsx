import { notFound, redirect } from "next/navigation";
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
 * Página pública del Boletín (compatibilidad con UUID)
 *
 * Vista sin autenticación para compartir boletines
 * Redirige al formato de fecha amigable cuando es posible
 */
export default async function PublicBulletinPage({ params }: PageProps) {
  const { id } = await params;

  // Si el ID parece ser un UUID (contiene guiones y es largo)
  const isUuid = id.includes('-') && id.length > 20;

  if (isUuid) {
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

    // Generar URL con formato de fecha y redirigir
    const formatDateForUrl = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const dateUrl = formatDateForUrl(bulletin.date);
    redirect(`/bulletin/${dateUrl}`);
  }

  // Si no es UUID, asumimos que es formato de fecha y redirigimos a [date]
  redirect(`/bulletin/${id}`);
}