"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Edit,
  Save,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  ImageIcon,
  Upload,
  Plus,
  Video,
  GripVertical,
} from "lucide-react";
import { ManualNewsFormDialog } from "./manual-news-form";
import { toast } from "sonner";
import type { ClassifiedNews, ClassifiedArticle } from "@/lib/news/classifier";
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

/**
 * Artículo extendido con campos editables
 */
interface EditableArticle extends ClassifiedArticle {
  id?: string;
  fullContent?: string;
  enhancedTitle?: string;
  enhancedSummary?: string;
  editedImageUrl?: string;
  isEditing?: boolean;
  isEnhancing?: boolean;
  isUploading?: boolean;
  editedTitle?: string;
  editedSummary?: string;
  editedUrl?: string;
  editedSource?: string;
  editedCategory?: string;
  editedSubcategory?: string;
}

/**
 * Datos editables del boletín - ahora dinámico basado en categorías
 */
type EditableBulletinData = Record<string, EditableArticle[]>;

/**
 * Wrapper que hace cada noticia arrastrable y soporta selección.
 * El contenido (children) ya incluye su propio padding y look.
 */
function SortableNewsItem({
  id,
  isEditing,
  selected,
  children,
}: {
  id: string;
  isEditing: boolean;
  selected: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const borderColor = isEditing
    ? "var(--otto-primary)"
    : selected
      ? "var(--otto-primary)"
      : "var(--otto-rule)";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : "auto",
      }}
      className="group relative rounded-[12px] border bg-white transition-all hover:border-[var(--otto-primary)]"
    >
      <div
        style={{
          borderColor,
          background: selected ? "var(--otto-primary-soft)" : undefined,
          borderRadius: "12px",
        }}
        className="rounded-[12px]"
      >
        {/* Drag handle */}
        {!isEditing && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="absolute -left-7 top-1/2 -translate-y-1/2 cursor-grab rounded p-1 opacity-0 transition-opacity hover:bg-[var(--otto-bg)] active:cursor-grabbing group-hover:opacity-100"
            style={{ color: "var(--otto-muted)" }}
            title="Arrastrar para reordenar"
            aria-label="Arrastrar"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

interface EditableBulletinProps {
  bulletinId: string;
  date: Date;
  initialData: ClassifiedNews;
  initialRoadClosureMapUrl?: string | null;
  initialManualVideoUrl?: string | null;
  onSave?: (data: EditableBulletinData, roadClosureMapUrl?: string | null, manualVideoUrl?: string | null) => Promise<void>;
}

/**
 * Componente de Boletín Editable
 *
 * Permite:
 * - Ver y editar títulos y resúmenes
 * - Mejorar con IA
 * - Eliminar noticias
 * - Guardar cambios
 */
export function EditableBulletin({
  bulletinId,
  date,
  initialData,
  initialRoadClosureMapUrl,
  initialManualVideoUrl,
  onSave
}: EditableBulletinProps) {
  // roadClosureMapUrl is kept from initialRoadClosureMapUrl but no longer editable in this UI
  const roadClosureMapUrl = initialRoadClosureMapUrl || "";
  const [manualVideoUrl, setManualVideoUrl] = useState(initialManualVideoUrl || "");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [bulletinData, setBulletinData] = useState<EditableBulletinData>(() => {
    // Convertir initialData a EditableBulletinData
    const editableData: EditableBulletinData = {};
    const data = initialData as unknown as Record<string, ClassifiedArticle[]>;

    Object.keys(data).forEach((category) => {
      editableData[category] = data[category].map((article, index) => ({
        ...article,
        id: `${category}-${index}`,
        enhancedTitle: article.title,
        enhancedSummary: article.fullContent || article.content,
        isEditing: false,
        isEnhancing: false
      }));
    });

    return editableData;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showManualNewsDialog, setShowManualNewsDialog] = useState(false);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [categoryOrders, setCategoryOrders] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionRunning, setBulkActionRunning] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDragEnd = (category: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBulletinData((prev) => {
      const items = prev[category];
      if (!items) return prev;
      const oldIndex = items.findIndex((a) => a.id === active.id);
      const newIndex = items.findIndex((a) => a.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(items, oldIndex, newIndex).map((a, idx) => ({
        ...a,
        id: `${category}-${idx}`,
      }));
      return { ...prev, [category]: reordered };
    });
    setHasChanges(true);
  };

  const bulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedIds.size} ${selectedIds.size === 1 ? "noticia" : "noticias"}?`)) return;

    setBulletinData((prev) => {
      const next: EditableBulletinData = {};
      Object.keys(prev).forEach((cat) => {
        next[cat] = prev[cat]
          .filter((a) => !selectedIds.has(a.id || ""))
          .map((a, idx) => ({ ...a, id: `${cat}-${idx}` }));
      });
      return next;
    });
    toast.success(`${selectedIds.size} ${selectedIds.size === 1 ? "noticia eliminada" : "noticias eliminadas"}`);
    clearSelection();
    setHasChanges(true);
  };

  const bulkEnhance = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionRunning(true);

    const targets: Array<{ category: string; articleId: string; article: EditableArticle }> = [];
    Object.entries(bulletinData).forEach(([cat, articles]) => {
      articles.forEach((a) => {
        if (a.id && selectedIds.has(a.id)) {
          targets.push({ category: cat, articleId: a.id, article: a });
        }
      });
    });

    toast.info(`Mejorando ${targets.length} noticias con IA…`);

    try {
      const response = await fetch(`/api/bulletins/${bulletinId}/enhance-content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles: targets.map((t) => ({
            title: t.article.title,
            content: t.article.content,
            fullContent: (t.article as { fullContent?: string }).fullContent,
          })),
        }),
      });

      if (!response.ok) throw new Error("Error al mejorar con IA");

      const result = await response.json();

      setBulletinData((prev) => {
        const next = { ...prev };
        targets.forEach((t, idx) => {
          const items = next[t.category];
          if (!items) return;
          const articleIdx = items.findIndex((a) => a.id === t.articleId);
          if (articleIdx === -1) return;
          items[articleIdx] = {
            ...items[articleIdx],
            enhancedTitle: result.articles[idx].enhancedTitle,
            enhancedSummary: result.articles[idx].enhancedSummary,
          };
          next[t.category] = [...items];
        });
        return next;
      });

      toast.success(`${result.stats.successful} noticias mejoradas`);
      setHasChanges(true);
      clearSelection();
    } catch (error) {
      console.error(error);
      toast.error("Error al mejorar con IA");
    } finally {
      setBulkActionRunning(false);
    }
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/bulletins/categories");
        if (response.ok) {
          const data = await response.json();
          const nameMap: Record<string, string> = {};
          const orderMap: Record<string, number> = {};
          for (const c of data.categories || []) {
            nameMap[c.name] = c.displayName;
            orderMap[c.name] = c.displayOrder ?? 0;
          }
          setCategoryNames(nameMap);
          setCategoryOrders(orderMap);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  // Formatear fecha
  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  /**
   * Mejorar noticia con IA
   */
  const enhanceWithAI = async (category: string, articleId: string) => {
    const articleIndex = bulletinData[category].findIndex(a => a.id === articleId);
    if (articleIndex === -1) return;

    const article = bulletinData[category][articleIndex];

    // Marcar como enhancing
    updateArticle(category, articleId, { isEnhancing: true });

    try {
      const response = await fetch(`/api/bulletins/${bulletinId}/enhance-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          fullContent: 'fullContent' in article ? (article as { fullContent?: string }).fullContent : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Error al mejorar con IA');
      }

      const enhanced = await response.json();

      // Actualizar con contenido mejorado
      updateArticle(category, articleId, {
        enhancedTitle: enhanced.enhancedTitle,
        enhancedSummary: enhanced.enhancedSummary,
        isEnhancing: false
      });

      toast.success('Contenido mejorado con IA');
      setHasChanges(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al mejorar con IA');
      updateArticle(category, articleId, { isEnhancing: false });
    }
  };

  /**
   * Togglear modo edición de una noticia
   */
  const toggleEdit = (category: string, articleId: string) => {
    const article = bulletinData[category].find(a => a.id === articleId);
    if (!article) return;

    if (article.isEditing) {
      // Salir de modo edición sin guardar
      updateArticle(category, articleId, {
        isEditing: false,
        editedTitle: undefined,
        editedSummary: undefined,
        editedImageUrl: undefined,
        editedUrl: undefined,
        editedSource: undefined,
        editedCategory: undefined,
        editedSubcategory: undefined,
      });
    } else {
      // Entrar en modo edición
      updateArticle(category, articleId, {
        isEditing: true,
        editedTitle: article.enhancedTitle || article.title,
        editedSummary: article.enhancedSummary || article.content,
        editedImageUrl: article.imageUrl || '',
        editedUrl: article.url || '',
        editedSource: article.source || '',
        editedCategory: category,
        editedSubcategory: article.category || '',
      });
    }
  };

  /**
   * Guardar cambios de edición manual
   */
  const saveEdit = (category: string, articleId: string) => {
    const article = bulletinData[category].find(a => a.id === articleId);
    if (!article) return;

    const newCategory = article.editedCategory || category;
    const categoryChanged = newCategory !== category;

    // Determine subcategory: only set when target category is ultima_hora
    const targetCategory = newCategory;
    const subcategoryValue = targetCategory === "ultima_hora"
      ? (article.editedSubcategory || undefined)
      : undefined;

    const updatedArticle: EditableArticle = {
      ...article,
      enhancedTitle: article.editedTitle,
      enhancedSummary: article.editedSummary,
      imageUrl: article.editedImageUrl || article.imageUrl,
      url: article.editedUrl || article.url,
      source: article.editedSource || article.source,
      category: subcategoryValue,
      isEditing: false,
      editedTitle: undefined,
      editedSummary: undefined,
      editedImageUrl: undefined,
      editedUrl: undefined,
      editedSource: undefined,
      editedCategory: undefined,
      editedSubcategory: undefined,
    };

    if (categoryChanged) {
      // Move article from old category to new category
      setBulletinData(prev => {
        const newData = { ...prev };

        // Remove from old category
        newData[category] = newData[category].filter(a => a.id !== articleId);
        // Recompute IDs for old category
        newData[category] = newData[category].map((a, idx) => ({
          ...a,
          id: `${category}-${idx}`,
        }));

        // Add to new category (create array if it doesn't exist)
        const targetArticles = [...(newData[newCategory] || [])];
        updatedArticle.id = `${newCategory}-${targetArticles.length}`;
        targetArticles.push(updatedArticle);
        newData[newCategory] = targetArticles;

        return newData;
      });
      toast.success(`Noticia movida a ${categoryNames[newCategory] || newCategory}`);
    } else {
      updateArticle(category, articleId, {
        enhancedTitle: updatedArticle.enhancedTitle,
        enhancedSummary: updatedArticle.enhancedSummary,
        imageUrl: updatedArticle.imageUrl,
        url: updatedArticle.url,
        source: updatedArticle.source,
        category: updatedArticle.category,
        isEditing: false,
        editedTitle: undefined,
        editedSummary: undefined,
        editedImageUrl: undefined,
        editedUrl: undefined,
        editedSource: undefined,
        editedCategory: undefined,
        editedSubcategory: undefined,
      });
      toast.success('Cambios guardados');
    }

    setHasChanges(true);
  };

  /**
   * Actualizar un artículo específico
   */
  const updateArticle = (
    category: string,
    articleId: string,
    updates: Partial<EditableArticle>
  ) => {
    setBulletinData(prev => {
      const newData = { ...prev };
      const categoryArticles = [...newData[category]];
      const articleIndex = categoryArticles.findIndex(a => a.id === articleId);

      if (articleIndex !== -1) {
        categoryArticles[articleIndex] = {
          ...categoryArticles[articleIndex],
          ...updates
        };
        newData[category] = categoryArticles;
      }

      return newData;
    });
  };

  /**
   * Eliminar una noticia
   */
  const deleteArticle = (category: string, articleId: string) => {
    if (confirm('¿Estás seguro de eliminar esta noticia?')) {
      setBulletinData(prev => {
        const newData = { ...prev };
        newData[category] = newData[category].filter(a => a.id !== articleId);
        return newData;
      });

      toast.success('Noticia eliminada');
      setHasChanges(true);
    }
  };

  /**
   * Subir imagen a MinIO
   */
  const uploadImage = async (
    category: string,
    articleId: string,
    file: File
  ) => {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP.');
      return;
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es demasiado grande. Máximo 5MB.');
      return;
    }

    // Marcar como uploading
    updateArticle(category, articleId, { isUploading: true });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir imagen');
      }

      const result = await response.json();

      // Actualizar la imagen
      updateArticle(category, articleId, {
        editedImageUrl: result.url,
        isUploading: false,
      });

      toast.success('Imagen subida correctamente');
      setHasChanges(true);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error((error as Error).message || 'Error al subir la imagen');
      updateArticle(category, articleId, { isUploading: false });
    }
  };

  /**
   * Guardar todos los cambios
   */
  const saveAllChanges = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      // Convertir EditableBulletinData a ClassifiedNews
      // Usar los títulos y resúmenes mejorados si existen
      const dataToSave: Record<string, ClassifiedArticle[]> = {};

      Object.keys(bulletinData).forEach((category) => {
        dataToSave[category] = bulletinData[category].map(article => ({
          title: article.enhancedTitle || article.title,
          content: article.enhancedSummary || article.content,
          fullContent: article.fullContent,
          url: article.url,
          source: article.source,
          imageUrl: article.imageUrl,
          ...(article.category ? { category: article.category } : {}),
        }));
      });

      await onSave(dataToSave, roadClosureMapUrl || null, manualVideoUrl || null);
      toast.success('Boletín guardado exitosamente');
      setHasChanges(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el boletín');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Mejorar todas las noticias con IA (batch)
   */
  const enhanceAllWithAI = async () => {
    const allArticles: Array<{ category: string; article: EditableArticle }> = [];

    Object.keys(bulletinData).forEach((category) => {
      const key = category as string;
      bulletinData[key].forEach(article => {
        allArticles.push({ category, article });
      });
    });

    if (allArticles.length === 0) {
      toast.error('No hay noticias para mejorar');
      return;
    }

    toast.info(`Mejorando ${allArticles.length} noticias con IA...`);

    try {
      const response = await fetch(`/api/bulletins/${bulletinId}/enhance-content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: allArticles.map(item => ({
            title: item.article.title,
            content: item.article.content,
            fullContent: 'fullContent' in item.article ? (item.article as { fullContent?: string }).fullContent : undefined
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Error al mejorar con IA');
      }

      const result = await response.json();

      // Actualizar todas las noticias con los resultados
      const newData = { ...bulletinData };
      let index = 0;

      Object.keys(newData).forEach((category) => {
        const key = category as string;
        newData[key] = newData[key].map(article => ({
          ...article,
          enhancedTitle: result.articles[index].enhancedTitle,
          enhancedSummary: result.articles[index].enhancedSummary
        }));
        index += newData[key].length;
      });

      setBulletinData(newData);
      toast.success(`${result.stats.successful} noticias mejoradas exitosamente`);
      setHasChanges(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al mejorar con IA');
    }
  };

  // Obtener categorías con noticias, ordenadas por displayOrder
  const categoriesWithNews = Object.entries(bulletinData)
    .filter(([, news]) => news.length > 0)
    .sort(([a], [b]) => (categoryOrders[a] ?? 999) - (categoryOrders[b] ?? 999));

  const totalNews = categoriesWithNews.reduce((acc, [, news]) => acc + news.length, 0);
  const totalSections = categoriesWithNews.length;

  const getDomain = (url?: string) => {
    if (!url) return "";
    try {
      return new URL(url).hostname.replace(/^www\./, "").toUpperCase();
    } catch {
      return "";
    }
  };

  const pad2 = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="overflow-hidden rounded-[14px] border bg-white"
      style={{
        borderColor: "var(--otto-rule)",
        boxShadow: "var(--otto-shadow-1)",
      }}
    >
      {/* Header con opciones de edición */}
      <div
        className="sticky top-0 z-50 bg-white/95 px-6 py-4 backdrop-blur"
        style={{ borderBottom: "1px solid var(--otto-rule)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="font-mono-otto rounded-[6px] px-2 py-1 text-[10px] font-semibold uppercase"
              style={{
                background: "var(--otto-primary-soft)",
                color: "var(--otto-primary-ink)",
                letterSpacing: ".14em",
              }}
            >
              ● Modo edición
            </span>
            <div>
              <h2
                className="font-display text-[18px] font-bold capitalize leading-tight"
                style={{
                  letterSpacing: "-.3px",
                  color: "var(--otto-ink)",
                }}
              >
                {capitalizedDate}
              </h2>
              <p
                className="font-mono-otto mt-0.5 text-[10px] font-medium uppercase"
                style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
              >
                {totalNews} {totalNews === 1 ? "nota" : "notas"} · {totalSections}{" "}
                {totalSections === 1 ? "sección" : "secciones"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowManualNewsDialog(true)}
              variant="outline"
              size="sm"
              className="gap-2"
              style={{ borderColor: "var(--otto-rule)" }}
            >
              <Plus className="h-4 w-4" />
              Agregar manual
            </Button>
            <Button
              onClick={enhanceAllWithAI}
              variant="outline"
              size="sm"
              className="gap-2"
              style={{ borderColor: "var(--otto-rule)" }}
            >
              <Sparkles className="h-4 w-4" />
              Mejorar todo con IA
            </Button>
            {hasChanges && (
              <Button
                onClick={saveAllChanges}
                disabled={isSaving}
                size="sm"
                className="gap-2 text-white"
                style={{
                  background: "var(--otto-primary)",
                  boxShadow: "0 4px 12px rgba(214,40,40,.3)",
                }}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar cambios
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Video del Boletín (MP4) */}
      <div
        className="p-8"
        style={{
          borderBottom: "1px solid var(--otto-rule)",
          background: "var(--otto-bg)",
        }}
      >
        <div className="mb-3 flex items-center gap-3">
          <Video className="h-5 w-5" style={{ color: "var(--otto-primary)" }} />
          <h3
            className="font-display text-[16px] font-bold"
            style={{ letterSpacing: "-.3px", color: "var(--otto-ink)" }}
          >
            Video del boletín
          </h3>
        </div>
        <p className="mb-3 text-sm" style={{ color: "var(--otto-muted)" }}>
          Sube un video MP4 para mostrar en la columna izquierda del boletín público. Máximo 150MB.
        </p>

        {/* Upload button */}
        {!manualVideoUrl && (
          <div className="flex gap-2 mb-3">
            <label className="flex-1">
              <input
                type="file"
                accept="video/mp4"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (file.type !== "video/mp4") {
                    toast.error("Solo se aceptan archivos MP4.");
                    return;
                  }

                  if (file.size > 150 * 1024 * 1024) {
                    toast.error("El video es demasiado grande. Máximo 150MB.");
                    return;
                  }

                  setIsUploadingVideo(true);
                  try {
                    const formData = new FormData();
                    formData.append("file", file);

                    const response = await fetch("/api/upload/video", {
                      method: "POST",
                      body: formData,
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => null);
                      throw new Error(
                        errorData?.error || errorData?.details || `Error del servidor (HTTP ${response.status})`
                      );
                    }

                    const result = await response.json();
                    setManualVideoUrl(result.url);
                    setHasChanges(true);
                    toast.success("Video subido correctamente");
                  } catch (error) {
                    console.error("Error uploading video:", error);
                    const msg = (error as Error).message || "Error desconocido";
                    toast.error(`Error al subir el video: ${msg}`);
                  } finally {
                    setIsUploadingVideo(false);
                  }
                  e.target.value = "";
                }}
                disabled={isUploadingVideo}
              />
              <div
                className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-dashed bg-white px-4 py-3 transition-colors hover:bg-[var(--otto-primary-soft)]"
                style={{ borderColor: "var(--otto-primary)" }}
              >
                {isUploadingVideo ? (
                  <>
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      style={{ color: "var(--otto-primary)" }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: "var(--otto-primary-ink)" }}
                    >
                      Subiendo video…
                    </span>
                  </>
                ) : (
                  <>
                    <Upload
                      className="h-5 w-5"
                      style={{ color: "var(--otto-primary)" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--otto-primary-ink)" }}
                    >
                      Haz clic para subir video MP4
                    </span>
                  </>
                )}
              </div>
            </label>
          </div>
        )}

        {/* Video preview */}
        {manualVideoUrl && (
          <div className="relative mt-4">
            <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden bg-black border">
              <video
                src={manualVideoUrl}
                controls
                className="w-full"
                style={{ maxHeight: "300px" }}
              >
                Tu navegador no soporta el elemento de video.
              </video>
            </div>
            {/* Botón para quitar video */}
            <div className="flex justify-center mt-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setManualVideoUrl("");
                  setHasChanges(true);
                }}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar Video
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contenido del boletín */}
      <div className="px-6 py-8 md:px-8">
        {categoriesWithNews.map(([category, news], categoryIndex) => (
          <section key={category} className="mb-14">
            {/* Header de categoría — patrón editorial */}
            <div className="mb-6 flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: "var(--otto-rule)" }}>
              <div className="flex items-baseline gap-3">
                <span
                  className="font-mono-otto text-[11px] font-bold uppercase"
                  style={{
                    color: "var(--otto-primary)",
                    letterSpacing: ".18em",
                  }}
                >
                  ▬ {(categoryNames[category] || category).toUpperCase()} · {pad2(categoryIndex + 1)}
                </span>
              </div>
              <span
                className="font-mono-otto text-[10px] font-medium uppercase"
                style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
              >
                {news.length} {news.length === 1 ? "nota" : "notas"}
              </span>
            </div>

            {/* Noticias de la categoría */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd(category)}
            >
              <SortableContext
                items={news.map((a) => a.id || "")}
                strategy={verticalListSortingStrategy}
              >
            <div className="space-y-5">
              {news.map((article: EditableArticle, articleIndex: number) => (
                <SortableNewsItem
                  key={article.id}
                  id={article.id || ""}
                  isEditing={!!article.isEditing}
                  selected={selectedIds.has(article.id || "")}
                >
                  {!article.isEditing ? (
                    /* ============ MODO COMPACTO (FILA) ============ */
                    <div className="flex items-stretch gap-3 p-3">
                      {/* Checkbox de selección */}
                      <label
                        className="flex flex-shrink-0 items-start pt-1 opacity-0 transition-opacity group-hover:opacity-100 has-[:checked]:opacity-100"
                        title="Seleccionar para acciones masivas"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(article.id || "")}
                          onChange={() => toggleSelect(article.id || "")}
                          className="h-4 w-4 cursor-pointer accent-[var(--otto-primary)]"
                        />
                      </label>

                      {/* Thumbnail lateral */}
                      <div
                        className="relative flex-shrink-0 overflow-hidden rounded-[8px] bg-[var(--otto-bg)]"
                        style={{ width: "180px", height: "112px" }}
                      >
                        {article.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-6 w-6" style={{ color: "var(--otto-muted)" }} />
                          </div>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        {/* Meta line */}
                        <div
                          className="font-mono-otto mb-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase"
                          style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
                        >
                          <span style={{ color: "var(--otto-ink)", fontWeight: 700 }}>
                            #{pad2(articleIndex + 1)}
                          </span>
                          <span aria-hidden>·</span>
                          <span style={{ color: "var(--otto-primary)" }}>
                            {(categoryNames[category] || category).toUpperCase()}
                          </span>
                          {article.source || getDomain(article.url) ? (
                            <>
                              <span aria-hidden>·</span>
                              <span>{article.source || getDomain(article.url)}</span>
                            </>
                          ) : null}
                          {article.enhancedTitle && article.enhancedTitle !== article.title && (
                            <>
                              <span aria-hidden>·</span>
                              <span
                                className="inline-flex items-center gap-1"
                                style={{ color: "var(--otto-primary)" }}
                              >
                                <Sparkles className="h-3 w-3" />
                                IA
                              </span>
                            </>
                          )}
                        </div>

                        {/* Título */}
                        <h3
                          className="font-display text-[16px] font-bold leading-snug"
                          style={{
                            color: "var(--otto-ink)",
                            letterSpacing: "-.2px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {article.enhancedTitle || article.title}
                        </h3>

                        {/* Extracto */}
                        <p
                          className="mt-1 text-[13px] leading-relaxed"
                          style={{
                            color: "var(--otto-muted)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {article.enhancedSummary || article.content}
                        </p>

                        {/* Footer compacto: leer más */}
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono-otto mt-auto pt-2 text-[10px] font-semibold uppercase transition-opacity hover:opacity-70"
                            style={{
                              color: "var(--otto-primary)",
                              letterSpacing: ".14em",
                              alignSelf: "flex-start",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Abrir fuente →
                          </a>
                        )}
                      </div>

                      {/* Acciones siempre visibles */}
                      <div className="flex flex-shrink-0 flex-col items-end justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => enhanceWithAI(category as string, article.id!)}
                            disabled={article.isEnhancing}
                            className="font-mono-otto inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[10px] font-semibold uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
                            style={{
                              background: "var(--otto-primary-soft)",
                              color: "var(--otto-primary-ink)",
                              letterSpacing: ".12em",
                            }}
                            title="Mejorar con IA"
                          >
                            {article.isEnhancing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            IA
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleEdit(category as string, article.id!)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border bg-white transition-colors hover:bg-[var(--otto-bg)]"
                            style={{ borderColor: "var(--otto-rule)", color: "var(--otto-ink)" }}
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteArticle(category as string, article.id!)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border bg-white transition-colors hover:border-[var(--otto-primary)] hover:bg-[var(--otto-primary-soft)]"
                            style={{ borderColor: "var(--otto-rule)", color: "var(--otto-primary)" }}
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                  /* ============ MODO EDICIÓN (EXPANDIDO) ============ */
                  <div className="p-5">
                  {/* Botones de acción modo edición */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => enhanceWithAI(category as string, article.id!)}
                      disabled={article.isEnhancing}
                      className="font-mono-otto inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[10px] font-semibold uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{
                        background: "var(--otto-primary-soft)",
                        color: "var(--otto-primary-ink)",
                        letterSpacing: ".12em",
                      }}
                    >
                      {article.isEnhancing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      Mejorar IA
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(category as string, article.id!)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: "var(--otto-primary)" }}
                      title="Guardar"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleEdit(category as string, article.id!)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border bg-white transition-colors hover:bg-[var(--otto-bg)]"
                      style={{ borderColor: "var(--otto-rule)", color: "var(--otto-ink)" }}
                      title="Cancelar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Header modo edición */}
                  <div
                    className="font-mono-otto mb-4 text-[10px] font-semibold uppercase"
                    style={{ color: "var(--otto-primary)", letterSpacing: ".18em" }}
                  >
                    ◉ Editando · #{pad2(articleIndex + 1)}
                  </div>

                  {/* Selector de categoría en modo edición */}
                  {article.isEditing && (
                    <div className="mb-4 flex gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
                        <Select
                          value={article.editedCategory || category}
                          onValueChange={(value) => updateArticle(
                            category as string,
                            article.id!,
                            { editedCategory: value, editedSubcategory: value === "ultima_hora" ? (article.editedSubcategory || "") : "" }
                          )}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryNames)
                              .sort(([a], [b]) => (categoryOrders[a] ?? 999) - (categoryOrders[b] ?? 999))
                              .map(([slug, displayName]) => (
                                <SelectItem key={slug} value={slug}>
                                  {displayName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(article.editedCategory || category) === "ultima_hora" && (
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Subcategoría</label>
                          <Select
                            value={article.editedSubcategory || ""}
                            onValueChange={(value) => updateArticle(
                              category as string,
                              article.id!,
                              { editedSubcategory: value }
                            )}
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Sin subcategoría" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(categoryNames)
                                .filter(([slug]) => slug !== "ultima_hora")
                                .sort(([a], [b]) => (categoryOrders[a] ?? 999) - (categoryOrders[b] ?? 999))
                                .map(([slug, displayName]) => (
                                  <SelectItem key={slug} value={slug}>
                                    {displayName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Imagen — modo edición */}
                  <div className="mb-4">
                    <label
                      className="font-mono-otto mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase"
                      style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Imagen de la noticia
                    </label>

                    <div className="mb-3 flex gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              uploadImage(
                                category as string,
                                article.id!,
                                file
                              );
                            }
                            e.target.value = '';
                          }}
                          disabled={article.isUploading}
                        />
                        <div
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-dashed bg-white px-4 py-3 transition-colors hover:bg-[var(--otto-primary-soft)]"
                          style={{ borderColor: "var(--otto-primary)" }}
                        >
                          {article.isUploading ? (
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
                              <Upload
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
                    </div>

                    {/* Vista previa más pequeña en modo edición */}
                    {(article.editedImageUrl || article.imageUrl) && (
                      <div
                        className="relative overflow-hidden rounded-[10px] border bg-[var(--otto-bg)]"
                        style={{
                          aspectRatio: "16 / 9",
                          borderColor: "var(--otto-rule)",
                          maxWidth: "420px",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={article.editedImageUrl || article.imageUrl}
                          alt="Vista previa"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        {article.editedImageUrl && (
                          <button
                            type="button"
                            onClick={() => updateArticle(
                              category as string,
                              article.id!,
                              { editedImageUrl: '' }
                            )}
                            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
                            style={{ background: "var(--otto-primary)" }}
                            title="Quitar imagen"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {!article.editedImageUrl && (
                      <div className="mt-2" style={{ maxWidth: "420px" }}>
                        <p
                          className="font-mono-otto mb-1 text-[10px] font-medium uppercase"
                          style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
                        >
                          O pega una URL
                        </p>
                        <Input
                          value=""
                          onChange={(e) => updateArticle(
                            category as string,
                            article.id!,
                            { editedImageUrl: e.target.value }
                          )}
                          placeholder="https://ejemplo.com/imagen.jpg"
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Título */}
                  <div className="mb-3">
                    <label
                      className="font-mono-otto mb-1.5 block text-[10px] font-semibold uppercase"
                      style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
                    >
                      Título
                    </label>
                    <Input
                      value={article.editedTitle || ''}
                      onChange={(e) => updateArticle(
                        category as string,
                        article.id!,
                        { editedTitle: e.target.value }
                      )}
                      className="font-display text-base font-bold"
                      style={{ color: "var(--otto-ink)" }}
                      placeholder="Título de la noticia"
                    />
                  </div>

                  {/* Resumen/Contenido */}
                  <div className="mb-3">
                    <label
                      className="font-mono-otto mb-1.5 block text-[10px] font-semibold uppercase"
                      style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
                    >
                      Resumen
                    </label>
                    <Textarea
                      value={article.editedSummary || ''}
                      onChange={(e) => updateArticle(
                        category as string,
                        article.id!,
                        { editedSummary: e.target.value }
                      )}
                      className="min-h-[140px] text-sm leading-relaxed"
                      placeholder="Resumen de la noticia"
                    />
                  </div>

                  {/* URL y Fuente */}
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="font-mono-otto mb-1.5 block text-[10px] font-semibold uppercase"
                        style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
                      >
                        URL (Leer más)
                      </label>
                      <Input
                        type="url"
                        value={article.editedUrl || ''}
                        onChange={(e) => updateArticle(
                          category as string,
                          article.id!,
                          { editedUrl: e.target.value }
                        )}
                        placeholder="https://..."
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label
                        className="font-mono-otto mb-1.5 block text-[10px] font-semibold uppercase"
                        style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
                      >
                        Fuente
                      </label>
                      <Input
                        value={article.editedSource || ''}
                        onChange={(e) => updateArticle(
                          category as string,
                          article.id!,
                          { editedSource: e.target.value }
                        )}
                        placeholder="Ej: Primicias, El Comercio…"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  </div>
                  )}
                </SortableNewsItem>
              ))}
            </div>
              </SortableContext>
            </DndContext>
          </section>
        ))}
      </div>

      {/* Barra flotante de bulk actions */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-[12px] border bg-white px-4 py-2.5"
          style={{
            borderColor: "var(--otto-rule)",
            boxShadow: "0 12px 32px rgba(14,14,16,.18)",
          }}
        >
          <span
            className="font-mono-otto text-[10px] font-semibold uppercase"
            style={{ color: "var(--otto-ink)", letterSpacing: ".14em" }}
          >
            <span style={{ color: "var(--otto-primary)" }}>
              {selectedIds.size}
            </span>{" "}
            {selectedIds.size === 1 ? "noticia" : "noticias"}
          </span>
          <div
            className="h-5 w-px"
            style={{ background: "var(--otto-rule)" }}
          />
          <button
            type="button"
            onClick={bulkEnhance}
            disabled={bulkActionRunning}
            className="font-mono-otto inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[10px] font-semibold uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              background: "var(--otto-primary-soft)",
              color: "var(--otto-primary-ink)",
              letterSpacing: ".14em",
            }}
          >
            {bulkActionRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Mejorar IA
          </button>
          <button
            type="button"
            onClick={bulkDelete}
            disabled={bulkActionRunning}
            className="font-mono-otto inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[10px] font-semibold uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background: "var(--otto-primary)",
              letterSpacing: ".14em",
            }}
          >
            <Trash2 className="h-3 w-3" />
            Eliminar
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="font-mono-otto text-[10px] font-medium uppercase transition-opacity hover:opacity-70"
            style={{ color: "var(--otto-muted)", letterSpacing: ".14em" }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Indicador de cambios sin guardar */}
      {hasChanges && (
        <div
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-[10px] border bg-white px-4 py-2.5"
          style={{
            borderColor: "var(--otto-rule)",
            boxShadow: "0 8px 24px rgba(14,14,16,.12)",
          }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: "var(--otto-primary)",
              boxShadow: "0 0 0 4px rgba(214,40,40,.18)",
            }}
          />
          <AlertCircle className="h-4 w-4" style={{ color: "var(--otto-primary)" }} />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--otto-ink)" }}
          >
            Tienes cambios sin guardar
          </span>
        </div>
      )}

      {/* Manual News Dialog */}
      <ManualNewsFormDialog
        open={showManualNewsDialog}
        onOpenChange={setShowManualNewsDialog}
        bulletinId={bulletinId}
        onSuccess={() => {
          // Reload the page to show the new news
          window.location.reload();
        }}
      />
    </div>
  );
}