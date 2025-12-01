"use client";

import { useState } from "react";
import Image from "next/image";
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
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import type { ClassifiedNews, ClassifiedArticle } from "@/lib/news/classifier";

/**
 * Artículo extendido con campos editables
 */
interface EditableArticle extends ClassifiedArticle {
  id?: string;
  enhancedTitle?: string;
  enhancedSummary?: string;
  isEditing?: boolean;
  isEnhancing?: boolean;
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
  onSave?: (data: EditableBulletinData) => Promise<void>;
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
  onSave
}: EditableBulletinProps) {
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
        editedSummary: undefined
      });
    } else {
      // Entrar en modo edición
      updateArticle(category, articleId, {
        isEditing: true,
        editedTitle: article.enhancedTitle || article.title,
        editedSummary: article.enhancedSummary || article.content
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
      isEditing: false,
      editedTitle: undefined,
      editedSummary: undefined
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
   * Guardar todos los cambios
   */
  const saveAllChanges = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(bulletinData);
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
                  {article.imageUrl && (
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
                  )}

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
    </div>
  );
}