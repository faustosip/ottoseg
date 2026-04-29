"use client";

/**
 * Editor de Noticias
 * Permite seleccionar/deseleccionar noticias organizadas por fuente
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Bulletin, BulletinNews } from "@/lib/schema";
import { NewsCard } from "./news-card";
import { Loader2, Save, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface NewsEditorProps {
  bulletin: Bulletin;
  readOnly?: boolean;
  onRegenerated?: () => void;
}

interface NewsData {
  [source: string]: BulletinNews[];
}

const SOURCE_LABELS: Record<string, string> = {
  lahora: "La Hora",
  laHora: "La Hora",
  elcomercio: "El Comercio",
  elComercio: "El Comercio",
  primicias: "Primicias",
  teleamazonas: "Teleamazonas",
  ecu911: "ECU911",
};

function formatSource(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

export function NewsEditor({ bulletin, readOnly, onRegenerated }: NewsEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Convertir rawNews a NewsData con todas seleccionadas por defecto
  const initialNews: NewsData = {};
  const rawNews = bulletin.rawNews as NewsData | null;

  if (rawNews) {
    Object.entries(rawNews).forEach(([source, articles]) => {
      if (Array.isArray(articles)) {
        initialNews[source] = articles.map((article) => ({
          ...article,
          selected: article.selected ?? true, // Por defecto todas seleccionadas
        }));
      }
    });
  }

  const [newsData, setNewsData] = useState<NewsData>(initialNews);

  // Contar noticias totales y seleccionadas
  const totalNews = Object.values(newsData).reduce(
    (sum, articles) => sum + articles.length,
    0
  );
  const selectedNews = Object.values(newsData).reduce(
    (sum, articles) => sum + articles.filter((a) => a.selected).length,
    0
  );

  // Toggle selección de una noticia
  const toggleNews = (source: string, newsId: string) => {
    setNewsData((prev) => ({
      ...prev,
      [source]: prev[source].map((article) =>
        article.id === newsId
          ? { ...article, selected: !article.selected }
          : article
      ),
    }));
  };

  // Seleccionar/Deseleccionar todas de una fuente
  const toggleAllSource = (source: string, selected: boolean) => {
    setNewsData((prev) => ({
      ...prev,
      [source]: prev[source].map((article) => ({ ...article, selected })),
    }));
  };

  // Guardar selección
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/bulletins/${bulletin.id}/update-news`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsData }),
      });

      if (!response.ok) {
        throw new Error("Error guardando selección");
      }

      toast.success("Selección guardada", {
        description: `${selectedNews} noticias seleccionadas`,
      });
    } catch {
      toast.error("Error", {
        description: "No se pudo guardar la selección",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar y procesar (clasificar + resumir)
  const handleSaveAndProcess = async () => {
    setIsProcessing(true);

    try {
      // Paso 1: Guardar selección
      const saveResponse = await fetch(
        `/api/bulletins/${bulletin.id}/update-news`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newsData }),
        }
      );

      if (!saveResponse.ok) {
        throw new Error("Error guardando selección");
      }

      toast.success("Generando boletín...", {
        description: "Los resúmenes se generan en segundo plano.",
      });

      // Paso 2: Disparar procesamiento sin esperar (fire-and-forget)
      fetch(`/api/bulletins/${bulletin.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch((err) => console.error("Error en procesamiento:", err));

      // Redirigir inmediatamente
      if (onRegenerated) {
        onRegenerated();
      } else {
        router.push(`/dashboard/bulletin/${bulletin.id}`);
      }
    } catch (error) {
      toast.error("Error", {
        description: (error as Error).message,
      });
      setIsProcessing(false);
    }
  };

  // Fuentes disponibles, ordenadas poniendo las que tienen artículos primero
  const sources = Object.keys(newsData).sort((a, b) => {
    const aLen = newsData[a]?.length || 0;
    const bLen = newsData[b]?.length || 0;
    if (aLen > 0 && bLen === 0) return -1;
    if (aLen === 0 && bLen > 0) return 1;
    return 0;
  });

  // Default tab: primera fuente con artículos
  const defaultSource = sources.find((s) => newsData[s]?.length > 0) || sources[0];

  if (sources.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            No hay noticias scrapeadas para editar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div
        className="rounded-[14px] border bg-white p-6"
        style={{
          borderColor: "var(--otto-rule)",
          boxShadow: "var(--otto-shadow-1)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <p
                className="font-mono-otto"
                style={{
                  fontSize: "10px",
                  letterSpacing: ".14em",
                  color: "var(--otto-muted)",
                }}
              >
                Total
              </p>
              <p
                className="font-display"
                style={{
                  fontSize: "26px",
                  fontWeight: 700,
                  letterSpacing: "-1px",
                  color: "var(--otto-ink)",
                }}
              >
                {totalNews}
              </p>
            </div>
            <div>
              <p
                className="font-mono-otto"
                style={{
                  fontSize: "10px",
                  letterSpacing: ".14em",
                  color: "var(--otto-muted)",
                }}
              >
                Seleccionadas
              </p>
              <p
                className="font-display"
                style={{
                  fontSize: "26px",
                  fontWeight: 700,
                  letterSpacing: "-1px",
                  color: "var(--otto-ok)",
                }}
              >
                {selectedNews}
              </p>
            </div>
            <div>
              <p
                className="font-mono-otto"
                style={{
                  fontSize: "10px",
                  letterSpacing: ".14em",
                  color: "var(--otto-muted)",
                }}
              >
                Fuentes
              </p>
              <p
                className="font-display"
                style={{
                  fontSize: "26px",
                  fontWeight: 700,
                  letterSpacing: "-1px",
                  color: "var(--otto-ink)",
                }}
              >
                {sources.length}
              </p>
            </div>
          </div>

          {!readOnly && (
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving || isProcessing}
                variant="outline"
                className="rounded-[10px]"
                style={{ borderColor: "var(--otto-rule)" }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </>
                )}
              </Button>

              <Button
                onClick={handleSaveAndProcess}
                disabled={isSaving || isProcessing || selectedNews === 0}
                className="rounded-[10px] text-white"
                style={{
                  background: "var(--otto-primary)",
                  boxShadow: "0 4px 14px rgba(214,40,40,.28)",
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Guardar y generar boletín
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs por fuente */}
      <Tabs defaultValue={defaultSource} className="w-full">
        <TabsList
          className="flex w-full flex-wrap justify-start gap-1 rounded-[10px] border bg-white p-1"
          style={{
            borderColor: "var(--otto-rule)",
            height: "auto",
          }}
        >
          {sources.map((source) => {
            const articles = newsData[source];
            const selected = articles.filter((a) => a.selected).length;

            return (
              <TabsTrigger
                key={source}
                value={source}
                className="rounded-[7px] px-3 py-1.5 text-[12px] font-medium data-[state=active]:bg-[var(--otto-ink)] data-[state=active]:text-white data-[state=inactive]:text-[var(--otto-muted)]"
              >
                {formatSource(source)}
                <span
                  className="font-mono-otto ml-2"
                  style={{
                    fontSize: "10px",
                    opacity: 0.7,
                    textTransform: "none",
                    letterSpacing: ".04em",
                  }}
                >
                  {selected}/{articles.length}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {sources.map((source) => {
          const articles = newsData[source];
          const allSelected = articles.every((a) => a.selected);
          const noneSelected = articles.every((a) => !a.selected);

          return (
            <TabsContent key={source} value={source} className="space-y-4">
              <div
                className="rounded-[14px] border bg-white p-6"
                style={{
                  borderColor: "var(--otto-rule)",
                  boxShadow: "var(--otto-shadow-1)",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3
                    className="font-display m-0 text-[18px] font-bold"
                    style={{
                      letterSpacing: "-.3px",
                      color: "var(--otto-ink)",
                    }}
                  >
                    {formatSource(source)}
                  </h3>
                  {!readOnly && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAllSource(source, true)}
                        disabled={allSelected}
                        className="rounded-[8px]"
                        style={{ borderColor: "var(--otto-rule)" }}
                      >
                        Seleccionar todas
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAllSource(source, false)}
                        disabled={noneSelected}
                        className="rounded-[8px]"
                        style={{ borderColor: "var(--otto-rule)" }}
                      >
                        Deseleccionar todas
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {articles.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      onToggle={readOnly ? undefined : () => toggleNews(source, article.id)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
