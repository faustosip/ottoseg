"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BulletinCategory } from "@/lib/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Topline } from "@/components/dashboard/topline";
import { PageHeader } from "@/components/dashboard/page-header";
import { FooterNote } from "@/components/dashboard/footer-note";
import { CategoriesStatsRow } from "@/components/categories/categories-stats-row";
import { CategoryCard } from "@/components/categories/category-card";

type FormState = {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  keywords: string;
  isActive: boolean;
  displayOrder: number;
};

const EMPTY_FORM: FormState = {
  name: "",
  displayName: "",
  description: "",
  keywords: "",
  isActive: true,
  displayOrder: 0,
};

function parseKeywords(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function SortableCategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: BulletinCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <CategoryCard
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      category={category}
      onEdit={onEdit}
      onDelete={onDelete}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/bulletins/categories?all=true");
      if (!response.ok) throw new Error("Error cargando categorías");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Error loading categories:", err);
      toast.error("Error cargando categorías");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex).map(
      (cat, index) => ({ ...cat, displayOrder: index }),
    );
    setCategories(reordered);
    try {
      const response = await fetch("/api/bulletins/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((c) => c.id) }),
      });
      if (!response.ok) throw new Error("Error al reordenar");
      toast.success("Orden actualizado");
    } catch (err) {
      console.error("Error reordering:", err);
      toast.error("Error al reordenar categorías");
      await loadCategories();
    }
  };

  const openNew = () => {
    setForm({ ...EMPTY_FORM, displayOrder: categories.length });
    setDialogOpen(true);
  };

  const openEdit = (cat: BulletinCategory) => {
    setForm({
      id: cat.id,
      name: cat.name,
      displayName: cat.displayName,
      description: cat.description ?? "",
      keywords: ((cat.keywords as string[] | null) ?? []).join(", "),
      isActive: cat.isActive,
      displayOrder: cat.displayOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) {
      toast.error("Nombre visible es requerido");
      return;
    }
    setIsSaving(true);
    try {
      if (form.id) {
        const res = await fetch(`/api/bulletins/categories/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: form.displayName.trim(),
            displayOrder: form.displayOrder,
            isActive: form.isActive,
            description: form.description.trim() || null,
            keywords: parseKeywords(form.keywords),
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Error al actualizar");
        }
        toast.success("Categoría actualizada");
      } else {
        if (!form.name.trim()) {
          toast.error("Slug es requerido");
          setIsSaving(false);
          return;
        }
        const res = await fetch("/api/bulletins/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim().toLowerCase().replace(/\s+/g, "_"),
            displayName: form.displayName.trim(),
            displayOrder: form.displayOrder,
            description: form.description.trim() || null,
            keywords: parseKeywords(form.keywords),
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Error al crear");
        }
        toast.success("Categoría creada");
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      await loadCategories();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: BulletinCategory) => {
    if (!confirm(`¿Eliminar la categoría "${cat.displayName}"?`)) return;
    try {
      const response = await fetch(`/api/bulletins/categories/${cat.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error eliminando categoría");
      }
      toast.success("Categoría eliminada");
      await loadCategories();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const stats = useMemo(() => {
    const active = categories.filter((c) => c.isActive).length;
    const totalKeywords = categories.reduce(
      (acc, c) => acc + (((c.keywords as string[] | null) ?? []).length),
      0,
    );
    return { total: categories.length, active, totalKeywords };
  }, [categories]);

  return (
    <>
      <Topline crumbs={["Configuración", "Categorías"]} />
      <PageHeader
        title="Categorías"
        lede="Etiquetas con las que el clasificador agrupa las noticias del boletín."
        actions={
          <Button
            onClick={openNew}
            className="rounded-[10px] text-white"
            style={{
              background: "var(--otto-primary)",
              boxShadow: "0 4px 14px rgba(214,40,40,.28)",
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva categoría
          </Button>
        }
      />

      <CategoriesStatsRow
        items={[
          { label: "Total", value: stats.total },
          { label: "Activas", value: stats.active },
          { label: "Keywords totales", value: stats.totalKeywords },
        ]}
      />

      {isLoading ? (
        <div
          className="flex items-center justify-center rounded-[14px] border bg-white p-12"
          style={{ borderColor: "var(--otto-rule)" }}
        >
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: "var(--otto-primary)" }}
          />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 gap-3.5">
              {categories.map((category) => (
                <SortableCategoryCard
                  key={category.id}
                  category={category}
                  onEdit={() => openEdit(category)}
                  onDelete={() => handleDelete(category)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {!form.id ? (
              <div>
                <Label htmlFor="cat-name">Slug (identificador)</Label>
                <Input
                  id="cat-name"
                  placeholder="ej: ultima_hora"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
            ) : null}
            <div>
              <Label htmlFor="cat-display">Nombre visible</Label>
              <Input
                id="cat-display"
                placeholder="ej: Última Hora"
                value={form.displayName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">Descripción</Label>
              <Textarea
                id="cat-desc"
                placeholder="Qué noticias caen en esta categoría…"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="cat-keywords">Keywords (separadas por coma)</Label>
              <Input
                id="cat-keywords"
                placeholder="asamblea, ministerio, presidencia…"
                value={form.keywords}
                onChange={(e) =>
                  setForm((f) => ({ ...f, keywords: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isActive: v }))
                }
              />
              <span className="text-sm">
                {form.isActive ? "Activa" : "Pausada"}
              </span>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="text-white"
                style={{ background: "var(--otto-primary)" }}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {form.id ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FooterNote>OttoSeguridad · Console · Categorías</FooterNote>
    </>
  );
}
