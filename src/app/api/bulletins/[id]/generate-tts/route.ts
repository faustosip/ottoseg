import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {bulletins} from '@/lib/schema';
import {eq} from 'drizzle-orm';
import {promises as fs} from 'fs';
import path from 'path';

export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const {id} = await params;

    // Obtener el boletín
    const bulletin = await db.query.bulletins.findFirst({
      where: eq(bulletins.id, id),
    });

    if (!bulletin) {
      return NextResponse.json(
        {error: 'Boletín no encontrado'},
        {status: 404}
      );
    }

    // Verificar que haya noticias seleccionadas
    const selectedNews = (bulletin.selectedNews as Array<{
      category: string;
      title: string;
      summary?: string;
    }>) || [];
    if (selectedNews.length === 0) {
      return NextResponse.json(
        {error: 'No hay noticias seleccionadas para el video'},
        {status: 400}
      );
    }

    // Actualizar estado
    await db
      .update(bulletins)
      .set({finalVideoStatus: 'generating_audio'})
      .where(eq(bulletins.id, id));

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JddqVF50ZSIR7SRbJE6u';

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY no configurado');
    }

    // Generar audio para cada noticia
    const audioPromises = selectedNews.map(async (news) => {
      console.log(`🎵 Generando TTS para ${news.category}...`);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: news.summary || news.title,
            model_id: 'eleven_flash_v2_5',
            voice_settings: {
              stability: 0.1,
              similarity_boost: 0.3,
              style: 0.2,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${error}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = Buffer.from(audioBuffer);

      // Guardar audio en public/audios/
      const fs = require('fs').promises;
      const path = require('path');
      const audioDir = path.join(process.cwd(), 'public', 'audios');
      await fs.mkdir(audioDir, {recursive: true});

      const audioFilename = `${id}-${news.category}.mp3`;
      const audioPath = path.join(audioDir, audioFilename);
      await fs.writeFile(audioPath, audioBlob);

      // Calcular duración del audio (estimación simple: 150 palabras/minuto)
      const wordCount = (news.summary || news.title).split(' ').length;
      const estimatedDuration = (wordCount / 150) * 60; // en segundos

      console.log(
        `✅ Audio generado para ${news.category}: ${audioFilename} (~${estimatedDuration.toFixed(1)}s)`
      );

      return {
        category: news.category,
        audioUrl: `/audios/${audioFilename}`,
        duration: estimatedDuration,
      };
    });

    const audios = await Promise.all(audioPromises);

    // Crear objeto indexado por categoría
    const categoryAudios = audios.reduce((acc, audio) => {
      acc[audio.category] = {
        url: audio.audioUrl,
        duration: audio.duration,
      };
      return acc;
    }, {} as Record<string, {url: string; duration: number}>);

    // Actualizar BD con los audios generados
    await db
      .update(bulletins)
      .set({
        categoryAudios,
      })
      .where(eq(bulletins.id, id));

    console.log(
      `✅ ${audios.length} audios generados exitosamente para boletín ${id}`
    );

    return NextResponse.json({
      success: true,
      audios: categoryAudios,
      totalAudios: audios.length,
    });
  } catch (error) {
    console.error('❌ Error generando TTS:', error);

    const {id} = await params;
    await db
      .update(bulletins)
      .set({
        finalVideoStatus: 'failed',
        errorLog: {
          step: 'generate_tts',
          message: error instanceof Error ? error.message : 'Error desconocido',
          timestamp: new Date().toISOString(),
        },
      })
      .where(eq(bulletins.id, id));

    return NextResponse.json(
      {
        error: 'Error generando audios',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      {status: 500}
    );
  }
}
