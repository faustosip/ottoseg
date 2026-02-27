"use client";

/**
 * Editor de Noticias
 * Permite seleccionar/deseleccionar noticias organizadas por fuente
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{totalNews}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Seleccionadas
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedNews}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fuentes</p>
                  <p className="text-2xl font-bold">{sources.length}</p>
                </div>
              </div>
            </div>

            {!readOnly && (
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isProcessing}
                  variant="outline"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
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
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Guardar y Generar Boletín
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs por fuente */}
      <Tabs defaultValue={defaultSource} className="w-full">
        <TabsList className="w-full justify-start">
          {sources.map((source) => {
            const articles = newsData[source];
            const selected = articles.filter((a) => a.selected).length;

            return (
              <TabsTrigger key={source} value={source}>
                {source}
                <Badge variant="secondary" className="ml-2">
                  {selected}/{articles.length}
                </Badge>
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
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{source}</CardTitle>
                    {!readOnly && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAllSource(source, true)}
                          disabled={allSelected}
                        >
                          Seleccionar Todas
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAllSource(source, false)}
                          disabled={noneSelected}
                        >
                          Deseleccionar Todas
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {articles.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      onToggle={readOnly ? undefined : () => toggleNews(source, article.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
