/**
 * Página de Edición de Noticias del Boletín
 * Permite seleccionar/deseleccionar noticias antes de clasificar y resumir
 */

import { notFound, redirect } from "next/navigation";
import { getBulletinById } from "@/lib/db/queries/bulletins";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NewsEditor } from "./components/news-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBulletinPage({ params }: PageProps) {
  // Validar autenticación
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  // Obtener parámetros
  const { id } = await params;

  // Obtener boletín
  const bulletin = await getBulletinById(id);

  if (!bulletin) {
    notFound();
  }

  // Verificar que el boletín tenga noticias scrapeadas
  if (!bulletin.rawNews) {
    redirect(`/dashboard/bulletin/${id}`);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Editar Noticias del Boletín</h1>
        <p className="text-muted-foreground">
          Selecciona las noticias que deseas incluir en el boletín final
        </p>
      </div>

      <NewsEditor bulletin={bulletin} />
    </div>
  );
}
