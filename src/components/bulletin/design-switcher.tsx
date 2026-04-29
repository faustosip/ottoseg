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
      className={`flex flex-col items-center justify-center gap-3 rounded-[14px] border bg-white p-4 sm:flex-row ${className}`}
      role="group"
      aria-label="Selector de diseño de boletín"
      style={{
        borderColor: "var(--otto-rule)",
        boxShadow: "var(--otto-shadow-1)",
      }}
    >
      <span
        className="font-mono-otto whitespace-nowrap"
        style={{
          fontSize: "10px",
          letterSpacing: ".14em",
          color: "var(--otto-muted)",
        }}
      >
        Estilo de visualización
      </span>

      <div className="flex gap-2">
        <button
          onClick={() => handleDesignChange("classic")}
          disabled={isTransitioning}
          className={`relative flex flex-col items-center gap-1.5 rounded-[10px] border px-4 py-2.5 transition-all duration-200 ${
            isTransitioning ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          } focus:outline-none focus:ring-2 focus:ring-offset-2`}
          style={{
            background:
              currentDesign === "classic"
                ? "var(--otto-primary-soft)"
                : "var(--otto-surface)",
            borderColor:
              currentDesign === "classic"
                ? "var(--otto-primary)"
                : "var(--otto-rule)",
          }}
          aria-label="Cambiar a diseño clásico"
          aria-pressed={currentDesign === "classic"}
        >
          <Monitor
            className="h-5 w-5"
            style={{
              color:
                currentDesign === "classic"
                  ? "var(--otto-primary)"
                  : "var(--otto-muted)",
            }}
          />
          <span
            className="text-[12px] font-semibold"
            style={{
              color:
                currentDesign === "classic"
                  ? "var(--otto-primary-ink)"
                  : "var(--otto-ink-2)",
            }}
          >
            {getDesignDisplayName("classic")}
          </span>
        </button>

        <button
          onClick={() => handleDesignChange("modern")}
          disabled={isTransitioning}
          className={`relative flex flex-col items-center gap-1.5 rounded-[10px] border px-4 py-2.5 transition-all duration-200 ${
            isTransitioning ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          } focus:outline-none focus:ring-2 focus:ring-offset-2`}
          style={{
            background:
              currentDesign === "modern"
                ? "var(--otto-primary-soft)"
                : "var(--otto-surface)",
            borderColor:
              currentDesign === "modern"
                ? "var(--otto-primary)"
                : "var(--otto-rule)",
          }}
          aria-label="Cambiar a diseño moderno"
          aria-pressed={currentDesign === "modern"}
        >
          <Smartphone
            className="h-5 w-5"
            style={{
              color:
                currentDesign === "modern"
                  ? "var(--otto-primary)"
                  : "var(--otto-muted)",
            }}
          />
          <span
            className="text-[12px] font-semibold"
            style={{
              color:
                currentDesign === "modern"
                  ? "var(--otto-primary-ink)"
                  : "var(--otto-ink-2)",
            }}
          >
            {getDesignDisplayName("modern")}
          </span>
        </button>
      </div>

      {isTransitioning && (
        <span
          className="font-mono-otto animate-pulse"
          style={{
            fontSize: "10px",
            letterSpacing: ".1em",
            color: "var(--otto-muted)",
          }}
        >
          Cambiando…
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
