/**
 * Módulo de Clasificación de Noticias con IA
 *
 * Clasifica noticias scrapeadas en 6 categorías usando Claude AI
 */

import {
  CLASSIFICATION_SYSTEM_PROMPT,
  CLASSIFICATION_USER_PROMPT_TEMPLATE,
  replacePlaceholders,
} from "@/lib/ai/prompts";
import { generateWithRetry, AI_TIMEOUT_CLASSIFICATION } from "@/lib/ai/providers";
import {
  updateBulletinClassification,
  updateBulletinStatus,
  createBulletinLog,
} from "@/lib/db/queries/bulletins";
import type { ScrapedArticle, ScrapeResult } from "./scraper";

/**
 * Estructura de noticias clasificadas
 */
export interface ClassifiedNews {
  economia: ClassifiedArticle[];
  politica: ClassifiedArticle[];
  sociedad: ClassifiedArticle[];
  seguridad: ClassifiedArticle[];
  internacional: ClassifiedArticle[];
  vial: ClassifiedArticle[];
}

/**
 * Artículo clasificado (con source agregado)
 */
export interface ClassifiedArticle {
  title: string;
  content: string;
  url?: string;
  source?: string;
  imageUrl?: string;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Clasifica noticias usando IA
 *
 * @param rawNews - Noticias scrapeadas organizadas por fuente
 * @param bulletinId - ID del boletín
 * @returns Noticias clasificadas por categoría
 *
 * @throws Error si la clasificación falla completamente
 *
 * @example
 * ```ts
 * const scrapeResult = await scrapeAllSources();
 * const classified = await classifyNews(scrapeResult, bulletinId);
 * console.log(`Economía: ${classified.economia.length} noticias`);
 * ```
 */
export async function classifyNews(
  rawNews: ScrapeResult,
  bulletinId: string
): Promise<ClassifiedNews> {
  const startTime = Date.now();

  try {
    console.log("🤖 Iniciando clasificación con IA...");

    // Preparar datos para el prompt - SOLO noticias seleccionadas
    const allArticles: ScrapedArticle[] = [
      ...rawNews.primicias,
      ...rawNews.laHora,
      ...rawNews.elComercio,
      ...rawNews.teleamazonas,
      ...rawNews.ecu911,
    ];

    // Crear log de inicio
    await createBulletinLog(
      bulletinId,
      "classification",
      "in_progress",
      "Iniciando clasificación de noticias con IA",
      { startTime, totalArticles: rawNews.metadata?.totalArticles || allArticles.length }
    );

    // Filtrar solo las noticias seleccionadas
    const selectedArticles = allArticles.filter(
      (article) => article.selected !== false
    );

    console.log(
      `  📊 Total de artículos: ${allArticles.length}, Seleccionados: ${selectedArticles.length}`
    );

    if (selectedArticles.length === 0) {
      throw new Error("No hay artículos seleccionados para clasificar");
    }

    // Preparar prompt con solo las noticias seleccionadas
    const newsData = JSON.stringify(selectedArticles, null, 2);
    const userPrompt = replacePlaceholders(CLASSIFICATION_USER_PROMPT_TEMPLATE, {
      NEWS_DATA: newsData,
    });

    console.log("  🧠 Llamando a Claude para clasificación...");
    console.log(`  ⏱️  Timeout: ${AI_TIMEOUT_CLASSIFICATION / 1000}s (5 minutos)`);

    // Llamar a IA con retry logic y timeout extendido
    const response = await generateWithRetry(
      CLASSIFICATION_SYSTEM_PROMPT,
      userPrompt,
      true, // usar fallback a GPT si Claude falla
      AI_TIMEOUT_CLASSIFICATION // timeout de 5 minutos para clasificación
    );

    console.log("  ✓ Respuesta recibida de IA");

    // Parsear respuesta
    const classified = extractJSONFromResponse(response);

    console.log("  ✓ JSON extraído y parseado");

    // Validar clasificación
    const validation = validateClassification(classified);

    if (!validation.valid) {
      throw new Error(
        `Clasificación inválida: ${validation.errors.join(", ")}`
      );
    }

    console.log("  ✓ Clasificación validada correctamente");

    // Contar artículos por categoría
    const counts = {
      economia: classified.economia.length,
      politica: classified.politica.length,
      sociedad: classified.sociedad.length,
      seguridad: classified.seguridad.length,
      internacional: classified.internacional.length,
      vial: classified.vial.length,
    };

    console.log("  📈 Distribución:", counts);

    // Actualizar bulletin
    await updateBulletinClassification(bulletinId, classified);

    console.log("  💾 Clasificación guardada en DB");

    // Crear log de completado
    const duration = Date.now() - startTime;
    await createBulletinLog(
      bulletinId,
      "classification",
      "completed",
      `Clasificación completada: ${selectedArticles.length} noticias seleccionadas en 6 categorías`,
      {
        duration,
        counts,
        totalArticles: allArticles.length,
        selectedArticles: selectedArticles.length,
      }
    );

    console.log(`✅ Clasificación completada en ${(duration / 1000).toFixed(2)}s`);

    return classified;
  } catch (error) {
    console.error("❌ Error en clasificación:", error);

    const duration = Date.now() - startTime;

    // Crear log de error
    await createBulletinLog(
      bulletinId,
      "classification",
      "failed",
      `Error en clasificación: ${(error as Error).message}`,
      { duration, error: (error as Error).message }
    );

    // Actualizar status del bulletin a failed
    await updateBulletinStatus(bulletinId, "failed");

    throw new Error(
      `Error clasificando noticias: ${(error as Error).message}`
    );
  }
}

/**
 * Extrae JSON de la respuesta de IA
 *
 * Maneja diferentes formatos de respuesta:
 * 1. JSON entre ```json y ```
 * 2. JSON directo entre { y }
 * 3. JSON con texto antes/después
 *
 * @param text - Texto de respuesta de IA
 * @returns Objeto parseado
 *
 * @throws Error si no se puede extraer JSON válido
 *
 * @example
 * ```ts
 * const response = '```json\n{"economia": []}\n```';
 * const obj = extractJSONFromResponse(response);
 * ```
 */
export function extractJSONFromResponse(text: string): ClassifiedNews {
  try {
    // Estrategia 1: Buscar JSON entre ```json y ```
    const codeBlockMatch = text.match(/```json\s*\n([\s\S]+?)\n```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }

    // Estrategia 2: Buscar entre ``` y ``` (sin especificar lenguaje)
    const genericCodeBlock = text.match(/```\s*\n([\s\S]+?)\n```/);
    if (genericCodeBlock) {
      return JSON.parse(genericCodeBlock[1]);
    }

    // Estrategia 3: Buscar primer { hasta último }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonText = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonText);
    }

    // Estrategia 4: Intentar parsear el texto completo
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parseando JSON:", error);
    console.error("Texto recibido:", text.substring(0, 500));

    throw new Error(
      `No se pudo extraer JSON válido de la respuesta de IA: ${(error as Error).message}`
    );
  }
}

