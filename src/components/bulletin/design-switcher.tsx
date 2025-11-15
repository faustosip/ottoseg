"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import type { DesignVersion } from "@/lib/bulletin/design-system";
import { getDesignDisplayName } from "@/lib/bulletin/design-system";

/**
 * Props para el componente DesignSwitcher
 */
export interface DesignSwitcherProps {
  /**
   * Diseño actualmente seleccionado
   */
  currentDesign: DesignVersion;

  /**
   * Callback cuando el usuario cambia de diseño
   */
  onDesignChange: (newDesign: DesignVersion) => void;

  /**
   * Clase CSS adicional para el contenedor
   */
  className?: string;
}

// Constante para la key de localStorage
const STORAGE_KEY = "bulletin-design-preference";

/**
 * Componente DesignSwitcher
 *
 * Permite al usuario cambiar entre los diseños Clásico y Moderno con un solo clic.
 * La preferencia se guarda automáticamente en localStorage.
 *
 * @example
 * ```tsx
 * const [design, setDesign] = useState<DesignVersion>('classic');
 *
 * <DesignSwitcher
 *   currentDesign={design}
 *   onDesignChange={setDesign}
 * />
 * ```
 */
export function DesignSwitcher({
  currentDesign,
  onDesignChange,
  className = "",
}: DesignSwitcherProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Cargar preferencia de localStorage al montar
  useEffect(() => {
    const savedDesign = localStorage.getItem(STORAGE_KEY) as DesignVersion | null;
    if (savedDesign && (savedDesign === "classic" || savedDesign === "modern")) {
      if (savedDesign !== currentDesign) {
        onDesignChange(savedDesign);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar

  /**
   * Maneja el cambio de diseño
   */
  const handleDesignChange = (newDesign: DesignVersion) => {
    if (newDesign === currentDesign) return;

    // Mostrar estado de transición
    setIsTransitioning(true);

    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, newDesign);

    // Notificar al padre
    onDesignChange(newDesign);

    // Ocultar transición después de un momento
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border ${className}`}
      role="group"
      aria-label="Selector de diseño de boletín"
    >
      {/* Label */}
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Estilo de visualización:
      </span>

      {/* Opciones */}
      <div className="flex gap-2">
        {/* Opción Clásico */}
        <button
          onClick={() => handleDesignChange("classic")}
          disabled={isTransitioning}
          className={`
            flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200
            ${currentDesign === "classic"
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800"
            }
            ${isTransitioning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          `}
          aria-label="Cambiar a diseño clásico"
          aria-pressed={currentDesign === "classic"}
        >
          <Monitor
            className={`h-5 w-5 ${currentDesign === "classic" ? "text-primary" : "text-muted-foreground"}`}
          />
          <span
            className={`text-sm font-medium ${currentDesign === "classic" ? "text-primary" : "text-muted-foreground"}`}
          >
            {getDesignDisplayName("classic")}
          </span>
          {currentDesign === "classic" && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>

        {/* Opción Moderno */}
        <button
          onClick={() => handleDesignChange("modern")}
          disabled={isTransitioning}
          className={`
            flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200
            ${currentDesign === "modern"
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800"
            }
            ${isTransitioning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          `}
          aria-label="Cambiar a diseño moderno"
          aria-pressed={currentDesign === "modern"}
        >
          <Smartphone
            className={`h-5 w-5 ${currentDesign === "modern" ? "text-primary" : "text-muted-foreground"}`}
          />
          <span
            className={`text-sm font-medium ${currentDesign === "modern" ? "text-primary" : "text-muted-foreground"}`}
          >
            {getDesignDisplayName("modern")}
          </span>
          {currentDesign === "modern" && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Indicador de transición */}
      {isTransitioning && (
        <span className="text-xs text-muted-foreground animate-pulse">
          Cambiando diseño...
        </span>
      )}
    </div>
  );
}

/**
 * Hook personalizado para gestionar el estado del diseño con persistencia
 *
 * @param defaultDesign - Diseño por defecto si no hay preferencia guardada
 * @returns [currentDesign, setDesign] - Estado del diseño y función para cambiarlo
 *
 * @example
 * ```tsx
 * const [design, setDesign] = useDesignPreference('classic');
 *
 * return (
 *   <DesignSwitcher currentDesign={design} onDesignChange={setDesign} />
 * );
 * ```
 */
export function useDesignPreference(
  defaultDesign: DesignVersion = "classic"
): [DesignVersion, (design: DesignVersion) => void] {
  const [design, setDesign] = useState<DesignVersion>(defaultDesign);

  // Cargar preferencia al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY) as DesignVersion | null;
      if (saved && (saved === "classic" || saved === "modern")) {
        setDesign(saved);
      }
    }
  }, []);

  // Función para cambiar diseño y guardar en localStorage
  const changeDesign = (newDesign: DesignVersion) => {
    setDesign(newDesign);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newDesign);
    }
  };

  return [design, changeDesign];
}
