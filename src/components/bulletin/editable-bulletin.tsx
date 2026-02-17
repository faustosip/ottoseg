"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Video
} from "lucide-react";
import { ManualNewsFormDialog } from "./manual-news-form";
import { toast } from "sonner";
import type { ClassifiedNews, ClassifiedArticle } from "@/lib/news/classifier";

/**
 * Artículo extendido con campos editables
 */
interface EditableArticle extends ClassifiedArticle {
  id?: string;
  enhancedTitle?: string;
  enhancedSummary?: string;
  editedImageUrl?: string;
  isEditing?: boolean;
  isEnhancing?: boolean;
  isUploading?: boolean;
  editedTitle?: string;
  editedSummary?: string;
}

/**
 * Datos editables del boletín - ahora dinámico basado en categorías
 */
type EditableBulletinData = Record<string, EditableArticle[]>;

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
        enhancedSummary: article.content,
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
        editedImageUrl: undefined
      });
    } else {
      // Entrar en modo edición
      updateArticle(category, articleId, {
        isEditing: true,
        editedTitle: article.enhancedTitle || article.title,
        editedSummary: article.enhancedSummary || article.content,
        editedImageUrl: article.imageUrl || ''
      });
    }
  };

  /**
   * Guardar cambios de edición manual
   */
  const saveEdit = (category: string, articleId: string) => {
    const article = bulletinData[category].find(a => a.id === articleId);
    if (!article) return;

    updateArticle(category, articleId, {
      enhancedTitle: article.editedTitle,
      enhancedSummary: article.editedSummary,
      imageUrl: article.editedImageUrl || article.imageUrl,
      isEditing: false,
      editedTitle: undefined,
      editedSummary: undefined,
      editedImageUrl: undefined
    });

    toast.success('Cambios guardados');
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
          url: article.url,
          source: article.source,
          imageUrl: article.imageUrl,
          // Solo incluir los campos que forman parte de ClassifiedArticle
          // No agregar campos adicionales como originalTitle/originalContent
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

  return (
    <div className="mx-auto bg-white" style={{ width: "1024px", minHeight: "100vh" }}>
      {/* Header con opciones de edición */}
      <div className="sticky top-0 z-50 bg-white border-b p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Modo Edición - {capitalizedDate}</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowManualNewsDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Noticia Manual
          </Button>
          <Button
            onClick={enhanceAllWithAI}
            variant="outline"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Mejorar Todo con IA
          </Button>
          {hasChanges && (
            <Button
              onClick={saveAllChanges}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar Cambios
            </Button>
          )}
        </div>
      </div>

      {/* Video del Boletín (MP4) */}
      <div className="p-8 border-b bg-purple-50">
        <div className="flex items-center gap-3 mb-3">
          <Video className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-900">Video del Boletín</h3>
        </div>
        <p className="text-sm text-purple-700 mb-3">
          Sube un video MP4 para mostrar en la columna izquierda del boletín público. Máximo 50MB.
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

                  if (file.size > 50 * 1024 * 1024) {
                    toast.error("El video es demasiado grande. Máximo 50MB.");
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
                      const error = await response.json();
                      throw new Error(error.error || "Error al subir video");
                    }

                    const result = await response.json();
                    setManualVideoUrl(result.url);
                    setHasChanges(true);
                    toast.success("Video subido correctamente");
                  } catch (error) {
                    console.error("Error uploading video:", error);
                    toast.error((error as Error).message || "Error al subir el video");
                  } finally {
                    setIsUploadingVideo(false);
                  }
                  e.target.value = "";
                }}
                disabled={isUploadingVideo}
              />
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-100 transition-colors bg-white">
                {isUploadingVideo ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    <span className="text-sm text-purple-600">Subiendo video...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-purple-500" />
                    <span className="text-sm text-purple-700 font-medium">
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
      <div className="p-8">
        {categoriesWithNews.map(([category, news], categoryIndex) => (
          <section key={category} className="mb-16">
            {/* Título de categoría */}
            <h2 className="text-3xl font-bold mb-8 underline">
              {categoryIndex + 1}. {categoryNames[category] || category}
            </h2>

            {/* Noticias de la categoría */}
            <div className="space-y-8">
              {news.map((article: EditableArticle) => (
                <Card key={article.id} className="p-6 relative">
                  {/* Botones de acción */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => enhanceWithAI(category as string, article.id!)}
                      disabled={article.isEnhancing}
                      className="gap-1"
                    >
                      {article.isEnhancing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      Mejorar con IA
                    </Button>

                    {article.isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => saveEdit(category as string, article.id!)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleEdit(category as string, article.id!)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleEdit(category as string, article.id!)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteArticle(category as string, article.id!)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Imagen arriba (layout vertical) */}
                  {article.isEditing ? (
                    <div className="mb-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <ImageIcon className="h-4 w-4" />
                        Imagen de la noticia
                      </label>

                      {/* Botón de subir imagen */}
                      <div className="flex gap-2 mb-3">
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
                          <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                            {article.isUploading ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                <span className="text-sm text-blue-600">Subiendo imagen...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  Haz clic para subir una imagen
                                </span>
                              </>
                            )}
                          </div>
                        </label>
                      </div>

                      {/* Vista previa de imagen */}
                      {article.editedImageUrl && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={article.editedImageUrl}
                            alt="Vista previa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          {/* Botón para quitar imagen */}
                          <button
                            type="button"
                            onClick={() => updateArticle(
                              category as string,
                              article.id!,
                              { editedImageUrl: '' }
                            )}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Quitar imagen"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {/* Opción para pegar URL */}
                      {!article.editedImageUrl && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">O pega una URL de imagen:</p>
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
                  ) : article.imageUrl ? (
                    <div className="w-full h-64 mb-4 rounded-lg overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : null}

                  {/* Título */}
                  <div className="mb-4">
                    {article.isEditing ? (
                      <Input
                        value={article.editedTitle || ''}
                        onChange={(e) => updateArticle(
                          category as string,
                          article.id!,
                          { editedTitle: e.target.value }
                        )}
                        className="text-xl font-bold text-blue-700"
                        placeholder="Título de la noticia"
                      />
                    ) : (
                      <h3 className="text-2xl font-bold text-blue-700">
                        {article.enhancedTitle || article.title}
                      </h3>
                    )}

                    {/* Indicador si fue mejorado con IA */}
                    {article.enhancedTitle && article.enhancedTitle !== article.title && (
                      <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <Sparkles className="h-3 w-3" />
                        Mejorado con IA
                      </span>
                    )}
                  </div>

                  {/* Resumen/Contenido */}
                  <div className="mb-4">
                    {article.isEditing ? (
                      <Textarea
                        value={article.editedSummary || ''}
                        onChange={(e) => updateArticle(
                          category as string,
                          article.id!,
                          { editedSummary: e.target.value }
                        )}
                        className="min-h-[100px] text-base"
                        placeholder="Resumen de la noticia"
                      />
                    ) : (
                      <p className="text-base leading-relaxed">
                        {article.enhancedSummary || article.content}
                      </p>
                    )}
                  </div>

                  {/* Link "Leer más" */}
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Leer más →
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Indicador de cambios sin guardar */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Tienes cambios sin guardar
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