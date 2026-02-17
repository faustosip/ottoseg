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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Noticia Manual</DialogTitle>
          <DialogDescription>
            Crea una noticia manualmente para incluir en el boletín.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Título de la noticia"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">
                Categoría <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
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
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Content */}
            <div className="grid gap-2">
              <Label htmlFor="content">
                Contenido / Resumen <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Escribe el resumen o contenido de la noticia..."
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                className={`min-h-[120px] ${errors.content ? "border-red-500" : ""}`}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content}</p>
              )}
            </div>

            {/* Source */}
            <div className="grid gap-2">
              <Label htmlFor="source">Fuente (opcional)</Label>
              <Input
                id="source"
                placeholder="Ej: El Comercio, Primicias, etc."
                value={formData.source}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, source: e.target.value }))
                }
              />
            </div>

            {/* URL */}
            <div className="grid gap-2">
              <Label htmlFor="url">URL (opcional)</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
              />
            </div>

            {/* Image */}
            <div className="grid gap-2">
              <Label>Imagen (opcional)</Label>

              {formData.imageUrl ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.imageUrl}
                    alt="Vista previa"
                    className="object-cover w-full h-full absolute inset-0"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, imageUrl: "" }))
                    }
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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
                  <div className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-sm text-blue-600">
                          Subiendo imagen...
                        </span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Haz clic para subir una imagen
                        </span>
                      </>
                    )}
                  </div>
                </label>
              )}

              {/* URL input as alternative */}
              {!formData.imageUrl && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">
                    O pega una URL de imagen:
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                "Agregar Noticia"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
