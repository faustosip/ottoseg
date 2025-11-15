/**
 * Módulo de Generación de Resúmenes con IA
 *
 * Genera resúmenes concisos para cada categoría de noticias
 */

import {
  SUMMARIZATION_SYSTEM_PROMPT,
  SUMMARIZATION_USER_PROMPT_TEMPLATE,
  replacePlaceholders,
} from "@/lib/ai/prompts";
import { generateWithRetry, AI_TIMEOUT_SUMMARIZATION } from "@/lib/ai/providers";
import {
  updateBulletinSummaries,
  updateBulletinStatus,
  createBulletinLog,
} from "@/lib/db/queries/bulletins";
import { getActiveTemplates, getTemplateByCategory } from "@/lib/db/queries/templates";
import type { ClassifiedNews } from "./classifier";

/**
 * Resúmenes por categoría
 */
export interface BulletinSummaries {
  economia: string;
  politica: string;
  sociedad: string;
  seguridad: string;
  internacional: string;
  vial: string;
}

/**
 * Resultado de validación de resumen
 */
export interface SummaryValidation {
  valid: boolean;
  wordCount: number;
  error?: string;
}

/**
 * Constantes de configuración
 */
const DEFAULT_MAX_WORDS = 150;
const MIN_WORDS = 20;
const TOLERANCE_PERCENTAGE = 0.1; // 10% de tolerancia

/**
 * Genera resúmenes para cada categoría de noticias
 *
 * @param classifiedNews - Noticias clasificadas por categoría
 * @param bulletinId - ID del boletín
 * @returns Resúmenes generados para las 6 categorías
 *
 * @throws Error si el proceso de summarización falla completamente
 *
 * @example
 * ```ts
 * const classified = await classifyNews(rawNews, bulletinId);
 * const summaries = await summarizeByCategory(classified, bulletinId);
 * console.log(summaries.economia);
 * ```
 */
export async function summarizeByCategory(
  classifiedNews: ClassifiedNews,
  bulletinId: string
): Promise<BulletinSummaries> {
  const startTime = Date.now();

  try {
    console.log("📝 Iniciando generación de resúmenes...");

    // Crear log de inicio
    await createBulletinLog(
      bulletinId,
      "summarization",
      "in_progress",
      "Iniciando generación de resúmenes con IA",
      { startTime }
    );

    // Inicializar objeto de resúmenes
    const summaries: BulletinSummaries = {
      economia: "",
      politica: "",
      sociedad: "",
      seguridad: "",
      internacional: "",
      vial: "",
    };

    // Obtener templates activos (para futuras personalizaciones)
    const templates = await getActiveTemplates();
    console.log(`  📋 Templates activos: ${templates.length}`);

    // Categorías a procesar
    const categories = [
      "economia",
      "politica",
      "sociedad",
      "seguridad",
      "internacional",
      "vial",
    ] as const;

    let successCount = 0;
    let failCount = 0;

    // Procesar cada categoría
    for (const category of categories) {
      try {
        console.log(`\n  🔄 Procesando categoría: ${formatCategoryName(category)}`);

        const newsInCategory = classifiedNews[category];

        // Si no hay noticias, usar mensaje por defecto
        if (!newsInCategory || newsInCategory.length === 0) {
          summaries[category] =
            "No hay información disponible para esta categoría en el día de hoy.";
          console.log(`    ⚠️  Sin noticias, usando mensaje por defecto`);
          continue;
        }

        console.log(`    📰 ${newsInCategory.length} noticias en esta categoría`);

        // Obtener template de la categoría (si existe)
        const template = await getTemplateByCategory(category);
        const maxWords = template?.maxWords || DEFAULT_MAX_WORDS;

        console.log(`    📏 Máximo de palabras: ${maxWords}`);

        // Preparar datos de noticias para el prompt
        const newsData = JSON.stringify(newsInCategory, null, 2);

        // Preparar prompt
        const userPrompt = replacePlaceholders(SUMMARIZATION_USER_PROMPT_TEMPLATE, {
          CATEGORY: formatCategoryName(category),
          CLASSIFIED_NEWS: newsData,
          MAX_WORDS: maxWords.toString(),
          EXAMPLE_OUTPUT: template?.exampleOutput || "",
        });

        console.log(`    🧠 Llamando a IA para generar resumen...`);
        console.log(`    ⏱️  Timeout: ${AI_TIMEOUT_SUMMARIZATION / 1000}s (2 minutos)`);

        // Llamar a IA
        const summary = await generateWithRetry(
          SUMMARIZATION_SYSTEM_PROMPT,
          userPrompt,
          true, // usar fallback a GPT
          AI_TIMEOUT_SUMMARIZATION // timeout de 2 minutos para resúmenes
        );

        console.log(`    ✓ Resumen recibido`);

        // Limpiar resumen (remover posibles explicaciones antes/después)
        const cleanSummary = summary.trim();

        // Validar resumen
        const validation = validateSummary(cleanSummary, maxWords);

        if (!validation.valid) {
          console.warn(
            `    ⚠️  Resumen tiene advertencias: ${validation.error}`
          );
          // Continuar de todas formas, solo es una advertencia
        }

        summaries[category] = cleanSummary;

        console.log(
          `    ✅ ${formatCategoryName(category)}: ${validation.wordCount} palabras`
        );

        successCount++;
      } catch (error) {
        console.error(
          `    ❌ Error generando resumen para ${category}:`,
          error
        );

        // No fallar todo el proceso si una categoría falla
        summaries[category] =
          "Error generando el resumen para esta categoría. Por favor, intente nuevamente.";
        failCount++;

        // Crear log de error para esta categoría
        await createBulletinLog(
          bulletinId,
          `summarization_${category}`,
          "failed",
          `Error en ${formatCategoryName(category)}: ${(error as Error).message}`,
          { category, error: (error as Error).message }
        );
      }
    }

    console.log(
      `\n  📊 Resumen completo: ${successCount} éxitos, ${failCount} errores`
    );

    // Si todas las categorías fallaron, lanzar error
    if (successCount === 0) {
      throw new Error(
        "No se pudo generar ningún resumen. Todas las categorías fallaron."
      );
    }

    // Actualizar bulletin con resúmenes
    await updateBulletinSummaries(bulletinId, summaries);

    console.log("  💾 Resúmenes guardados en DB");

    // Actualizar status a 'ready' si tuvo éxito
    await updateBulletinStatus(bulletinId, "ready");

    console.log("  ✓ Status actualizado a 'ready'");

    // Crear log de completado
    const duration = Date.now() - startTime;
    await createBulletinLog(
      bulletinId,
      "summarization",
      "completed",
      `Resúmenes generados: ${successCount} categorías exitosas, ${failCount} fallidas`,
      {
        duration,
        successCount,
        failCount,
        categories: Object.keys(summaries),
      }
    );

    console.log(
      `✅ Summarización completada en ${(duration / 1000).toFixed(2)}s`
    );

    return summaries;
  } catch (error) {
    console.error("❌ Error en summarización:", error);

    const duration = Date.now() - startTime;

    // Crear log de error
    await createBulletinLog(
      bulletinId,
      "summarization",
      "failed",
      `Error en summarización: ${(error as Error).message}`,
      { duration, error: (error as Error).message }
    );

    // Actualizar status del bulletin a failed
    await updateBulletinStatus(bulletinId, "failed");

    throw new Error(
      `Error generando resúmenes: ${(error as Error).message}`
    );
  }
}