/**
 * Valida la estructura de la clasificación
 *
 * @param classified - Objeto clasificado a validar
 * @returns Resultado de validación con errores si los hay
 *
 * @example
 * ```ts
 * const result = validateClassification(classified);
 * if (!result.valid) {
 *   console.error("Errores:", result.errors);
 * }
 * ```
 */
export function validateClassification(
  classified: unknown
): ValidationResult {
  const errors: string[] = [];

  // Verificar que sea un objeto
  if (!classified || typeof classified !== "object") {
    errors.push("La clasificación debe ser un objeto");
    return { valid: false, errors };
  }

  // Categorías esperadas
  const expectedCategories = [
    "economia",
    "politica",
    "sociedad",
    "seguridad",
    "internacional",
    "vial",
  ];

  // Cast para poder acceder con índice de string
  const typedClassified = classified as Record<string, unknown>;

  // Verificar que tenga todas las categorías
  for (const category of expectedCategories) {
    if (!(category in typedClassified)) {
      errors.push(`Falta la categoría: ${category}`);
    } else if (!Array.isArray(typedClassified[category])) {
      errors.push(`La categoría ${category} debe ser un array`);
    }
  }

  // Si ya hay errores, retornar
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Verificar estructura de artículos en cada categoría

  for (const category of expectedCategories) {
    const articles = typedClassified[category] as unknown[];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i] as Record<string, unknown>;

      // Verificar propiedades requeridas
      if (!article.title || typeof article.title !== "string") {
        errors.push(
          `${category}[${i}]: falta o es inválida la propiedad 'title'`
        );
      }

      if (!article.content || typeof article.content !== "string") {
        errors.push(
          `${category}[${i}]: falta o es inválida la propiedad 'content'`
        );
      }

      if (!article.source || typeof article.source !== "string") {
        errors.push(
          `${category}[${i}]: falta o es inválida la propiedad 'source'`
        );
      }

      // URL es opcional pero si existe debe ser string
      if (article.url && typeof article.url !== "string") {
        errors.push(`${category}[${i}]: 'url' debe ser string`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
