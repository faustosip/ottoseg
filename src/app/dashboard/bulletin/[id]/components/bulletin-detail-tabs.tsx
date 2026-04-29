"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulletinRenderer } from "@/components/bulletin/bulletin-renderer";
import { DesignSwitcher, useDesignPreference } from "@/components/bulletin/design-switcher";
import { EditableBulletin } from "@/components/bulletin/editable-bulletin";
import { NewsEditor } from "@/app/dashboard/bulletin/[id]/edit/components/news-editor";
import type { Bulletin, BulletinAuditLog } from "@/lib/schema";
import type { BulletinData } from "@/components/bulletin/classic-bulletin-layout";
import { Loader2, Edit, Newspaper, Shield, CheckCircle, Send, Trash2, Download } from "lucide-react";
import type { ClassifiedNews, ClassifiedArticle } from "@/lib/news/classifier";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

/**
 * Props para BulletinDetailTabs
 */
interface BulletinDetailTabsProps {
  bulletin: Bulletin;
  logs?: unknown[];
  auditLogs?: BulletinAuditLog[];
}

/**
 * Componente BulletinDetailTabs
 *
 * Tabs con toda la información del boletín
 */
export function BulletinDetailTabs({ bulletin, auditLogs = [] }: BulletinDetailTabsProps) {
  const [design, setDesign] = useDesignPreference("classic");
  const router = useRouter();
  const isSummarizing = bulletin.status === "summarizing";
  const isReadOnly = bulletin.status === "authorized" || bulletin.status === "published";
  const hasRawNews = !!bulletin.rawNews && Object.keys(bulletin.rawNews as Record<string, unknown>).length > 0;
  const isScraped = bulletin.status === "scraped";

  const [isFetchingContent, setIsFetchingContent] = useState(false);

  // Default to "noticias" tab when scraped (user needs to review and generate)
  const defaultTab = isScraped && hasRawNews ? "noticias" : "resumes";

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

  // Check if articles are missing fullContent
  const missingFullContent = (() => {
    if (!classifiedNews) return false;
    return Object.values(classifiedNews).some((articles: ClassifiedArticle[]) =>
      articles.some((a) => !a.fullContent || a.fullContent.length < 200)
    );
  })();

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

  // Fetch full article content from source URLs
  const handleFetchFullContent = async () => {
    setIsFetchingContent(true);
    try {
      const response = await fetch(`/api/bulletins/${bulletin.id}/fetch-full-content`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al obtener contenido completo');
      }

      const result = await response.json();
      toast.success(`Contenido obtenido: ${result.stats.enriched} artículos enriquecidos`);
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al obtener contenido completo de las noticias');
    } finally {
      setIsFetchingContent(false);
    }
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
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList
        className="flex h-auto w-full items-center justify-start gap-1 rounded-none border-b bg-transparent p-0"
        style={{ borderColor: "var(--otto-rule)" }}
      >
        <TabsTrigger
          value="resumes"
          className="font-mono-otto relative inline-flex items-center gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--otto-muted)] shadow-none transition-colors data-[state=active]:border-[var(--otto-primary)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--otto-ink)] data-[state=active]:shadow-none"
        >
          <Newspaper className="h-3.5 w-3.5" />
          Resúmenes
        </TabsTrigger>
        {hasRawNews && (
          <TabsTrigger
            value="noticias"
            className="font-mono-otto relative inline-flex items-center gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--otto-muted)] shadow-none transition-colors data-[state=active]:border-[var(--otto-primary)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--otto-ink)] data-[state=active]:shadow-none"
          >
            <Newspaper className="h-3.5 w-3.5" />
            Noticias
          </TabsTrigger>
        )}
        <TabsTrigger
          value="edit"
          className="font-mono-otto relative inline-flex items-center gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--otto-muted)] shadow-none transition-colors data-[state=active]:border-[var(--otto-primary)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--otto-ink)] data-[state=active]:shadow-none"
        >
          <Edit className="h-3.5 w-3.5" />
          Editar
        </TabsTrigger>
        <TabsTrigger
          value="audit"
          className="font-mono-otto relative inline-flex items-center gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--otto-muted)] shadow-none transition-colors data-[state=active]:border-[var(--otto-primary)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--otto-ink)] data-[state=active]:shadow-none"
        >
          <Shield className="h-3.5 w-3.5" />
          Auditoría
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
            <div
              className="flex items-center gap-3 rounded-[10px] border bg-white px-4 py-3"
              style={{ borderColor: "var(--otto-rule)" }}
            >
              <Loader2
                className="h-5 w-5 shrink-0 animate-spin"
                style={{ color: "var(--otto-primary)" }}
              />
              <div>
                <p
                  className="font-display text-sm font-bold"
                  style={{ color: "var(--otto-ink)" }}
                >
                  Generando resúmenes con IA…
                </p>
                <p
                  className="font-mono-otto text-[10px] font-medium uppercase"
                  style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
                >
                  Se actualizará automáticamente cada 5 segundos
                </p>
              </div>
            </div>
          )}

          {/* Renderer del boletín */}
          <div
            className="rounded-[14px] border bg-white p-6"
            style={{
              borderColor: "var(--otto-rule)",
              boxShadow: "var(--otto-shadow-1)",
            }}
          >
            {classifiedNews && Object.values(classifiedNews).some((cat) => cat && cat.length > 0) ? (
              <BulletinRenderer
                bulletin={bulletinData}
                design={design}
                editable={false}
              />
            ) : bulletin.rawNews ? (
              <EmptyState
                icon={<Newspaper className="h-7 w-7" />}
                title="Noticias listas para revisar"
                description="Las noticias han sido scrapeadas exitosamente. Selecciona cuáles incluir y se clasificarán automáticamente."
                cta={{
                  label: "Editar y procesar noticias",
                  href: `/dashboard/bulletin/${bulletin.id}/edit`,
                }}
              />
            ) : (
              <EmptyState
                icon={<Loader2 className="h-7 w-7 animate-spin" />}
                title="Resúmenes aún no disponibles"
                description={`El boletín está en estado "${bulletin.status}". Vuelve en unos minutos.`}
              />
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
        {classifiedNews && missingFullContent && (
          <div
            className="mb-4 flex items-center gap-3 rounded-[10px] border p-4"
            style={{
              borderColor: "var(--otto-primary)",
              background: "var(--otto-primary-soft)",
            }}
          >
            <div className="flex-1">
              <p
                className="font-display text-sm font-bold"
                style={{ color: "var(--otto-primary-ink)" }}
              >
                Algunos artículos no tienen contenido completo
              </p>
              <p
                className="font-mono-otto mt-1 text-[10px] font-medium uppercase"
                style={{ color: "var(--otto-primary-ink)", letterSpacing: ".14em", opacity: .75 }}
              >
                Obtener contenido completo desde las fuentes originales
              </p>
            </div>
            <Button
              onClick={handleFetchFullContent}
              disabled={isFetchingContent}
              size="sm"
              className="gap-2 text-white"
              style={{ background: "var(--otto-primary)" }}
            >
              {isFetchingContent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isFetchingContent ? "Obteniendo…" : "Obtener contenido"}
            </Button>
          </div>
        )}
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
          <EmptyState
            icon={<Edit className="h-7 w-7" />}
            title="Sin noticias clasificadas"
            description="Aún no hay contenido editable. Genera o procesa el boletín primero."
          />
        )}
      </TabsContent>

      {/* Tab 4: Auditoría */}
      <TabsContent value="audit" className="mt-6">
        <div
          className="rounded-[14px] border bg-white p-6"
          style={{
            borderColor: "var(--otto-rule)",
            boxShadow: "var(--otto-shadow-1)",
          }}
        >
          <h3
            className="font-display mb-4 text-[18px] font-bold"
            style={{
              letterSpacing: "-.3px",
              color: "var(--otto-ink)",
            }}
          >
            Registro de Auditoría
          </h3>
          {auditLogs.length > 0 ? (
            <div className="space-y-2">
              {auditLogs.map((log) => {
                const actionConfig: Record<string, { icon: React.ReactNode; label: string }> = {
                  authorized: {
                    icon: <CheckCircle className="h-4 w-4" style={{ color: "var(--otto-primary)" }} />,
                    label: "Autorizado",
                  },
                  published: {
                    icon: <Send className="h-4 w-4" style={{ color: "var(--otto-primary)" }} />,
                    label: "Publicado",
                  },
                  deleted: {
                    icon: <Trash2 className="h-4 w-4" style={{ color: "var(--otto-primary)" }} />,
                    label: "Eliminado",
                  },
                };
                const config = actionConfig[log.action] || {
                  icon: <Shield className="h-4 w-4" style={{ color: "var(--otto-muted)" }} />,
                  label: log.action,
                };
                const formattedTime = new Intl.DateTimeFormat("es-EC", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(log.createdAt));

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 rounded-[10px] border p-3 transition-colors hover:bg-[var(--otto-bg)]"
                    style={{ borderColor: "var(--otto-rule)" }}
                  >
                    {config.icon}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono-otto inline-flex items-center rounded-[6px] px-2 py-0.5 text-[10px] font-semibold uppercase"
                          style={{
                            background: "var(--otto-primary-soft)",
                            color: "var(--otto-primary-ink)",
                            letterSpacing: ".14em",
                          }}
                        >
                          {config.label}
                        </span>
                        <span
                          className="truncate text-sm font-medium"
                          style={{ color: "var(--otto-ink)" }}
                        >
                          {log.userName}
                        </span>
                      </div>
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: "var(--otto-muted)" }}
                      >
                        {log.userEmail}
                      </p>
                    </div>
                    <span
                      className="font-mono-otto whitespace-nowrap text-[10px] uppercase"
                      style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
                    >
                      {formattedTime}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Shield className="h-7 w-7" />}
              title="Sin registros de auditoría"
              description="Todavía nadie ha autorizado, publicado o eliminado este boletín."
              compact
            />
          )}
        </div>
      </TabsContent>

    </Tabs>
  );
}

