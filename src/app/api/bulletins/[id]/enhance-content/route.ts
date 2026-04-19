/**
 * API Endpoint: POST /api/bulletins/[id]/enhance-content
 *
 * Mejora títulos y genera resúmenes profesionales usando IA
 * Solo extrae información del contenido original, sin inventar datos
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireActiveUser } from '@/lib/auth-guard';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface EnhanceRequest {
  title: string;
  content: string;
  fullContent?: string; // Contenido completo si está disponible
}

interface EnhanceResponse {
  enhancedTitle: string;
  enhancedSummary: string;
  originalTitle: string;
  originalContent: string;
}

/**
 * Genera un prompt para mejorar el título
 */
function getTitleEnhancementPrompt(title: string): string {
  return `Eres un editor de noticias profesional. Tu tarea es reescribir el siguiente título haciéndolo más conciso y directo.

TÍTULO ORIGINAL:
${title}

INSTRUCCIONES:
- Máximo 12 palabras (idealmente 8-10)
- Mantener TODA la información esencial
- No inventar información nueva
- Usar voz activa cuando sea posible
- Evitar redundancias
- Mantener nombres propios y cifras importantes
- Sin signos de exclamación
- Estilo periodístico profesional

Responde SOLO con el título mejorado, sin explicaciones adicionales.`;
}

/**
 * Genera un prompt para crear el resumen
 */
function getSummaryPrompt(title: string, content: string, fullContent?: string): string {
  const textToSummarize = fullContent || content;

  return `Eres un periodista profesional de la agencia Reuters. Tu tarea es crear un resumen informativo de la siguiente noticia.

TÍTULO:
${title}

CONTENIDO:
${textToSummarize}

INSTRUCCIONES ESTRICTAS:
- Crear un resumen de 2-3 oraciones (máximo 60 palabras)
- SOLO usar información explícitamente mencionada en el contenido
- NO inventar datos, fechas, nombres o cifras
- NO especular ni añadir contexto no presente
- NO repetir el título
- Incluir: quién, qué, cuándo (si está), dónde (si está), por qué (si está)
- Estilo objetivo y factual (tipo agencia de noticias)
- Si falta información clave, no la inventes

Responde SOLO con el resumen, sin explicaciones adicionales.`;
}

/**
 * POST /api/bulletins/[id]/enhance-content
 *
 * Mejora un título y genera un resumen profesional
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const guard = await requireActiveUser();
    if (!guard.ok) return guard.response;

    // Rate limit: 10 por hora por usuario (LLM adicional, más caro que chat).
    const rl = await checkRateLimit('enhance', guard.session.user.id, 10, 3600);
    if (!rl.allowed) return rateLimitResponse(rl);

    // const { id } = await context.params; // ID del boletín (no usado en este endpoint)
    const body: EnhanceRequest = await request.json();

    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Título y contenido son requeridos' },
        { status: 400 }
      );
    }

    // Configurar el modelo de IA
    const model = openrouter(
      process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
    );

    try {
      // Mejorar título
      console.log('🤖 Mejorando título con IA...');
      const titleResult = await generateText({
        model,
        prompt: getTitleEnhancementPrompt(body.title),
        temperature: 0.3, // Baja temperatura para resultados más consistentes
      });

      const enhancedTitle = titleResult.text.trim();

      // Generar resumen
      console.log('📝 Generando resumen profesional...');
      const summaryResult = await generateText({
        model,
        prompt: getSummaryPrompt(body.title, body.content, body.fullContent),
        temperature: 0.3,
      });

      const enhancedSummary = summaryResult.text.trim();

      // Validar resultados
      if (!enhancedTitle || !enhancedSummary) {
        throw new Error('La IA no pudo generar contenido válido');
      }

      // Log para debugging
      console.log('✅ Contenido mejorado exitosamente');
      console.log(`   Título original: ${body.title.substring(0, 50)}...`);
      console.log(`   Título mejorado: ${enhancedTitle}`);
      console.log(`   Longitud título: ${enhancedTitle.split(' ').length} palabras`);

      const response: EnhanceResponse = {
        enhancedTitle,
        enhancedSummary,
        originalTitle: body.title,
        originalContent: body.content,
      };

      return NextResponse.json(response);
    } catch (aiError) {
      console.error('Error al procesar con IA:', aiError);
      const isDev = process.env.NODE_ENV === 'development';
      return NextResponse.json(
        {
          error: 'Error al procesar con IA',
          ...(isDev && aiError instanceof Error
            ? { details: aiError.message }
            : {}),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en enhance-content:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        ...(isDev && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 }
    );
  }
}

/**
 * Batch enhancement - mejora múltiples noticias a la vez
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const guard = await requireActiveUser();
    if (!guard.ok) return guard.response;

    // Rate limit: 5 batches por hora por usuario (cada batch procesa varios artículos).
    const rl = await checkRateLimit('enhance-batch', guard.session.user.id, 5, 3600);
    if (!rl.allowed) return rateLimitResponse(rl);

    // const { id } = await context.params; // ID del boletín (no usado en este endpoint)
    const { articles }: { articles: EnhanceRequest[] } = await request.json();

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: 'Se requiere un array de artículos' },
        { status: 400 }
      );
    }

    console.log(`🚀 Mejorando ${articles.length} artículos en batch...`);

    // Configurar el modelo de IA
    const model = openrouter(
      process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
    );

    const enhancedArticles: EnhanceResponse[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    // Helper: ejecuta una función con backoff exponencial.
    // Antes usábamos maxRetries: 50/150 directamente del SDK — eso podía
    // dejar una petición colgada horas y disparar coste innecesario en
    // OpenRouter. Limitamos a 5 reintentos con backoff 0.5s → 8s.
    const withRetry = async <T,>(fn: () => Promise<T>, maxAttempts = 5): Promise<T> => {
      let lastError: unknown;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          return await fn();
        } catch (err) {
          lastError = err;
          if (attempt === maxAttempts - 1) break;
          const delay = Math.min(500 * 2 ** attempt, 8000);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
      throw lastError;
    };

    // Procesar cada artículo
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];

      try {
        // Mejorar título
        const titleResult = await withRetry(() =>
          generateText({
            model,
            prompt: getTitleEnhancementPrompt(article.title),
            maxRetries: 5,
            temperature: 0.3,
          })
        );

        // Generar resumen
        const summaryResult = await withRetry(() =>
          generateText({
            model,
            prompt: getSummaryPrompt(article.title, article.content, article.fullContent),
            maxRetries: 5,
            temperature: 0.3,
          })
        );

        enhancedArticles.push({
          enhancedTitle: titleResult.text.trim(),
          enhancedSummary: summaryResult.text.trim(),
          originalTitle: article.title,
          originalContent: article.content,
        });

        console.log(`✅ Artículo ${i + 1}/${articles.length} mejorado`);
      } catch (error) {
        console.error(`❌ Error en artículo ${i + 1}:`, error);
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });

        // Agregar el artículo sin mejoras
        enhancedArticles.push({
          enhancedTitle: article.title,
          enhancedSummary: article.content.substring(0, 150) + '...',
          originalTitle: article.title,
          originalContent: article.content,
        });
      }

      // Pequeña pausa para no sobrecargar la API
      if (i < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`📊 Batch completado: ${enhancedArticles.length - errors.length}/${articles.length} exitosos`);

    return NextResponse.json({
      success: true,
      articles: enhancedArticles,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        total: articles.length,
        successful: articles.length - errors.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error en batch enhancement:', error);
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        ...(isDev && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 }
    );
  }
}