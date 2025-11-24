/**
 * API Endpoint: POST /api/bulletins/[id]/generate-avatars
 *
 * Genera videos de avatar usando Simli API para cada noticia seleccionada
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bulletins } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { uploadFile } from '@/lib/storage/minio';
import { convertHLStoMP4 } from '@/lib/video/hls-to-mp4';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/bulletins/[id]/generate-avatars
 *
 * Genera videos de avatar con Simli para cada noticia seleccionada
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 1. Obtener el boletín
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
    const selectedNews = (bulletin.selectedNews as Array<{
      category: string;
      title: string;
      summary?: string;
      imageUrl?: string;
    }>) || [];
    if (selectedNews.length === 0) {
      return NextResponse.json(
        { error: 'No hay noticias seleccionadas para generar videos' },
        { status: 400 }
      );
    }

    // 3. Actualizar estado
    await db
      .update(bulletins)
      .set({ finalVideoStatus: 'generating_avatars' })
      .where(eq(bulletins.id, id));

    // 4. Validar configuración
    const SIMLI_API_KEY = process.env.SIMLI_API_KEY;
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const FACE_ID =
      process.env.SIMLI_FACE_ID || 'c7451e55-ea04-41c8-ab47-bdca3e4a03d8';
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JddqVF50ZSIR7SRbJE6u';

    if (!SIMLI_API_KEY || !ELEVENLABS_API_KEY) {
      throw new Error('SIMLI_API_KEY o ELEVENLABS_API_KEY no configurados');
    }

    console.log(
      `🎭 Generando ${selectedNews.length} videos de avatar con Simli...`
    );

    // 5. Generar videos para cada noticia
    const videoPromises = selectedNews.map(async (news, index: number) => {
      try {
        const newsText = news.summary || news.title;
        console.log(
          `🎬 [${index + 1}/${selectedNews.length}] Generando video para: ${news.category}`
        );

        // 5.1. Llamar a Simli API
        const simliResponse = await fetch(
          'https://api.simli.ai/textToVideoStream',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ttsAPIKey: ELEVENLABS_API_KEY,
              simliAPIKey: SIMLI_API_KEY,
              faceId: FACE_ID,
              requestBody: {
                audioProvider: 'ElevenLabs',
                text: newsText,
                voiceName: VOICE_ID,
                model_id: 'eleven_flash_v2_5',
                voice_settings: {
                  stability: 0.1,
                  similarity_boost: 0.3,
                  style: 0.2,
                },
              },
            }),
          }
        );

        if (!simliResponse.ok) {
          const errorText = await simliResponse.text();
          throw new Error(
            `Simli API error (${simliResponse.status}): ${errorText}`
          );
        }

        const simliData = await simliResponse.json();
        const hlsUrl = simliData.hls_url;

        if (!hlsUrl) {
          throw new Error('No se recibió hls_url de Simli API');
        }

        console.log(`✅ Video HLS generado: ${hlsUrl}`);

        // 5.2. Convertir HLS a MP4
        console.log(`🔄 Convirtiendo HLS a MP4...`);
        const mp4Buffer = await convertHLStoMP4(
          hlsUrl,
          `${id}-${news.category}`
        );

        // 5.3. Subir a MinIO
        const fileName = `bulletins/${id}/avatars/${news.category}.mp4`;
        console.log(`☁️ Subiendo a MinIO: ${fileName}`);

        const mp4Url = await uploadFile(fileName, mp4Buffer, 'video/mp4');

        console.log(
          `✅ [${index + 1}/${selectedNews.length}] Video completado para ${news.category}`
        );

        // Estimar duración (150 palabras por minuto)
        const wordCount = newsText.split(' ').length;
        const estimatedDuration = (wordCount / 150) * 60;

        return {
          category: news.category,
          simliUrl: hlsUrl,
          mp4Url,
          duration: estimatedDuration,
        };
      } catch (videoError) {
        console.error(
          `❌ Error generando video para ${news.category}:`,
          videoError
        );
        throw videoError;
      }
    });

    // 6. Esperar a que todos los videos se generen
    const videos = await Promise.all(videoPromises);

    // 7. Crear objeto indexado por categoría
    const categoryVideos = videos.reduce((acc, video) => {
      acc[video.category] = {
        simliUrl: video.simliUrl,
        mp4Url: video.mp4Url,
        duration: video.duration,
      };
      return acc;
    }, {} as Record<string, { simliUrl: string; mp4Url: string; duration: number }>);

    // 8. Actualizar BD con los videos generados
    await db
      .update(bulletins)
      .set({
        categoryVideos,
        finalVideoMetadata: {
          totalVideos: videos.length,
          generatedAt: new Date().toISOString(),
          provider: 'Simli',
        },
      })
      .where(eq(bulletins.id, id));

    console.log(
      `✅ ${videos.length} videos de avatar generados exitosamente para boletín ${id}`
    );

    return NextResponse.json({
      success: true,
      videos: categoryVideos,
      totalVideos: videos.length,
      message: 'Videos de avatar generados exitosamente',
    });
  } catch (error) {
    console.error('❌ Error generando videos de avatar:', error);

    const { id } = await context.params;
    await db
      .update(bulletins)
      .set({
        finalVideoStatus: 'failed',
        errorLog: {
          step: 'generate_avatars',
          message: error instanceof Error ? error.message : 'Error desconocido',
          timestamp: new Date().toISOString(),
        },
      })
      .where(eq(bulletins.id, id));

    return NextResponse.json(
      {
        error: 'Error generando videos de avatar',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bulletins/[id]/generate-avatars
 *
 * Obtiene el estado de los videos de avatar
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const bulletin = await db.query.bulletins.findFirst({
      where: eq(bulletins.id, id),
      columns: {
        categoryVideos: true,
        finalVideoStatus: true,
        finalVideoMetadata: true,
      },
    });

    if (!bulletin) {
      return NextResponse.json(
        { error: 'Boletín no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      videos: bulletin.categoryVideos,
      status: bulletin.finalVideoStatus,
      metadata: bulletin.finalVideoMetadata,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error obteniendo estado de videos' },
      { status: 500 }
    );
  }
}
