"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, ArrowLeft, Loader2, Trash2, GripVertical, Shield } from "lucide-react";
import Link from "next/link";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableCategoryRow({
  category,
  onToggleActive,
  onDelete,
}: {
  category: BulletinCategory;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string, name: string) => void;
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
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 flex items-center gap-4 ${
        !category.isActive ? "opacity-50" : ""
      } ${isDragging ? "z-50 shadow-lg" : ""}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </button>

      <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {category.displayOrder}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{category.displayName}</span>
          <span className="text-xs text-muted-foreground font-mono">
            {category.name}
          </span>
          {category.isDefault && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              <Shield className="h-3 w-3" />
              Default
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={category.isActive}
            onCheckedChange={(checked) =>
              onToggleActive(category.id, checked)
            }
          />
          <span className="text-xs text-muted-foreground w-14">
            {category.isActive ? "Activa" : "Inactiva"}
          </span>
        </div>

        {!category.isDefault && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(category.id, category.displayName)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDisplayOrder, setNewDisplayOrder] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
      (cat, index) => ({ ...cat, displayOrder: index })
    );

    setCategories(reordered);

    try {
      const response = await fetch("/api/bulletins/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: reordered.map((c) => c.id),
        }),
      });

      if (!response.ok) throw new Error("Error al reordenar");
      toast.success("Orden actualizado");
    } catch (err) {
      console.error("Error reordering:", err);
      toast.error("Error al reordenar categorías");
      await loadCategories();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDisplayName.trim()) {
      toast.error("Nombre y nombre visible son requeridos");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/bulletins/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim().toLowerCase().replace(/\s+/g, "_"),
          displayName: newDisplayName.trim(),
          displayOrder: newDisplayOrder,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear categoría");
      }

      toast.success("Categoría creada");
      setNewName("");
      setNewDisplayName("");
      setNewDisplayOrder(0);
      setShowAddForm(false);
      await loadCategories();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/bulletins/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error("Error actualizando categoría");
      toast.success(isActive ? "Categoría activada" : "Categoría desactivada");
      await loadCategories();
    } catch (err) {
      console.error("Error toggling category:", err);
      toast.error("Error actualizando categoría");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) return;

    try {
      const response = await fetch(`/api/bulletins/categories/${id}`, {
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

  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
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
            <h1 className="text-3xl font-bold mb-2">Categorías del Boletín</h1>
            <p className="text-muted-foreground">
              Administra las categorías para clasificar noticias. Arrastra para reordenar.
            </p>
          </div>

          <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Categoría
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Card className="p-4">
            <div className="text-2xl font-bold">{categories.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-muted-foreground">Activas</div>
          </Card>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="p-6 mb-6 border-blue-200 bg-blue-50/50">
          <h3 className="text-lg font-semibold mb-4">Nueva Categoría</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="newName">Slug (identificador)</Label>
                <Input
                  id="newName"
                  placeholder="ej: ultima_hora"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newDisplayName">Nombre visible</Label>
                <Input
                  id="newDisplayName"
                  placeholder="ej: Última Hora"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newDisplayOrder">Orden</Label>
                <Input
                  id="newDisplayOrder"
                  type="number"
                  value={newDisplayOrder}
                  onChange={(e) => setNewDisplayOrder(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando categorías...</span>
        </div>
      )}

      {/* Categories List with Drag & Drop */}
      {!isLoading && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {categories.map((category) => (
                <SortableCategoryRow
                  key={category.id}
                  category={category}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
