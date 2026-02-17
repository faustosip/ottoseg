"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulletinRenderer } from "@/components/bulletin/bulletin-renderer";
import { DesignSwitcher, useDesignPreference } from "@/components/bulletin/design-switcher";
import { EditableBulletin } from "@/components/bulletin/editable-bulletin";
import { NewsEditor } from "@/app/dashboard/bulletin/[id]/edit/components/news-editor";
import type { Bulletin } from "@/lib/schema";
import type { BulletinData } from "@/components/bulletin/classic-bulletin-layout";
import { Loader2, Edit, Newspaper } from "lucide-react";
import type { ClassifiedNews } from "@/lib/news/classifier";
import { toast } from "sonner";

/**
 * Props para BulletinDetailTabs
 */
interface BulletinDetailTabsProps {
  bulletin: Bulletin;
  logs?: unknown[];
}

/**
 * Componente BulletinDetailTabs
 *
 * Tabs con toda la información del boletín
 */
export function BulletinDetailTabs({ bulletin }: BulletinDetailTabsProps) {
  const [design, setDesign] = useDesignPreference("classic");
  const router = useRouter();
  const isSummarizing = bulletin.status === "summarizing";
  const isReadOnly = bulletin.status === "authorized" || bulletin.status === "published";
  const hasRawNews = !!bulletin.rawNews && Object.keys(bulletin.rawNews as Record<string, unknown>).length > 0;

  // Auto-refresh when summaries are being generated in background
  useEffect(() => {
    if (!isSummarizing) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isSummarizing, router]);

  // Notify user when summaries finish
  const [wasSummarizing] = useState(isSummarizing);
  useEffect(() => {
    if (wasSummarizing && !isSummarizing && bulletin.status === "ready") {
      toast.success("Resúmenes generados exitosamente");
    }
  }, [wasSummarizing, isSummarizing, bulletin.status]);

  // Convertir Bulletin a BulletinData para los layouts
  const classifiedNews = bulletin.classifiedNews as ClassifiedNews | null;

  // Helper para obtener la primera imagen de una categoría
  const getFirstImageUrl = (newsArray: ClassifiedNews[keyof ClassifiedNews] | undefined): string | undefined => {
    return newsArray?.find((n) => n.imageUrl)?.imageUrl;
  };

  // Helper: build category data - show category if it has a summary OR has classified articles
  const buildCategoryData = (
    key: keyof ClassifiedNews,
    title: string,
    summaryText: string | null | undefined
  ) => {
    const news = classifiedNews?.[key] || [];
    if (!summaryText && news.length === 0) return undefined;

    return {
      title,
      summary: summaryText || (isSummarizing ? "Generando resumen..." : ""),
      news,
      imageUrl: getFirstImageUrl(news),
    };
  };

  const bulletinData: BulletinData = {
    date: bulletin.date,
    economia: buildCategoryData("economia", "Economía", bulletin.economia),
    politica: buildCategoryData("politica", "Política", bulletin.politica),
    sociedad: buildCategoryData("sociedad", "Sociedad", bulletin.sociedad),
    seguridad: buildCategoryData("seguridad", "Seguridad", bulletin.seguridad),
    internacional: buildCategoryData("internacional", "Internacional", bulletin.internacional),
    vial: buildCategoryData("vial", "Vial", bulletin.vial),
    roadClosureMapUrl: bulletin.roadClosureMapUrl,
  };

  // Función para guardar cambios del boletín editado
  const handleSaveBulletin = async (
    editedData: Record<string, unknown>,
    roadClosureMapUrl?: string | null,
    manualVideoUrl?: string | null
  ) => {
    try {
      // Update classified news
      const response = await fetch(`/api/bulletins/${bulletin.id}/update-classified`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classifiedNews: editedData })
      });

      if (!response.ok) {
        throw new Error('Error al guardar cambios');
      }

      // Update roadClosureMapUrl and manualVideoUrl if provided
      const patchData: Record<string, string | null> = {};
      if (roadClosureMapUrl !== undefined) {
        patchData.roadClosureMapUrl = roadClosureMapUrl || null;
      }
      if (manualVideoUrl !== undefined) {
        patchData.manualVideoUrl = manualVideoUrl || null;
      }

      if (Object.keys(patchData).length > 0) {
        const patchResponse = await fetch(`/api/bulletins/${bulletin.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchData)
        });

        if (!patchResponse.ok) {
          console.error('Error updating bulletin fields');
        }
      }

      toast.success('Boletín actualizado exitosamente');

      // Recargar la página para ver los cambios
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar los cambios');
      throw error;
    }
  };

  return (
    <Tabs defaultValue="resumes" className="w-full">
      <TabsList className={`grid w-full ${hasRawNews ? "grid-cols-3" : "grid-cols-2"}`}>
        <TabsTrigger value="resumes">Resúmenes</TabsTrigger>
        {hasRawNews && (
          <TabsTrigger value="noticias" className="flex items-center gap-1">
            <Newspaper className="h-3 w-3" />
            Noticias
          </TabsTrigger>
        )}
        <TabsTrigger value="edit" className="flex items-center gap-1">
          <Edit className="h-3 w-3" />
          Editar
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Resúmenes */}
      <TabsContent value="resumes" className="mt-6">
        <div className="space-y-6">
          {/* Design Switcher */}
          <div className="flex justify-center">
            <DesignSwitcher
              currentDesign={design}
              onDesignChange={setDesign}
            />
          </div>

          {/* Banner de resúmenes en proceso */}
          {isSummarizing && (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Generando resúmenes con IA...
                </p>
                <p className="text-xs text-amber-600">
                  Las noticias ya están clasificadas. Los resúmenes se actualizarán automáticamente.
                </p>
              </div>
            </div>
          )}

          {/* Renderer del boletín */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {classifiedNews && Object.values(classifiedNews).some((cat) => cat && cat.length > 0) ? (
              <BulletinRenderer
                bulletin={bulletinData}
                design={design}
                editable={false}
              />
            ) : bulletin.rawNews ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Noticias listas para editar
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Las noticias han sido scrapeadas exitosamente. Ahora puedes seleccionar cuáles incluir en el boletín.
                  </p>
                  <a
                    href={`/dashboard/bulletin/${bulletin.id}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Editar y Procesar Noticias
                  </a>
                  <p className="text-gray-500 text-xs mt-4">
                    Después de seleccionar las noticias, se clasificarán automáticamente por categorías
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Los resúmenes aún no están disponibles. El boletín está en estado:{" "}
                  <strong>{bulletin.status}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Tab 2: Noticias Scrapeadas */}
      {hasRawNews && (
        <TabsContent value="noticias" className="mt-6">
          <NewsEditor
            bulletin={bulletin}
            readOnly={isReadOnly}
            onRegenerated={() => router.refresh()}
          />
        </TabsContent>
      )}

      {/* Tab 3: Editar */}
      <TabsContent value="edit" className="mt-6">
        {classifiedNews ? (
          <EditableBulletin
            bulletinId={bulletin.id}
            date={bulletin.date}
            initialData={classifiedNews}
            initialRoadClosureMapUrl={bulletin.roadClosureMapUrl}
            initialManualVideoUrl={bulletin.manualVideoUrl}
            onSave={handleSaveBulletin}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No hay noticias clasificadas para editar.
            </p>
          </div>
        )}
      </TabsContent>

    </Tabs>
  );
}

