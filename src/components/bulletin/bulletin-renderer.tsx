"use client";

import { ClassicBulletinV2 } from "./classic-bulletin-v2";
import { ModernBulletinLayout } from "./modern-bulletin-layout";
import type { BulletinData } from "./classic-bulletin-layout";
import type { DesignVersion } from "@/lib/bulletin/design-system";
import type { ClassifiedNews } from "@/lib/news/classifier";

/**
 * Props para BulletinRenderer
 */
export interface BulletinRendererProps {
  /**
   * Datos del boletín a renderizar
   */
  bulletin: BulletinData;

  /**
   * Versión del diseño a usar ('classic' | 'modern')
   */
  design: DesignVersion;

  /**
   * Si el boletín es editable (para futuras funcionalidades)
   */
  editable?: boolean;
}

/**
 * Componente BulletinRenderer
 *
 * Componente inteligente que decide qué layout renderizar según la
 * preferencia del usuario (clásico o moderno).
 *
 * Actúa como punto de entrada único para renderizar boletines,
 * abstrayendo la lógica de selección de diseño.
 *
 * @example
 * ```tsx
 * <BulletinRenderer
 *   bulletin={bulletinData}
 *   design="classic"
 *   editable={false}
 * />
 * ```
 */
export function BulletinRenderer({
  bulletin,
  design,
  editable = false,
}: BulletinRendererProps) {
  // Validar que el diseño sea válido
  if (design !== "classic" && design !== "modern") {
    console.error(
      `Invalid design "${design}". Falling back to "classic".`
    );
    return <ClassicBulletinV2 classifiedData={convertToClassifiedNews(bulletin)} date={bulletin.date} />;
  }

  // Renderizar el layout apropiado
  switch (design) {
    case "classic":
      return <ClassicBulletinV2 classifiedData={convertToClassifiedNews(bulletin)} date={bulletin.date} />;

    case "modern":
      return <ModernBulletinLayout bulletin={bulletin} editable={editable} />;

    default:
      // Fallback a diseño clásico (TypeScript debería prevenir esto)
      console.warn(
        `Unhandled design version "${design}". Using classic layout.`
      );
      return <ClassicBulletinV2 classifiedData={convertToClassifiedNews(bulletin)} date={bulletin.date} />;
  }
}

/**
 * Convierte BulletinData a ClassifiedNews para ClassicBulletinV2
 */
function convertToClassifiedNews(bulletin: BulletinData): ClassifiedNews {
  return {
    economia: bulletin.economia?.news || [],
    politica: bulletin.politica?.news || [],
    sociedad: bulletin.sociedad?.news || [],
    seguridad: bulletin.seguridad?.news || [],
    internacional: bulletin.internacional?.news || [],
    vial: bulletin.vial?.news || [],
  };
}
