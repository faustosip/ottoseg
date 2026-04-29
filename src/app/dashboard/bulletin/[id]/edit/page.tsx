/**
 * Página de Edición de Noticias del Boletín
 * Permite seleccionar/deseleccionar noticias antes de clasificar y resumir
 */

import { notFound, redirect } from "next/navigation";
import { getBulletinById } from "@/lib/db/queries/bulletins";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NewsEditor } from "./components/news-editor";
import { Topline } from "@/components/dashboard/topline";
import { PageHeader } from "@/components/dashboard/page-header";
import { FooterNote } from "@/components/dashboard/footer-note";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBulletinPage({ params }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const { id } = await params;
  const bulletin = await getBulletinById(id);

  if (!bulletin) {
    notFound();
  }

  if (!bulletin.rawNews) {
    redirect(`/dashboard/bulletin/${id}`);
  }

  return (
    <>
      <Topline crumbs={["Operación", "Boletines", "Editar"]} />

      <div className="mb-[18px]">
        <Link
          href={`/dashboard/bulletin/${id}`}
          className="font-mono-otto inline-flex items-center gap-1.5 text-[11px]"
          style={{
            color: "var(--otto-muted)",
            letterSpacing: ".1em",
          }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al boletín
        </Link>
      </div>

      <PageHeader
        title="Editar"
        highlight="noticias del boletín"
        lede="Selecciona las noticias que deseas incluir en el boletín final antes de clasificar y resumir."
      />

      <NewsEditor bulletin={bulletin} />

      <FooterNote>OttoSeguridad · Console · Editar boletín</FooterNote>
    </>
  );
}
