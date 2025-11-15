"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { SourceCard } from "@/components/sources/source-card";
import { SourceFormDialog } from "@/components/sources/source-form-dialog";
import type { NewsSource } from "@/lib/schema";

/**
 * Página de configuración de fuentes de noticias
 *
 * Permite gestionar las fuentes que se utilizan para scrapear noticias
 */
export default function SourcesPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);

  /**
   * Carga las fuentes desde la API
   */
  const loadSources = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/sources");

      if (!response.ok) {
        throw new Error("Error cargando fuentes");
      }

      const data = await response.json();
      setSources(data.sources || []);
    } catch (err) {
      console.error("Error loading sources:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Elimina una fuente
   */
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta fuente?")) {
      return;
    }

    try {
      const response = await fetch(`/api/sources/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error eliminando fuente");
      }

      // Recargar fuentes
      await loadSources();
    } catch (err) {
      console.error("Error deleting source:", err);
      alert("Error eliminando fuente: " + (err as Error).message);
    }
  };

  /**
   * Activa/desactiva una fuente
   */
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/sources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error("Error actualizando fuente");
      }

      // Recargar fuentes
      await loadSources();
    } catch (err) {
      console.error("Error toggling source:", err);
      alert("Error actualizando fuente: " + (err as Error).message);
    }
  };

  /**
   * Abre el formulario para editar una fuente
   */
  const handleEdit = (source: NewsSource) => {
    setEditingSource(source);
    setIsFormOpen(true);
  };

  /**
   * Abre el formulario para crear una nueva fuente
   */
  const handleAdd = () => {
    setEditingSource(null);
    setIsFormOpen(true);
  };

  /**
   * Maneja el guardado desde el formulario
   */
  const handleFormSave = async () => {
    setIsFormOpen(false);
    setEditingSource(null);
    await loadSources();
  };

  // Cargar fuentes al montar
  useEffect(() => {
    loadSources();
  }, []);

  // Calcular estadísticas
  const activeSources = sources.filter((s) => s.isActive).length;
  const inactiveSources = sources.filter((s) => !s.isActive).length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Fuentes de Noticias</h1>
            <p className="text-muted-foreground">
              Administra las fuentes que se utilizan para scrapear noticias
            </p>
          </div>

          <Button onClick={handleAdd} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Fuente
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="p-4">
            <div className="text-2xl font-bold">{sources.length}</div>
            <div className="text-sm text-muted-foreground">Total Fuentes</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{activeSources}</div>
            <div className="text-sm text-muted-foreground">Activas</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-400">{inactiveSources}</div>
            <div className="text-sm text-muted-foreground">Inactivas</div>
          </Card>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando fuentes...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive font-medium">Error cargando fuentes</p>
          <p className="text-destructive/80 text-sm mt-1">{error}</p>
          <Button onClick={loadSources} variant="outline" size="sm" className="mt-3">
            Reintentar
          </Button>
        </div>
      )}

      {/* Sources grid */}
      {!isLoading && !error && sources.length === 0 && (
        <div className="text-center p-12 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground mb-4">No hay fuentes configuradas</p>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primera Fuente
          </Button>
        </div>
      )}

      {!isLoading && !error && sources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={() => handleEdit(source)}
              onDelete={() => handleDelete(source.id)}
              onToggleActive={(isActive) => handleToggleActive(source.id, isActive)}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <SourceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        source={editingSource}
        onSave={handleFormSave}
      />
    </div>
  );
}
