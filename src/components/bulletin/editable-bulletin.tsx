"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Verifica si una URL parece ser una URL de imagen válida
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.toLowerCase();

    // Rechazar URLs de Google Maps u otras páginas web conocidas
    if (parsedUrl.hostname.includes('google.com') && pathname.includes('/maps')) {
      return false;
    }

    // Verificar extensiones de imagen comunes
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    if (imageExtensions.some(ext => pathname.endsWith(ext))) {
      return true;
    }

    // Permitir URLs de servicios de imagen conocidos
    const knownImageHosts = [
      'images.unsplash.com',
      'i.imgur.com',
      'imgur.com',
      'cloudinary.com',
      'res.cloudinary.com',
      'minback.ottoseguridadai.com',
      'supa.ottoseguridadai.com',
    ];
    if (knownImageHosts.some(host => parsedUrl.hostname.includes(host))) {
      return true;
    }

    // Por defecto, si tiene /storage/ en la ruta (típico de Supabase) o parece una imagen
    if (pathname.includes('/storage/') || pathname.includes('/image/')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
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
  Plus
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
 * Datos editables del boletín
 */
interface EditableBulletinData {
  economia: EditableArticle[];
  politica: EditableArticle[];
  sociedad: EditableArticle[];
  seguridad: EditableArticle[];
  internacional: EditableArticle[];
  vial: EditableArticle[];
}

interface EditableBulletinProps {
  bulletinId: string;
  date: Date;
  initialData: ClassifiedNews;
  initialRoadClosureMapUrl?: string | null;
  onSave?: (data: EditableBulletinData, roadClosureMapUrl?: string | null) => Promise<void>;
}

// Mapeo de categorías a español
const categoryNames: Record<string, string> = {
  economia: "Economía",
  politica: "Política",
  sociedad: "Sociedad",
  seguridad: "Seguridad",
  internacional: "Internacional",
  vial: "Vial",
};

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
  onSave
}: EditableBulletinProps) {
  const [roadClosureMapUrl, setRoadClosureMapUrl] = useState(initialRoadClosureMapUrl || "");
  const [bulletinData, setBulletinData] = useState<EditableBulletinData>(() => {
    // Convertir initialData a EditableBulletinData
    const editableData: EditableBulletinData = {} as EditableBulletinData;

    Object.keys(initialData).forEach((category) => {
      const key = category as keyof ClassifiedNews;
      editableData[key] = initialData[key].map((article, index) => ({
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
  const [isUploadingMap, setIsUploadingMap] = useState(false);

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
  const enhanceWithAI = async (category: keyof EditableBulletinData, articleId: string) => {
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
  const toggleEdit = (category: keyof EditableBulletinData, articleId: string) => {
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
  const saveEdit = (category: keyof EditableBulletinData, articleId: string) => {
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
    category: keyof EditableBulletinData,
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
  const deleteArticle = (category: keyof EditableBulletinData, articleId: string) => {
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
    category: keyof EditableBulletinData,
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
      const dataToSave: ClassifiedNews = {} as ClassifiedNews;

      Object.keys(bulletinData).forEach((category) => {
        const key = category as keyof EditableBulletinData;
        dataToSave[key] = bulletinData[key].map(article => ({
          title: article.enhancedTitle || article.title,
          content: article.enhancedSummary || article.content,
          url: article.url,
          source: article.source,
          imageUrl: article.imageUrl,
          // Solo incluir los campos que forman parte de ClassifiedArticle
          // No agregar campos adicionales como originalTitle/originalContent
        }));
      });

      await onSave(dataToSave, roadClosureMapUrl || null);
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
      const key = category as keyof EditableBulletinData;
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
        const key = category as keyof EditableBulletinData;
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

  // Obtener categorías con noticias
  const categoriesWithNews = Object.entries(bulletinData).filter(
    ([, news]) => news.length > 0
  );

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

      {/* Imagen del Mapa de Cierres Viales */}
      <div className="p-8 border-b bg-blue-50">
        <div className="flex items-center gap-3 mb-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-lg font-semibold text-blue-900">Mapa de Cierres Viales (Imagen)</h3>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          Sube una imagen o captura de pantalla del mapa de cierres viales. Esta imagen se mostrará en la sección Vial del boletín.
        </p>

        {/* Upload button */}
        <div className="flex gap-2 mb-3">
          <label className="flex-1">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Validar tipo
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

                setIsUploadingMap(true);
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
                  setRoadClosureMapUrl(result.url);
                  setHasChanges(true);
                  toast.success('Imagen del mapa subida correctamente');
                } catch (error) {
                  console.error('Error uploading map image:', error);
                  toast.error((error as Error).message || 'Error al subir la imagen');
                } finally {
                  setIsUploadingMap(false);
                }
                e.target.value = '';
              }}
              disabled={isUploadingMap}
            />
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-100 transition-colors bg-white">
              {isUploadingMap ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-600">Subiendo imagen...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-blue-700 font-medium">
                    Haz clic para subir imagen del mapa
                  </span>
                </>
              )}
            </div>
          </label>
        </div>

        {/* Vista previa de imagen */}
        {roadClosureMapUrl && (
          <div className="relative mt-4">
            {isValidImageUrl(roadClosureMapUrl) ? (
              <>
                <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden bg-gray-100 border mx-auto">
                  <Image
                    src={roadClosureMapUrl}
                    alt="Vista previa del mapa de cierres viales"
                    width={400}
                    height={192}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      toast.error('La URL no es una imagen válida. Por favor sube una imagen o usa una URL de imagen directa.');
                    }}
                  />
                </div>
                {/* Botón para quitar imagen */}
                <button
                  type="button"
                  onClick={() => {
                    setRoadClosureMapUrl('');
                    setHasChanges(true);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Quitar imagen del mapa"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">Vista previa del mapa</p>
              </>
            ) : (
              <div className="w-full max-w-md mx-auto p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">URL no válida para imagen</p>
                    <p className="text-xs text-amber-700 mt-1">
                      La URL ingresada parece ser un enlace de Google Maps u otra página web, no una imagen directa.
                      Por favor sube una imagen o usa una URL que termine en .jpg, .png, .webp, etc.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRoadClosureMapUrl('');
                        setHasChanges(true);
                      }}
                      className="mt-2 text-xs text-amber-700 underline hover:text-amber-900"
                    >
                      Borrar URL e intentar de nuevo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input de URL alternativo */}
        {!roadClosureMapUrl && (
          <div className="mt-3">
            <p className="text-xs text-blue-600 mb-1">O pega una URL de imagen directa:</p>
            <Input
              type="url"
              placeholder="https://ejemplo.com/mapa-vial.jpg (debe ser URL de imagen)"
              value={roadClosureMapUrl}
              onChange={(e) => {
                setRoadClosureMapUrl(e.target.value);
                setHasChanges(true);
              }}
              className="bg-white text-sm"
            />
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Nota: Debe ser una URL de imagen (.jpg, .png, etc.), no un enlace de Google Maps.
            </p>
          </div>
        )}
      </div>

      {/* Contenido del boletín */}
      <div className="p-8">
        {categoriesWithNews.map(([category, news], categoryIndex) => (
          <section key={category} className="mb-16">
            {/* Título de categoría */}
            <h2 className="text-3xl font-bold mb-8 underline">
              {categoryIndex + 1}. {categoryNames[category]}
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
                      onClick={() => enhanceWithAI(category as keyof EditableBulletinData, article.id!)}
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
                          onClick={() => saveEdit(category as keyof EditableBulletinData, article.id!)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleEdit(category as keyof EditableBulletinData, article.id!)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleEdit(category as keyof EditableBulletinData, article.id!)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteArticle(category as keyof EditableBulletinData, article.id!)}
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
                                  category as keyof EditableBulletinData,
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
                          <Image
                            src={article.editedImageUrl}
                            alt="Vista previa"
                            width={960}
                            height={192}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          {/* Botón para quitar imagen */}
                          <button
                            type="button"
                            onClick={() => updateArticle(
                              category as keyof EditableBulletinData,
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
                              category as keyof EditableBulletinData,
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
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        width={960}
                        height={256}
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
                          category as keyof EditableBulletinData,
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
                          category as keyof EditableBulletinData,
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