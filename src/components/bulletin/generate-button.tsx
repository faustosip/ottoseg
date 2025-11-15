"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, RotateCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Estados del proceso de generación
 */
export type GenerationState = "idle" | "loading" | "success" | "error";

/**
 * Pasos del proceso de generación
 */
export interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "error";
}

/**
 * Props para GenerateButton
 */
export interface GenerateButtonProps {
  /**
   * Callback al hacer click en generar
   */
  onGenerate: () => Promise<void>;

  /**
   * Callback al reintentar (después de error)
   */
  onRetry?: () => Promise<void>;

  /**
   * Estado actual del botón
   */
  state?: GenerationState;

  /**
   * Pasos del proceso (opcional, para mostrar progreso detallado)
   */
  steps?: GenerationStep[];

  /**
   * Progreso en porcentaje (0-100)
   */
  progress?: number;

  /**
   * Mensaje de error (si state es 'error')
   */
  errorMessage?: string;

  /**
   * Si el botón está deshabilitado
   */
  disabled?: boolean;

  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Pasos por defecto del proceso de generación
 */
const DEFAULT_STEPS: GenerationStep[] = [
  {
    id: "scraping",
    label: "Scraping noticias",
    status: "pending",
  },
  {
    id: "classifying",
    label: "Clasificando noticias",
    status: "pending",
  },
  {
    id: "summarizing",
    label: "Generando resúmenes",
    status: "pending",
  },
  {
    id: "video",
    label: "Preparando video",
    status: "pending",
  },
];

/**
 * Componente GenerateButton
 *
 * Botón para generar boletines con estados de progreso visual,
 * indicadores de pasos, y manejo de errores.
 *
 * @example
 * ```tsx
 * <GenerateButton
 *   onGenerate={handleGenerate}
 *   state="loading"
 *   progress={65}
 *   steps={[...]}
 * />
 * ```
 */
export function GenerateButton({
  onGenerate,
  onRetry,
  state = "idle",
  steps = DEFAULT_STEPS,
  progress = 0,
  errorMessage,
  disabled = false,
  className,
}: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Maneja el click del botón
   */
  const handleClick = async () => {
    if (state === "error" && onRetry) {
      // Si hay error y existe onRetry, usar ese callback
      setIsGenerating(true);
      try {
        await onRetry();
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Caso normal: generar boletín
      setIsGenerating(true);
      try {
        await onGenerate();
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const isLoading = state === "loading" || isGenerating;
  const isDisabled = disabled || isLoading;

  return (
    <div className={cn("generate-button-container space-y-4", className)}>
      {/* Botón principal */}
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        size="lg"
        className={cn(
          "w-full font-semibold transition-all",
          state === "success" && "bg-green-600 hover:bg-green-700",
          state === "error" && "bg-red-600 hover:bg-red-700"
        )}
      >
        {/* Icono según estado */}
        {state === "idle" && <Zap className="mr-2 h-5 w-5" />}
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {state === "success" && <CheckCircle2 className="mr-2 h-5 w-5" />}
        {state === "error" && (
          <>
            <XCircle className="mr-2 h-5 w-5" />
            {onRetry && <RotateCw className="ml-2 h-4 w-4" />}
          </>
        )}

        {/* Texto según estado */}
        {state === "idle" && "Generar Boletín"}
        {isLoading && "Generando..."}
        {state === "success" && "¡Generado Exitosamente!"}
        {state === "error" && (onRetry ? "Reintentar" : "Error al Generar")}
      </Button>

      {/* Barra de progreso (solo cuando está cargando) */}
      {isLoading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center text-gray-600 font-medium">
            {Math.round(progress)}% completado
          </p>
        </div>
      )}

      {/* Lista de pasos (solo cuando está cargando) */}
      {isLoading && steps.length > 0 && (
        <div className="space-y-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Progreso:
          </h4>
          <ul className="space-y-2">
            {steps.map((step) => (
              <li
                key={step.id}
                className="flex items-center gap-3 text-sm"
              >
                {/* Icono de estado */}
                {step.status === "pending" && (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
                )}
                {step.status === "in_progress" && (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                {step.status === "completed" && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
                {step.status === "error" && (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}

                {/* Label del paso */}
                <span
                  className={cn(
                    "font-medium",
                    step.status === "pending" && "text-gray-400",
                    step.status === "in_progress" && "text-blue-700",
                    step.status === "completed" && "text-green-700",
                    step.status === "error" && "text-red-700"
                  )}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mensaje de error */}
      {state === "error" && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 mb-1">
                Error al generar boletín
              </h4>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de éxito */}
      {state === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                ¡Boletín generado exitosamente!
              </h4>
              <p className="text-sm text-green-700">
                El boletín está listo para ser publicado.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
