"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PipelineProgress } from "@/components/bulletin/pipeline-progress";
import { toast } from "sonner";

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
  const [checking, setChecking] = useState(true);

  // Check if today's bulletin already exists on page load
  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/bulletins/today");
        if (res.ok) {
          const data = await res.json();
          if (data.bulletin && data.bulletin.status !== "failed") {
            toast.info("Ya existe un boletín para hoy");
            router.replace(`/dashboard/bulletin/${data.bulletin.id}`);
            return;
          }
        }
      } catch {
        // If the check fails, allow generation anyway (API will catch duplicates)
      }
      setChecking(false);
    }
    checkExisting();
  }, [router]);

  /**
   * Ejecuta el pipeline completo
   */
  const generateBulletin = async () => {
    console.log("🚀 Iniciando scraping de noticias...");
    setIsGenerating(true);
    setError(null);

    try {
      // Crear un timeout para la petición (5 minutos)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error("⏱️ Timeout: La petición tardó más de 5 minutos");
        controller.abort();
      }, 300000);

      // Iniciar scraping (deshabilitar enriquecimiento para ser más rápido)
      const scrapeRes = await fetch("/api/news/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableCrawl4AI: false }), // FASE 2 deshabilitada
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("✅ Respuesta recibida del servidor:", scrapeRes.status);

      if (!scrapeRes.ok) {
        const errorData = await scrapeRes.json();
        if (scrapeRes.status === 409) {
          // Duplicate bulletin - redirect to existing one
          toast.info("Ya existe un boletín para hoy");
          if (errorData.bulletinId) {
            router.replace(`/dashboard/bulletin/${errorData.bulletinId}`);
          } else {
            router.replace("/dashboard/bulletin");
          }
          return;
        }
        if (scrapeRes.status === 503) {
          throw new Error(
            `🔌 ${errorData.error || "Servicio de scraping no disponible"}. ${errorData.details || ""}`
          );
        }
        throw new Error(errorData.message || errorData.error || "Error en scraping");
      }

      const scrapeData = await scrapeRes.json();
      setBulletinId(scrapeData.bulletinId);

      // El componente PipelineProgress ahora maneja el polling y redirección
    } catch (err) {
      console.error("❌ Error en pipeline:", err);

      // Manejar diferentes tipos de errores
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError(
            "⏱️ La petición tardó más de 5 minutos. Por favor verifica los logs del servidor."
          );
        } else if (err.message.includes("Failed to fetch")) {
          setError(
            "🌐 Error de conexión. Verifica que el servidor esté corriendo."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Error desconocido en el scraping");
      }

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

        <h1 className="text-3xl font-bold mb-2">Generar Boletín</h1>
        <p className="text-muted-foreground">
          Recopila automáticamente las noticias más relevantes del día desde todas las fuentes configuradas.
        </p>
      </div>

      {/* Loading while checking for existing bulletin */}
      {checking && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Verificando boletín del día...</p>
          </div>
        </div>
      )}

      {/* Panel de generación */}
      {!checking && !isGenerating && !bulletinId && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">
            ¿Listo para generar el boletín de hoy?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            El proceso tomará aproximadamente 1-2 minutos:
            <br />
            • Recopila noticias de las principales fuentes del país
            <br />
            • Clasifica automáticamente por categoría (Economía, Política, Sociedad, etc.)
            <br />
            • Genera un resumen listo para revisar y publicar
          </p>
          <Button onClick={generateBulletin} size="lg">
            Iniciar Recopilación
          </Button>
        </div>
      )}

      {/* Mensaje de "Esperando respuesta del servidor..." */}
      {isGenerating && !bulletinId && !error && (
        <div className="bg-card rounded-lg border p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <h2 className="text-xl font-semibold">
              Recopilando noticias...
            </h2>
            <p className="text-muted-foreground max-w-md">
              Estamos obteniendo las noticias más recientes. Esto tomará 1-2 minutos.
            </p>
            <p className="text-sm text-muted-foreground/60">
              Consultando fuentes y clasificando artículos...
            </p>
          </div>
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
            Error al generar el boletín
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
