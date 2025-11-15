"use client";

import { useState } from "react";
import {
  DollarSign,
  Landmark,
  Users,
  Shield,
  Globe,
  Car,
  Edit2,
  RotateCw,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tipo de categoría de noticia
 */
export type NewsCategory =
  | "economia"
  | "politica"
  | "sociedad"
  | "seguridad"
  | "internacional"
  | "vial";

/**
 * Props para CategorySection
 */
export interface CategorySectionProps {
  /**
   * Categoría de la noticia
   */
  category: NewsCategory;

  /**
   * Título de la noticia
   */
  title?: string;

  /**
   * Contenido del resumen
   */
  content: string;

  /**
   * Si la sección es editable
   */
  editable?: boolean;

  /**
   * Callback cuando se guarda una edición
   */
  onSave?: (newContent: string) => void;

  /**
   * Callback cuando se solicita regenerar
   */
  onRegenerate?: () => void;

  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Configuración de categorías con iconos y colores
 */
const CATEGORY_CONFIG: Record<
  NewsCategory,
  {
    name: string;
    Icon: typeof DollarSign;
    color: string;
    bgColor: string;
  }
> = {
  economia: {
    name: "Economía",
    Icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  politica: {
    name: "Política",
    Icon: Landmark,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  sociedad: {
    name: "Sociedad",
    Icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  seguridad: {
    name: "Seguridad",
    Icon: Shield,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  internacional: {
    name: "Internacional",
    Icon: Globe,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  vial: {
    name: "Vial",
    Icon: Car,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
};

/**
 * Componente CategorySection
 *
 * Muestra una sección de categoría con icono, título, contenido y
 * contador de palabras. Soporta modo edición inline.
 *
 * @example
 * ```tsx
 * <CategorySection
 *   category="economia"
 *   title="Banco Central ajusta tasas"
 *   content="El Banco Central anunció..."
 *   editable={true}
 *   onSave={handleSave}
 *   onRegenerate={handleRegenerate}
 * />
 * ```
 */
export function CategorySection({
  category,
  title,
  content,
  editable = false,
  onSave,
  onRegenerate,
  className,
}: CategorySectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const config = CATEGORY_CONFIG[category];
  const Icon = config.Icon;

  // Calcular palabras
  const wordCount = content.trim().split(/\s+/).length;

  /**
   * Guardar edición
   */
  const handleSave = () => {
    if (onSave && editedContent.trim()) {
      onSave(editedContent.trim());
      setIsEditing(false);
    }
  };

  /**
   * Cancelar edición
   */
  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "category-section rounded-lg border border-gray-200 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b",
          config.bgColor
        )}
      >
        {/* Categoría + Icono */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm",
              config.color
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className={cn("font-bold text-lg", config.color)}>
              {config.name}
            </h3>
            <p className="text-xs text-gray-500">{wordCount} palabras</p>
          </div>
        </div>

        {/* Botones de acción (solo si editable) */}
        {editable && !isEditing && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Editar
            </Button>
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                className="gap-1.5"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Regenerar
              </Button>
            )}
          </div>
        )}

        {/* Botones de guardar/cancelar (solo en modo edición) */}
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Guardar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 bg-white">
        {/* Título (si existe) */}
        {title && (
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            {title}
          </h4>
        )}

        {/* Contenido editable o estático */}
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-sm leading-relaxed resize-y"
            placeholder="Ingrese el contenido del resumen..."
            aria-label={`Editar contenido de ${config.name}`}
          />
        ) : (
          <p className="text-gray-700 leading-relaxed text-justify">
            {content}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Helper para obtener la configuración de una categoría
 */
export function getCategoryConfig(category: NewsCategory) {
  return CATEGORY_CONFIG[category];
}

/**
 * Helper para obtener todas las categorías
 */
export function getAllCategories(): NewsCategory[] {
  return Object.keys(CATEGORY_CONFIG) as NewsCategory[];
}
