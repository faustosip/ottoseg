import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {bulletins} from '@/lib/schema';
import {eq} from 'drizzle-orm';
import {promises as fs} from 'fs';
import path from 'path';
import {z} from 'zod';
import {requireActiveUser} from '@/lib/auth-guard';
import {checkRateLimit, rateLimitResponse} from '@/lib/rate-limit';

// Slug seguro para nombres de archivo: letras minúsculas, dígitos, "_" o "-".
const SAFE_SLUG = /^[a-z0-9_-]{1,32}$/;
const UuidSchema = z.string().uuid();

/**
 * Devuelve una categoría validada como slug. Si la categoría viene corrupta
 * o no matchea el patrón, cae a "uncategorized".
 */
function sanitizeCategorySlug(raw: unknown): string {
  if (typeof raw !== 'string') return 'uncategorized';
  const normalized = raw.toLowerCase().trim();
  return SAFE_SLUG.test(normalized) ? normalized : 'uncategorized';
}

export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const guard = await requireActiveUser();
    if (!guard.ok) return guard.response;

    // Rate limit: 5 por hora por usuario (ElevenLabs cobra por caracteres).
    const rl = await checkRateLimit('tts', guard.session.user.id, 5, 3600);
    if (!rl.allowed) return rateLimitResponse(rl);

    const {id: rawId} = await params;

    // Validar que el ID del boletín sea un UUID antes de usarlo como componente
    // de path. Defensa contra path traversal (`..`) o inyección.
    const idParse = UuidSchema.safeParse(rawId);
    if (!idParse.success) {
      return NextResponse.json(
        {error: 'ID de boletín inválido'},
        {status: 400}
      );
    }
    const id = idParse.data;

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
      // Sanitizar el nombre de la categoría antes de construir el filename.
      const safeCategory = sanitizeCategorySlug(news.category);

      console.log(`🎵 Generando TTS para ${safeCategory}...`);

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
      const audioDir = path.join(process.cwd(), 'public', 'audios');
      await fs.mkdir(audioDir, {recursive: true});

      // Construimos el filename con el slug sanitizado y luego aplicamos
      // `path.basename()` como última línea de defensa por si algo logra
      // colarse (no debería, pero es barato).
      const audioFilename = path.basename(`${id}-${safeCategory}.mp3`);
      const audioPath = path.join(audioDir, audioFilename);

      // Verificar que la ruta final sigue dentro del directorio esperado.
      const resolved = path.resolve(audioPath);
      const resolvedDir = path.resolve(audioDir);
      if (!resolved.startsWith(resolvedDir + path.sep)) {
        throw new Error('Ruta de archivo fuera del directorio permitido');
      }

      await fs.writeFile(audioPath, audioBlob);

      // Calcular duración del audio (estimación simple: 150 palabras/minuto)
      const wordCount = (news.summary || news.title).split(' ').length;
      const estimatedDuration = (wordCount / 150) * 60; // en segundos

      console.log(
        `✅ Audio generado para ${safeCategory}: ${audioFilename} (~${estimatedDuration.toFixed(1)}s)`
      );

      return {
        category: safeCategory,
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

    const {id: rawId} = await params;
    const idParse = UuidSchema.safeParse(rawId);
    if (idParse.success) {
      await db
        .update(bulletins)
        .set({
          finalVideoStatus: 'failed',
          errorLog: {
            step: 'generate_tts',
            message:
              error instanceof Error ? error.message : 'Error desconocido',
            timestamp: new Date().toISOString(),
          },
        })
        .where(eq(bulletins.id, idParse.data));
    }

    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Error generando audios',
        ...(isDev && error instanceof Error ? {message: error.message} : {}),
      },
      {status: 500}
    );
  }
}
