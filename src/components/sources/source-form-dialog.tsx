"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { NewsSource } from "@/lib/schema";

interface SourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: NewsSource | null; // null = crear nuevo, NewsSource = editar
  onSave: () => void;
}

/**
 * Dialog para crear o editar una fuente de noticias
 */
export function SourceFormDialog({
  open,
  onOpenChange,
  source,
  onSave,
}: SourceFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [selector, setSelector] = useState("");
  const [scrapeConfig, setScrapeConfig] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Poblar campos cuando se edita
  useEffect(() => {
    if (source) {
      setName(source.name);
      setUrl(source.url);
      setBaseUrl(source.baseUrl);
      setSelector(source.selector || "");
      setScrapeConfig(
        source.scrapeConfig ? JSON.stringify(source.scrapeConfig, null, 2) : ""
      );
      setIsActive(source.isActive);
    } else {
      // Reset para nueva fuente
      setName("");
      setUrl("");
      setBaseUrl("");
      setSelector("");
      setScrapeConfig("");
      setIsActive(true);
    }
    setError(null);
  }, [source, open]);

  /**
   * Valida y envía el formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validar campos requeridos
      if (!name.trim() || !url.trim() || !baseUrl.trim()) {
        throw new Error("Los campos Nombre, URL y Base URL son requeridos");
      }

      // Validar y parsear scrapeConfig si existe
      let parsedConfig = null;
      if (scrapeConfig.trim()) {
        try {
          parsedConfig = JSON.parse(scrapeConfig);
        } catch {
          throw new Error("El JSON de configuración no es válido");
        }
      }

      // Preparar datos
      const data = {
        name: name.trim(),
        url: url.trim(),
        baseUrl: baseUrl.trim(),
        selector: selector.trim() || null,
        scrapeConfig: parsedConfig,
        isActive,
      };

      // Crear o actualizar
      const method = source ? "PUT" : "POST";
      const endpoint = source ? `/api/sources/${source.id}` : "/api/sources";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error guardando fuente");
      }

      // Éxito
      onSave();
    } catch (err) {
      console.error("Error saving source:", err);
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {source ? "Editar Fuente" : "Nueva Fuente"}
          </DialogTitle>
          <DialogDescription>
            {source
              ? "Modifica la configuración de la fuente de noticias"
              : "Agrega una nueva fuente de noticias para scrapear"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Primicias"
              required
            />
            <p className="text-xs text-muted-foreground">
              Nombre identificador de la fuente
            </p>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">
              URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.ejemplo.com/noticias"
              required
            />
            <p className="text-xs text-muted-foreground">
              URL de la página de categoría o listado de noticias
            </p>
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">
              Base URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="baseUrl"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://www.ejemplo.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Dominio base del sitio web
            </p>
          </div>

          {/* Selector (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="selector">Selector CSS (opcional)</Label>
            <Input
              id="selector"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="Ej: .article-link, a.noticia"
            />
            <p className="text-xs text-muted-foreground">
              Selector CSS para encontrar enlaces de artículos
            </p>
          </div>

          {/* Scrape Config (JSON opcional) */}
          <div className="space-y-2">
            <Label htmlFor="scrapeConfig">
              Configuración de Scraping (JSON opcional)
            </Label>
            <Textarea
              id="scrapeConfig"
              value={scrapeConfig}
              onChange={(e) => setScrapeConfig(e.target.value)}
              placeholder={`{\n  "formats": ["markdown"],\n  "onlyMainContent": true\n}`}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Configuración personalizada para Crawl4AI en formato JSON
            </p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Fuente Activa</Label>
              <p className="text-xs text-muted-foreground">
                Las fuentes activas se incluyen en el scraping automático
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {source ? "Guardar Cambios" : "Crear Fuente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
