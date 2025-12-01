/**
 * API Endpoint: POST /api/bulletins/[id]/enhance-content
 *
 * Mejora títulos y genera resúmenes profesionales usando IA
 * Solo extrae información del contenido original, sin inventar datos
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
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
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        {
          error: 'Error al procesar con IA',
          details: aiError instanceof Error ? aiError.message : 'Error desconocido'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en enhance-content:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
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
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

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

    // Procesar cada artículo
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];

      try {
        // Mejorar título
        const titleResult = await generateText({
          model,
          prompt: getTitleEnhancementPrompt(article.title),
          maxRetries: 50,
          temperature: 0.3,
        });

        // Generar resumen
        const summaryResult = await generateText({
          model,
          prompt: getSummaryPrompt(article.title, article.content, article.fullContent),
          maxRetries: 150,
          temperature: 0.3,
        });

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
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}