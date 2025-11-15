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
}

interface NewsData {
  [source: string]: BulletinNews[];
}

export function NewsEditor({ bulletin }: NewsEditorProps) {
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
      // Primero guardar
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

      // Luego clasificar
      const classifyResponse = await fetch("/api/news/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulletinId: bulletin.id }),
      });

      if (!classifyResponse.ok) {
        throw new Error("Error clasificando noticias");
      }

      // Luego resumir
      const summarizeResponse = await fetch("/api/news/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulletinId: bulletin.id }),
      });

      if (!summarizeResponse.ok) {
        throw new Error("Error generando resúmenes");
      }

      toast.success("Boletín procesado", {
        description: "Redirigiendo a la vista del boletín...",
      });

      // Redirigir al boletín
      setTimeout(() => {
        router.push(`/dashboard/bulletin/${bulletin.id}`);
      }, 1000);
    } catch (error) {
      toast.error("Error", {
        description: (error as Error).message,
      });
      setIsProcessing(false);
    }
  };

  // Fuentes disponibles
  const sources = Object.keys(newsData);

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
          </div>
        </CardContent>
      </Card>

      {/* Tabs por fuente */}
      <Tabs defaultValue={sources[0]} className="w-full">
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
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {articles.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      onToggle={() => toggleNews(source, article.id)}
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
