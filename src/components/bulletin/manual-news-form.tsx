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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

interface CategoryOption {
  value: string;
  label: string;
}

interface ManualNewsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bulletinId: string;
  onSuccess: () => void;
}

export function ManualNewsFormDialog({
  open,
  onOpenChange,
  bulletinId,
  onSuccess,
}: ManualNewsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    subcategory: "",
    source: "Manual",
    url: "",
    imageUrl: "",
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/bulletins/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(
            (data.categories || []).map((c: { name: string; displayName: string }) => ({
              value: c.name,
              label: c.displayName,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
    category?: string;
  }>({});

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "",
      subcategory: "",
      source: "Manual",
      url: "",
      imageUrl: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.title.trim()) {
      newErrors.title = "El título es requerido";
    }

    if (!formData.content.trim()) {
      newErrors.content = "El contenido es requerido";
    }

    if (!formData.category) {
      newErrors.category = "Selecciona una categoría";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es demasiado grande. Máximo 5MB.");
      return;
    }

    setIsUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al subir imagen");
      }

      const result = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success("Imagen subida correctamente");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error((error as Error).message || "Error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/bulletins/${bulletinId}/add-manual-news`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          subcategory: formData.category === "ultima_hora" && formData.subcategory
            ? formData.subcategory
            : undefined,
          source: formData.source || "Manual",
          url: formData.url || undefined,
          imageUrl: formData.imageUrl || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al agregar noticia");
      }

      toast.success("Noticia agregada exitosamente");
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error((error as Error).message || "Error al agregar noticia");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const monoLabelClass = "font-mono-otto text-[10px] font-semibold uppercase";
  const monoLabelStyle = {
    color: "var(--otto-muted)",
    letterSpacing: ".14em",
  } as React.CSSProperties;
  const requiredStyle = { color: "var(--otto-primary)" } as React.CSSProperties;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-[560px]"
        style={{ borderColor: "var(--otto-rule)" }}
      >
        <DialogHeader
          className="space-y-2 px-6 pt-6 pb-4"
          style={{ borderBottom: "1px solid var(--otto-rule)" }}
        >
          <span
            className="font-mono-otto inline-flex w-fit items-center gap-1.5 rounded-[6px] px-2 py-1 text-[10px] font-semibold uppercase"
            style={{
              background: "var(--otto-primary-soft)",
              color: "var(--otto-primary-ink)",
              letterSpacing: ".14em",
            }}
          >
            ● Noticia manual
          </span>
          <DialogTitle
            className="font-display text-[22px] font-bold leading-tight"
            style={{ color: "var(--otto-ink)", letterSpacing: "-.3px" }}
          >
            Agregar noticia
          </DialogTitle>
          <DialogDescription
            className="text-[13px]"
            style={{ color: "var(--otto-muted)" }}
          >
            Crea una noticia manualmente para incluir en el boletín.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 px-6 py-5">
            {/* Title */}
            <div className="grid gap-1.5">
              <Label htmlFor="title" className={monoLabelClass} style={monoLabelStyle}>
                Título <span style={requiredStyle}>*</span>
              </Label>
              <Input
                id="title"
                placeholder="Título de la noticia"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                style={errors.title ? { borderColor: "var(--otto-primary)" } : undefined}
              />
              {errors.title && (
                <p
                  className="font-mono-otto text-[10px] font-medium uppercase"
                  style={{ color: "var(--otto-primary)", letterSpacing: ".14em" }}
                >
                  {errors.title}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="grid gap-1.5">
              <Label htmlFor="category" className={monoLabelClass} style={monoLabelStyle}>
                Categoría <span style={requiredStyle}>*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, category: value, subcategory: "" }))
                }
              >
                <SelectTrigger
                  style={errors.category ? { borderColor: "var(--otto-primary)" } : undefined}
                >
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p
                  className="font-mono-otto text-[10px] font-medium uppercase"
                  style={{ color: "var(--otto-primary)", letterSpacing: ".14em" }}
                >
                  {errors.category}
                </p>
              )}
            </div>

            {/* Subcategory - only when ultima_hora is selected */}
            {formData.category === "ultima_hora" && (
              <div className="grid gap-1.5">
                <Label htmlFor="subcategory" className={monoLabelClass} style={monoLabelStyle}>
                  Subcategoría (opcional)
                </Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, subcategory: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una subcategoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((cat) => cat.value !== "ultima_hora")
                      .map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs" style={{ color: "var(--otto-muted)" }}>
                  Agrupa esta noticia bajo una categoría temática en Última Hora
                </p>
              </div>
            )}

            {/* Content */}
            <div className="grid gap-1.5">
              <Label htmlFor="content" className={monoLabelClass} style={monoLabelStyle}>
                Contenido / Resumen <span style={requiredStyle}>*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Escribe el resumen o contenido de la noticia…"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                className="min-h-[120px]"
                style={errors.content ? { borderColor: "var(--otto-primary)" } : undefined}
              />
              {errors.content && (
                <p
                  className="font-mono-otto text-[10px] font-medium uppercase"
                  style={{ color: "var(--otto-primary)", letterSpacing: ".14em" }}
                >
                  {errors.content}
                </p>
              )}
            </div>

            {/* Source + URL en grid 2 col */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="source" className={monoLabelClass} style={monoLabelStyle}>
                  Fuente
                </Label>
                <Input
                  id="source"
                  placeholder="Ej: Primicias, El Comercio…"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, source: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="url" className={monoLabelClass} style={monoLabelStyle}>
                  URL
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://…"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Image */}
            <div className="grid gap-1.5">
              <Label className={monoLabelClass} style={monoLabelStyle}>
                Imagen (opcional)
              </Label>

              {formData.imageUrl ? (
                <div
                  className="relative w-full overflow-hidden rounded-[10px] border bg-[var(--otto-bg)]"
                  style={{ aspectRatio: "16 / 9", borderColor: "var(--otto-rule)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.imageUrl}
                    alt="Vista previa"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, imageUrl: "" }))
                    }
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--otto-primary)" }}
                    title="Quitar imagen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = "";
                    }}
                    disabled={isUploading}
                  />
                  <div
                    className="flex items-center justify-center gap-2 rounded-[10px] border-2 border-dashed bg-white px-4 py-6 transition-colors hover:bg-[var(--otto-primary-soft)]"
                    style={{ borderColor: "var(--otto-primary)" }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2
                          className="h-5 w-5 animate-spin"
                          style={{ color: "var(--otto-primary)" }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: "var(--otto-primary-ink)" }}
                        >
                          Subiendo imagen…
                        </span>
                      </>
                    ) : (
                      <>
                        <ImageIcon
                          className="h-5 w-5"
                          style={{ color: "var(--otto-primary)" }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--otto-primary-ink)" }}
                        >
                          Haz clic para subir una imagen
                        </span>
                      </>
                    )}
                  </div>
                </label>
              )}

              {/* URL input as alternative */}
              {!formData.imageUrl && (
                <div className="mt-1">
                  <p
                    className="font-mono-otto mb-1 text-[10px] font-medium uppercase"
                    style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
                  >
                    O pega una URL
                  </p>
                  <Input
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter
            className="gap-2 px-6 py-4"
            style={{
              borderTop: "1px solid var(--otto-rule)",
              background: "var(--otto-bg)",
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{ borderColor: "var(--otto-rule)" }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="text-white"
              style={{
                background: "var(--otto-primary)",
                boxShadow: "0 4px 12px rgba(214,40,40,.3)",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando…
                </>
              ) : (
                "Agregar noticia"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
