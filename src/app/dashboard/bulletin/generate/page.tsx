"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PipelineProgress } from "@/components/bulletin/pipeline-progress";
import { Topline } from "@/components/dashboard/topline";
import { PageHeader } from "@/components/dashboard/page-header";
import { FooterNote } from "@/components/dashboard/footer-note";
import {
  GenerateStepper,
  type GenerateStep,
} from "@/components/bulletin/generate-stepper";
import { GenerateSummaryCard } from "@/components/bulletin/generate-summary-card";

type Phase =
  | "idle"
  | "checking"
  | "starting"
  | "running"
  | "error";

function todayLabel(): string {
  const fmt = new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return fmt.format(new Date()).toUpperCase().replace(/\./g, "");
}

export default function GenerateBulletinPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [bulletinId, setBulletinId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
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
        // permitir generación si la verificación falla
      }
      if (!cancelled) setPhase("idle");
    }
    checkExisting();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const generateBulletin = async () => {
    setPhase("starting");
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      const scrapeRes = await fetch("/api/news/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableCrawl4AI: false }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!scrapeRes.ok) {
        const errorData = await scrapeRes.json();
        if (scrapeRes.status === 409) {
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
            `${errorData.error || "Servicio de scraping no disponible"}. ${errorData.details || ""}`,
          );
        }
        throw new Error(
          errorData.message || errorData.error || "Error en scraping",
        );
      }

      const scrapeData = await scrapeRes.json();
      setBulletinId(scrapeData.bulletinId);
      setPhase("running");
    } catch (err) {
      let msg = "Error desconocido en el scraping";
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          msg = "La petición tardó más de 5 minutos. Revisa los logs del servidor.";
        } else if (err.message.includes("Failed to fetch")) {
          msg = "Error de conexión. Verifica que el servidor esté corriendo.";
        } else {
          msg = err.message;
        }
      }
      setError(msg);
      setPhase("error");
    }
  };

  const handleComplete = () => {
    if (bulletinId) {
      setTimeout(() => {
        router.push(`/dashboard/bulletin/${bulletinId}/edit`);
      }, 1500);
    }
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    setPhase("error");
  };

  const steps = useMemo<GenerateStep[]>(() => {
    const make = (
      label: string,
      sub: string,
      idx: number,
    ): Omit<GenerateStep, "status"> => ({ label, sub, count: idx });

    if (phase === "running") {
      return [
        { ...make("Scraping", "en curso", 1), status: "now" },
        { ...make("Clasificación", "en cola", 2), status: "pending" },
        { ...make("Selección", "—", 3), status: "pending" },
        { ...make("Video", "—", 4), status: "pending" },
        { ...make("Envío", "06:00", 5), status: "pending" },
      ];
    }

    if (phase === "error") {
      return [
        { ...make("Scraping", "error", 1), status: "error" },
        { ...make("Clasificación", "—", 2), status: "pending" },
        { ...make("Selección", "—", 3), status: "pending" },
        { ...make("Video", "—", 4), status: "pending" },
        { ...make("Envío", "—", 5), status: "pending" },
      ];
    }

    return [
      { ...make("Scraping", "listo para iniciar", 1), status: "pending" },
      { ...make("Clasificación", "—", 2), status: "pending" },
      { ...make("Selección", "—", 3), status: "pending" },
      { ...make("Video", "—", 4), status: "pending" },
      { ...make("Envío", "06:00", 5), status: "pending" },
    ];
  }, [phase]);

  const summaryStatus: "pending" | "running" | "ready" | "error" =
    phase === "running" || phase === "starting"
      ? "running"
      : phase === "error"
        ? "error"
        : "pending";

  const summaryStatusLabel =
    summaryStatus === "running"
      ? "en curso"
      : summaryStatus === "error"
        ? "error"
        : "pendiente";

  return (
    <>
      <Topline crumbs={["Operación", "Generar boletín"]} />
      <PageHeader
        title="Generar"
        highlight="boletín"
        lede="Inicia el pipeline diario: scraping de fuentes, clasificación por categoría y resumen listo para revisión."
        actions={
          <Link
            href="/dashboard/bulletin"
            className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold"
            style={{
              background: "var(--otto-surface)",
              border: "1px solid var(--otto-rule)",
              color: "var(--otto-ink)",
            }}
          >
            ← Volver a boletines
          </Link>
        }
      />

      <GenerateStepper steps={steps} />

      <div
        className="grid items-start gap-[18px]"
        style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}
      >
        <div
          className="rounded-[14px] border bg-white p-6"
          style={{
            borderColor: "var(--otto-rule)",
            boxShadow: "var(--otto-shadow-1)",
          }}
        >
          {phase === "checking" && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-b-2"
                style={{ borderColor: "var(--otto-primary)" }}
              />
              <p
                className="m-0 text-sm"
                style={{ color: "var(--otto-muted)" }}
              >
                Verificando boletín del día…
              </p>
            </div>
          )}

          {phase === "idle" && (
            <div className="py-8 text-center">
              <div
                className="font-mono-otto mb-2"
                style={{
                  fontSize: "10px",
                  letterSpacing: ".14em",
                  color: "var(--otto-muted)",
                }}
              >
                Edición · {todayLabel()}
              </div>
              <h2
                className="font-display m-0 mb-3 text-[26px] font-bold leading-[1.1]"
                style={{
                  letterSpacing: "-0.8px",
                  color: "var(--otto-ink)",
                }}
              >
                ¿Listo para generar el boletín de hoy?
              </h2>
              <p
                className="mx-auto mb-6 max-w-[560px] text-[14px] leading-[1.55]"
                style={{ color: "var(--otto-muted)" }}
              >
                El proceso tarda 1–2 minutos: recopila noticias de las fuentes
                configuradas, clasifica por categoría y genera un resumen listo
                para revisión.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={generateBulletin}
                  className="inline-flex items-center gap-2 rounded-[10px] px-5 py-3 text-[13px] font-semibold text-white"
                  style={{
                    background: "var(--otto-primary)",
                    boxShadow: "0 4px 14px rgba(214,40,40,.28)",
                  }}
                >
                  Iniciar pipeline →
                </button>
              </div>
            </div>
          )}

          {phase === "starting" && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div
                className="h-10 w-10 animate-spin rounded-full border-b-2"
                style={{ borderColor: "var(--otto-primary)" }}
              />
              <h3
                className="font-display m-0 text-[18px] font-semibold"
                style={{ color: "var(--otto-ink)" }}
              >
                Recopilando noticias…
              </h3>
              <p
                className="m-0 max-w-[420px] text-sm"
                style={{ color: "var(--otto-muted)" }}
              >
                Estamos consultando fuentes y preparando el pipeline.
              </p>
            </div>
          )}

          {phase === "running" && bulletinId && (
            <PipelineProgress
              bulletinId={bulletinId}
              onComplete={handleComplete}
              onError={handleError}
            />
          )}

          {phase === "error" && (
            <div className="py-6">
              <div
                className="rounded-[10px] border p-4"
                style={{
                  background: "var(--otto-err-soft)",
                  borderColor: "var(--otto-err)",
                  color: "var(--otto-err)",
                }}
              >
                <div className="font-display mb-1 text-[15px] font-bold">
                  Error al generar el boletín
                </div>
                <p className="m-0 text-[13px] leading-[1.5]">{error}</p>
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setPhase("idle");
                  }}
                  className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold"
                  style={{
                    background: "var(--otto-surface)",
                    border: "1px solid var(--otto-rule)",
                    color: "var(--otto-ink)",
                  }}
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}
        </div>

        <GenerateSummaryCard
          rows={[
            { label: "Edición", value: todayLabel() },
            { label: "Hora envío", value: "06:00" },
            { label: "Fuentes", value: "5 activas" },
            {
              label: "Estado",
              value:
                phase === "running"
                  ? "Pipeline activo"
                  : phase === "starting"
                    ? "Iniciando…"
                    : phase === "error"
                      ? "Detenido"
                      : "Listo para iniciar",
            },
          ]}
          status={summaryStatus}
          statusLabel={summaryStatusLabel}
          warning={
            phase === "idle"
              ? "Una vez iniciado el pipeline, podrás revisar y autorizar el envío en la página de edición."
              : null
          }
        />
      </div>

      <FooterNote>OttoSeguridad · Console · Generar</FooterNote>
    </>
  );
}
