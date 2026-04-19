/**
 * API Endpoint: POST /api/bulletins/[id]/orchestrate
 *
 * Orquestador automático del pipeline completo de generación de video
 * Ejecuta secuencialmente:
 * 1. Generación de videos de avatar con Simli
 * 2. Renderizado del video final con Remotion
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bulletins } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireActiveUser } from '@/lib/auth-guard';
import { errorResponse } from '@/lib/http/error-response';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/bulletins/[id]/orchestrate
 *
 * Ejecuta el pipeline completo de generación de video
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const startTime = Date.now();

  try {
    const guard = await requireActiveUser();
    if (!guard.ok) return guard.response;

    // Rate limit: 3 por hora por usuario (pipeline completo, muy caro).
    const rl = await checkRateLimit('orchestrate', guard.session.user.id, 3, 3600);
    if (!rl.allowed) return rateLimitResponse(rl);

    const { id } = await context.params;

    console.log(`🎬 Iniciando pipeline de video para boletín ${id}`);

    // 1. Verificar que el boletín existe
    const bulletin = await db.query.bulletins.findFirst({
      where: eq(bulletins.id, id),
    });

    if (!bulletin) {
      return NextResponse.json(
        { error: 'Boletín no encontrado' },
        { status: 404 }
      );
    }

    // 2. Verificar que haya noticias seleccionadas
    const selectedNews =
      (bulletin.selectedNews as Array<Record<string, unknown>> | null) || [];
    if (selectedNews.length === 0) {
      return NextResponse.json(
        {
          error:
            'No hay noticias seleccionadas. Por favor selecciona noticias primero.',
        },
        { status: 400 }
      );
    }

    console.log(`📰 ${selectedNews.length} noticias seleccionadas`);

    // 3. Actualizar estado inicial
    await db
      .update(bulletins)
      .set({
        finalVideoStatus: 'pending',
        errorLog: null,
      })
      .where(eq(bulletins.id, id));

    // 4. PASO 1: Generar videos de avatar con Simli
    console.log('🎭 PASO 1: Generando videos de avatar con Simli...');

    const avatarsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/bulletins/${id}/generate-avatars`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!avatarsResponse.ok) {
      const errorData = await avatarsResponse.json();
      throw new Error(
        `Error generando avatares: ${errorData.details || errorData.error}`
      );
    }

    const avatarsData = await avatarsResponse.json();
    console.log(
      `✅ PASO 1 completado: ${avatarsData.totalVideos} videos de avatar generados`
    );

    // 5. PASO 2: Renderizar video final con Remotion
    console.log('🎥 PASO 2: Renderizando video final con Remotion...');

    const renderResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/bulletins/${id}/render-final-video`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!renderResponse.ok) {
      const errorData = await renderResponse.json();
      throw new Error(
        `Error renderizando video final: ${errorData.details || errorData.error}`
      );
    }

    const renderData = await renderResponse.json();
    console.log(`✅ PASO 2 completado: Video final renderizado`);

    // 6. Calcular tiempo total
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(
      `✅ Pipeline completado exitosamente en ${totalTime}s para boletín ${id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Pipeline de video completado exitosamente',
      steps: {
        avatarGeneration: {
          completed: true,
          totalVideos: avatarsData.totalVideos,
          videos: avatarsData.videos,
        },
        finalRendering: {
          completed: true,
          videoUrl: renderData.videoUrl,
          duration: renderData.duration,
          newsCount: renderData.newsCount,
        },
      },
      timing: {
        totalSeconds: parseFloat(totalTime),
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
      },
      output: {
        finalVideoUrl: renderData.videoUrl,
        metadata: {
          totalNews: selectedNews.length,
          duration: renderData.duration,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error en pipeline de video:', error);

    const { id } = await context.params;

    // Actualizar estado a failed
    await db
      .update(bulletins)
      .set({
        finalVideoStatus: 'failed',
        errorLog: {
          step: 'orchestrate',
          message: error instanceof Error ? error.message : 'Error desconocido',
          timestamp: new Date().toISOString(),
        },
      })
      .where(eq(bulletins.id, id));

    return errorResponse('Error en el pipeline de video', 500, error, {
      timing: {
        totalSeconds: ((Date.now() - startTime) / 1000).toFixed(1),
        failedAt: new Date().toISOString(),
      },
    });
  }
}

/**
 * GET /api/bulletins/[id]/orchestrate
 *
 * Obtiene el estado del pipeline
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const guard = await requireActiveUser();
    if (!guard.ok) return guard.response;

    const { id } = await context.params;

    const bulletin = await db.query.bulletins.findFirst({
      where: eq(bulletins.id, id),
      columns: {
        finalVideoStatus: true,
        finalVideoUrl: true,
        finalVideoMetadata: true,
        categoryVideos: true,
        errorLog: true,
      },
    });

    if (!bulletin) {
      return NextResponse.json(
        { error: 'Boletín no encontrado' },
        { status: 404 }
      );
    }

    const categoryVideos = bulletin.categoryVideos as Record<
      string,
      { mp4Url?: string; duration?: number; simliUrl?: string }
    > | null;

    return NextResponse.json({
      success: true,
      status: bulletin.finalVideoStatus,
      steps: {
        avatarGeneration: {
          completed: categoryVideos && Object.keys(categoryVideos).length > 0,
          totalVideos: categoryVideos ? Object.keys(categoryVideos).length : 0,
        },
        finalRendering: {
          completed: bulletin.finalVideoStatus === 'completed',
          videoUrl: bulletin.finalVideoUrl,
        },
      },
      output: {
        finalVideoUrl: bulletin.finalVideoUrl,
        metadata: bulletin.finalVideoMetadata,
      },
      error: bulletin.errorLog,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error obteniendo estado del pipeline' },
      { status: 500 }
    );
  }
}