/**
 * Valida que un resumen cumpla con los requisitos
 *
 * @param summary - Resumen a validar
 * @param maxWords - Máximo de palabras permitidas
 * @returns Resultado de validación
 *
 * @example
 * ```ts
 * const validation = validateSummary(summary, 150);
 * if (!validation.valid) {
 *   console.warn(validation.error);
 * }
 * ```
 */
export function validateSummary(
  summary: string,
  maxWords: number
): SummaryValidation {
  // Contar palabras
  const words = summary.trim().split(/\s+/);
  const wordCount = words.length;

  // Verificar mínimo de palabras
  if (wordCount < MIN_WORDS) {
    return {
      valid: false,
      wordCount,
      error: `Resumen muy corto: ${wordCount} palabras (mínimo ${MIN_WORDS})`,
    };
  }

  // Verificar máximo con tolerancia
  const maxWithTolerance = maxWords + Math.floor(maxWords * TOLERANCE_PERCENTAGE);

  if (wordCount > maxWithTolerance) {
    return {
      valid: false,
      wordCount,
      error: `Resumen muy largo: ${wordCount} palabras (máximo ${maxWithTolerance} con 10% tolerancia)`,
    };
  }

  // Si excede el límite pero está dentro de la tolerancia, es válido con advertencia
  if (wordCount > maxWords) {
    return {
      valid: true,
      wordCount,
      error: `Resumen excede límite pero está dentro de tolerancia: ${wordCount}/${maxWords} palabras`,
    };
  }

  return {
    valid: true,
    wordCount,
  };
}

/**
 * Formatea el nombre de la categoría para mostrar
 *
 * @param category - Categoría en formato interno
 * @returns Nombre formateado con mayúscula y acentos
 *
 * @example
 * ```ts
 * formatCategoryName("economia") // "Economía"
 * formatCategoryName("politica") // "Política"
 * ```
 */
export function formatCategoryName(
  category: keyof BulletinSummaries
): string {
  const mapping: Record<keyof BulletinSummaries, string> = {
    economia: "Economía",
    politica: "Política",
    sociedad: "Sociedad",
    seguridad: "Seguridad",
    internacional: "Internacional",
    vial: "Vial",
  };

  return mapping[category] || category;
}
