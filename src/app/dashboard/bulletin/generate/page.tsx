"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PipelineProgress } from "@/components/bulletin/pipeline-progress";

/**
 * Página de Generación de Boletín
 *
 * Ejecuta el pipeline completo: scrape → enrich → classify → summarize
 */
export default function GenerateBulletinPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulletinId, setBulletinId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ejecuta el pipeline completo
   */
  const generateBulletin = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Iniciar scraping
      const scrapeRes = await fetch("/api/news/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableCrawl4AI: true }),
      });

      if (!scrapeRes.ok) {
        const error = await scrapeRes.json();
        throw new Error(error.message || "Error en scraping");
      }

      const scrapeData = await scrapeRes.json();
      setBulletinId(scrapeData.bulletinId);

      // El componente PipelineProgress ahora maneja el polling y redirección
    } catch (err) {
      console.error("❌ Error en pipeline:", err);
      setError((err as Error).message);
      setIsGenerating(false);
    }
  };

  /**
   * Callback cuando se completa el pipeline
   */
  const handleComplete = () => {
    if (bulletinId) {
      // Redirigir a página de edición después de 2 segundos
      setTimeout(() => {
        router.push(`/dashboard/bulletin/${bulletinId}/edit`);
      }, 2000);
    }
  };

  /**
   * Callback cuando hay error
   */
  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    setIsGenerating(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/bulletin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a boletines
        </Link>

        <h1 className="text-3xl font-bold mb-2">Scrapear Noticias</h1>
        <p className="text-muted-foreground">
          Este proceso scrapeará noticias de todas las fuentes configuradas usando el pipeline híbrido (Firecrawl + Crawl4AI).
        </p>
      </div>

      {/* Panel de generación */}
      {!isGenerating && !bulletinId && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">
            ¿Listo para scrapear las noticias?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            El proceso tomará aproximadamente 3-5 minutos:
            <br />
            • FASE 1 (Firecrawl): ~60s - Descubre artículos en páginas de categorías
            <br />
            • FASE 2 (Crawl4AI): ~3-4min - Extrae contenido completo de cada artículo
          </p>
          <Button onClick={generateBulletin} size="lg">
            Iniciar Scraping
          </Button>
        </div>
      )}

      {/* Componente de progreso detallado */}
      {bulletinId && (
        <PipelineProgress
          bulletinId={bulletinId}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}

      {/* Mensaje de error */}
      {error && !bulletinId && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive font-medium mb-2">
            ❌ Error al iniciar el scraping
          </p>
          <p className="text-destructive/80 text-sm">{error}</p>
          <div className="mt-4">
            <Button onClick={() => setError(null)} variant="outline" size="sm">
              Intentar de nuevo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
