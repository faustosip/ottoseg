import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

/**
 * Configuración de timeout para llamadas a IA
 * - 60 segundos para operaciones simples
 * - 120 segundos (2 min) para resumir (puede tomar tiempo con muchas noticias)
 * - 300 segundos (5 min) para operaciones complejas (clasificar)
 */
const AI_TIMEOUT = 60000; // 60 segundos (por defecto)
export const AI_TIMEOUT_SUMMARIZATION = 45000; // 45 segundos para resúmenes (GPT-4o-mini es rápido)
export const AI_TIMEOUT_CLASSIFICATION = 120000; // 2 minutos para clasificación (antes era 5 min)

/**
 * Configuración de reintentos
 */
const MAX_RETRIES = 2; // Reducido a 2 para no hacer esperar demasiado
const RETRY_DELAYS = [3000, 6000]; // 3s, 6s - delays más largos para dar tiempo de recuperación

/**
 * Obtiene el modelo Claude configurado
 *
 * @returns Modelo Claude Sonnet 4 con configuración óptima
 */
export function getClaudeModel() {
  const modelName =
    process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4-20250514";

  return openrouter(modelName);
}

/**
 * Obtiene el modelo GPT como backup
 *
 * @returns Modelo GPT-4 Turbo
 */
export function getGPTModel() {
  return openrouter("openai/gpt-4o-mini");
}

/**
 * Espera un tiempo específico (helper para delays)
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Genera texto con IA usando retry logic y timeout
 *
 * @param systemPrompt - Prompt del sistema
 * @param userPrompt - Prompt del usuario
 * @param useFallback - Si usar GPT como fallback si Claude falla
 * @param timeout - Timeout personalizado en ms (opcional)
 * @returns Texto generado
 *
 * @example
 * ```ts
 * const response = await generateWithRetry(
 *   "Eres un experto clasificador",
 *   "Clasifica estas noticias...",
 *   true,
 *   300000 // 5 minutos para clasificación
 * );
 * ```
 */
export async function generateWithRetry(
  systemPrompt: string,
  userPrompt: string,
  useFallback = true,
  timeout = AI_TIMEOUT
): Promise<string> {
  let lastError: Error | null = null;

  // Intentar con Claude
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await generateText({
        model: getClaudeModel(),
        system: systemPrompt,
        prompt: userPrompt,
        abortSignal: controller.signal,
      });

      clearTimeout(timeoutId);
      return result.text;
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message.includes('aborted')
        ? 'Timeout - La IA tardó demasiado en responder'
        : lastError.message;

      console.error(
        `    ❌ Intento ${attempt + 1}/${MAX_RETRIES} falló con Claude: ${errorMessage}`
      );

      // Si no es el último intento, esperar antes de reintentar
      if (attempt < MAX_RETRIES - 1) {
        console.log(`    ⏳ Esperando ${RETRY_DELAYS[attempt] / 1000}s antes de reintentar...`);
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  // Si Claude falló y useFallback es true, intentar con GPT
  if (useFallback) {
    console.warn("    ⚠️  Claude falló en todos los intentos, probando con GPT como backup...");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await generateText({
        model: getGPTModel(),
        system: systemPrompt,
        prompt: userPrompt,
        abortSignal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("    ✅ GPT respondió exitosamente");
      return result.text;
    } catch (error) {
      const gptError = error as Error;
      const gptErrorMessage = gptError.message.includes('aborted')
        ? 'Timeout - GPT también tardó demasiado'
        : gptError.message;

      console.error(`    ❌ GPT también falló: ${gptErrorMessage}`);
      throw new Error(
        `Tanto Claude como GPT fallaron. Último error: ${gptErrorMessage}`
      );
    }
  }

  // Si llegamos aquí, todos los intentos fallaron y no hay fallback
  const finalErrorMessage = lastError?.message.includes('aborted')
    ? 'Timeout - La IA no respondió a tiempo en ningún intento'
    : lastError?.message || 'Error desconocido';

  throw new Error(
    `Error generando texto después de ${MAX_RETRIES} intentos: ${finalErrorMessage}`
  );
}

/**
 * Genera texto optimizado para resúmenes (usa GPT-4o-mini como primario por velocidad)
 *
 * GPT-4o-mini es ~3x más rápido que Claude Sonnet para tareas de resumen corto.
 * Si falla, usa Claude como fallback.
 */
export async function generateSummaryFast(
  systemPrompt: string,
  userPrompt: string,
  timeout = AI_TIMEOUT_SUMMARIZATION
): Promise<string> {
  // Intentar primero con GPT-4o-mini (más rápido para resúmenes)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const result = await generateText({
      model: getGPTModel(),
      system: systemPrompt,
      prompt: userPrompt,
      abortSignal: controller.signal,
    });

    clearTimeout(timeoutId);
    return result.text;
  } catch (error) {
    const err = error as Error;
    const errorMessage = err.message.includes('aborted')
      ? 'Timeout'
      : err.message;
    console.warn(`    ⚠️  GPT-4o-mini falló (${errorMessage}), intentando con Claude...`);
  }

  // Fallback a Claude
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const result = await generateText({
      model: getClaudeModel(),
      system: systemPrompt,
      prompt: userPrompt,
      abortSignal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("    ✅ Claude respondió como fallback");
    return result.text;
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `Tanto GPT como Claude fallaron para resumen: ${err.message}`
    );
  }
}

/**
 * Tipo de error de IA
 */
export interface AIError {
  message: string;
  attempt?: number;
  modelUsed?: string;
  originalError?: Error;
}

/**
 * Maneja errores de IA de forma centralizada
 *
 * @param error - Error capturado
 * @param context - Contexto adicional
 * @returns Error formateado
 */
export function handleAIError(error: unknown, context?: string): AIError {
  const err = error as Error;

  const aiError: AIError = {
    message: err.message || "Unknown AI error",
    originalError: err,
  };

  if (context) {
    aiError.message = `${context}: ${aiError.message}`;
  }

  console.error("AI Error:", aiError);

  return aiError;
}
