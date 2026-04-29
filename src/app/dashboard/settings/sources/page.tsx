"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { SourceCardOtto } from "@/components/sources/source-card-otto";
import { SourceFormDialog } from "@/components/sources/source-form-dialog";
import { Topline } from "@/components/dashboard/topline";
import { PageHeader } from "@/components/dashboard/page-header";
import { FooterNote } from "@/components/dashboard/footer-note";
import { SourcesStatsRow } from "@/components/sources/sources-stats-row";
import type { NewsSource } from "@/lib/schema";

export default function SourcesPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);

  const loadSources = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/sources");
      if (!response.ok) throw new Error("Error cargando fuentes");
      const data = await response.json();
      setSources(data.sources || []);
    } catch (err) {
      console.error("Error loading sources:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta fuente?")) return;
    try {
      const response = await fetch(`/api/sources/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando fuente");
      await loadSources();
    } catch (err) {
      console.error("Error deleting source:", err);
      alert("Error eliminando fuente: " + (err as Error).message);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/sources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Error actualizando fuente");
      await loadSources();
    } catch (err) {
      console.error("Error toggling source:", err);
      alert("Error actualizando fuente: " + (err as Error).message);
    }
  };

  const handleEdit = (source: NewsSource) => {
    setEditingSource(source);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingSource(null);
    setIsFormOpen(true);
  };

  const handleFormSave = async () => {
    setIsFormOpen(false);
    setEditingSource(null);
    await loadSources();
  };

  useEffect(() => {
    loadSources();
  }, []);

  const stats = useMemo(() => {
    const active = sources.filter((s) => s.isActive).length;
    const failed24h = sources.filter((s) => {
      if (!s.lastScraped || s.lastScrapedStatus !== "failed") return false;
      const t = new Date(s.lastScraped).getTime();
      return Date.now() - t < 86_400_000;
    }).length;
    const totalToday = sources.reduce(
      (acc, s) => acc + (s.totalScraped ?? 0),
      0,
    );
    const lastRun = sources
      .map((s) => (s.lastScraped ? new Date(s.lastScraped).getTime() : 0))
      .filter((n) => n > 0)
      .sort((a, b) => b - a)[0];
    const lastRunLabel = lastRun
      ? new Date(lastRun).toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
    return { active, failed24h, totalToday, lastRunLabel };
  }, [sources]);

  return (
    <>
      <Topline crumbs={["Configuración", "Fuentes"]} />
      <PageHeader
        title="Fuentes"
        lede="Sitios de noticias monitoreados por scraping en cada corrida del pipeline."
        actions={
          <Button
            onClick={handleAdd}
            className="rounded-[10px] text-white"
            style={{
              background: "var(--otto-primary)",
              boxShadow: "0 4px 14px rgba(214,40,40,.28)",
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Agregar fuente
          </Button>
        }
      />

      <SourcesStatsRow
        items={[
          { label: "Fuentes activas", value: stats.active },
          {
            label: "Total scraped",
            value: stats.totalToday.toLocaleString("es-EC"),
          },
          { label: "Última corrida", value: stats.lastRunLabel },
          {
            label: "Errores · 24h",
            value: stats.failed24h,
            tone: stats.failed24h > 0 ? "error" : "default",
          },
        ]}
      />

      {isLoading && (
        <div
          className="flex items-center justify-center rounded-[14px] border bg-white p-12"
          style={{ borderColor: "var(--otto-rule)" }}
        >
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: "var(--otto-primary)" }}
          />
          <span className="ml-3" style={{ color: "var(--otto-muted)" }}>
            Cargando fuentes…
          </span>
        </div>
      )}

      {error && !isLoading && (
        <div
          className="rounded-[10px] border p-4"
          style={{
            background: "var(--otto-err-soft)",
            borderColor: "var(--otto-err)",
            color: "var(--otto-err)",
          }}
        >
          <p className="m-0 mb-1 font-medium">Error cargando fuentes</p>
          <p className="m-0 text-sm">{error}</p>
          <Button
            onClick={loadSources}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !error && sources.length === 0 && (
        <div
          className="rounded-[14px] border bg-white p-12 text-center"
          style={{ borderColor: "var(--otto-rule)" }}
        >
          <p className="mb-4" style={{ color: "var(--otto-muted)" }}>
            No hay fuentes configuradas
          </p>
          <Button
            onClick={handleAdd}
            className="rounded-[10px] text-white"
            style={{ background: "var(--otto-primary)" }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar primera fuente
          </Button>
        </div>
      )}

      {!isLoading && !error && sources.length > 0 && (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          {sources.map((source) => (
            <SourceCardOtto
              key={source.id}
              source={source}
              onEdit={() => handleEdit(source)}
              onDelete={() => handleDelete(source.id)}
              onToggleActive={(isActive) =>
                handleToggleActive(source.id, isActive)
              }
            />
          ))}
        </div>
      )}

      <SourceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        source={editingSource}
        onSave={handleFormSave}
      />

      <FooterNote>OttoSeguridad · Console · Fuentes</FooterNote>
    </>
  );
}
