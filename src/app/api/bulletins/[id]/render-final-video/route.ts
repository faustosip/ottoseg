/**
 * API Endpoint: POST /api/bulletins/[id]/render-final-video
 *
 * Renderiza el video final del boletín usando Remotion
 * Combina todos los videos de avatar generados con imágenes de noticias
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bulletins } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import { mkdir } from 'fs/promises';
import { uploadFile } from '@/lib/storage/minio';
import { readFile, unlink } from 'fs/promises';
import { requireActiveUser } from '@/lib/auth-guard';
import { errorResponse } from '@/lib/http/error-response';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { z } from 'zod';

// Schema que valida cada entrada de selectedNews antes de pasarla a Remotion.
// Mantenemos los campos opcionales porque históricamente el origen es JSON libre;
// sin validación, cualquier cambio upstream podría filtrar datos inesperados
// hacia el bundle.
const SelectedNewsItemSchema = z
  .object({
    category: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().optional(),
    content: z.string().optional(),
    imageUrl: z.string().optional(),
    url: z.string().optional(),
    source: z.string().optional(),
  })
  .passthrough();

type SelectedNewsItem = z.infer<typeof SelectedNewsItemSchema>;

interface CategoryVideoEntry {
  mp4Url: string;
  duration: number;
}

interface RemotionNewsInput extends SelectedNewsItem {
  avatarVideoUrl: string | null;
  duration: number;
}

// Remotion requiere que los inputProps sean compatibles con un índice de
// string. Lo garantizamos con la firma indexada.
interface RemotionInputProps {
  bulletinDate: string;
  news: RemotionNewsInput[];
  totalDuration: number;
  [key: string]: unknown;
}

// Force dynamic rendering (no static optimization)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/bulletins/[id]/render-final-video
 *
 * Renderiza el video final del boletín con Remotion
 */
export async function POST(request: NextRequest, context: RouteContext) {
  let tempVideoPath: string | null = null;

  try {
    const guard = await requireActiveUser();
    if (!guard.ok) return guard.response;

    // Rate limit: 3 por hora por usuario (render de Remotion, CPU intensivo).
    const rl = await checkRateLimit('render-video', guard.session.user.id, 3, 3600);
    if (!rl.allowed) return rateLimitResponse(rl);

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

    // 2. Verificar que existan videos de avatar generados
    const categoryVideos =
      (bulletin.categoryVideos as Record<string, CategoryVideoEntry> | null) ||
      null;

    if (!categoryVideos || Object.keys(categoryVideos).length === 0) {
      return NextResponse.json(
        { error: 'No hay videos de avatar generados. Ejecuta /generate-avatars primero.' },
        { status: 400 }
      );
    }

    // Validar selectedNews con Zod antes de pasarlo a Remotion.
    const selectedNewsParse = z
      .array(SelectedNewsItemSchema)
      .safeParse(bulletin.selectedNews ?? []);
    if (!selectedNewsParse.success) {
      return NextResponse.json(
        {
          error: 'selectedNews con formato inválido',
        },
        { status: 400 }
      );
    }
    const selectedNews: SelectedNewsItem[] = selectedNewsParse.data;

    if (selectedNews.length === 0) {
      return NextResponse.json(
        { error: 'No hay noticias seleccionadas' },
        { status: 400 }
      );
    }

    // 3. Actualizar estado
    await db
      .update(bulletins)
      .set({ finalVideoStatus: 'rendering' })
      .where(eq(bulletins.id, id));

    console.log('🎬 Iniciando renderizado del video final con Remotion...');

    // 4. Importar Remotion dinámicamente (solo en runtime, no durante build)
    console.log('🎬 Cargando módulos de Remotion...');
    const [{bundle}, {renderMedia, selectComposition}] = await Promise.all([
      import('@remotion/bundler'),
      import('@remotion/renderer'),
    ]);

    // 5. Preparar datos para Remotion
    const bulletinDate = new Date(bulletin.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Combinar noticias con sus videos
    const newsWithVideos: RemotionNewsInput[] = selectedNews.map((news) => ({
      ...news,
      avatarVideoUrl: categoryVideos[news.category]?.mp4Url ?? null,
      duration: categoryVideos[news.category]?.duration ?? 10,
    }));

    const inputProps: RemotionInputProps = {
      bulletinDate: bulletinDate.toUpperCase(),
      news: newsWithVideos,
      totalDuration: newsWithVideos.reduce(
        (sum, n) => sum + (n.duration || 10),
        0
      ),
    };

    // 6. Bundle Remotion
    console.log('📦 Bundling Remotion...');
    const bundled = await bundle({
      entryPoint: path.join(process.cwd(), 'remotion', 'index.ts'),
      webpackOverride: (config) => config,
    });

    console.log('✅ Bundling completado. Seleccionando composición...');

    // 7. Seleccionar composición
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'BulletinNews',
      inputProps,
    });

    // 8. Crear carpeta temporal de salida
    const outputDir = path.join(process.cwd(), 'temp', 'videos');
    await mkdir(outputDir, { recursive: true });

    tempVideoPath = path.join(outputDir, `bulletin-${id}.mp4`);

    console.log('🎥 Renderizando video final...');

    // 9. Renderizar video
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: tempVideoPath,
      inputProps,
    });

    console.log('✅ Video renderizado exitosamente');

    // 10. Subir a MinIO
    console.log('☁️ Subiendo video a MinIO...');
    const videoBuffer = await readFile(tempVideoPath);

    const fileName = `bulletins/${id}/final-video.mp4`;
    const finalVideoUrl = await uploadFile(fileName, videoBuffer, 'video/mp4');

    console.log(`✅ Video subido a MinIO: ${finalVideoUrl}`);

    // 11. Limpiar archivo temporal
    await unlink(tempVideoPath).catch(() => {});
    tempVideoPath = null;

    // 12. Actualizar BD con video final
    await db
      .update(bulletins)
      .set({
        finalVideoStatus: 'completed',
        finalVideoUrl,
        finalVideoMetadata: {
          ...((bulletin.finalVideoMetadata as Record<string, unknown> | null) || {}),
          duration: inputProps.totalDuration,
          resolution: '1080x1920',
          fps: 30,
          codec: 'h264',
          renderedAt: new Date().toISOString(),
          newsCount: newsWithVideos.length,
        },
      })
      .where(eq(bulletins.id, id));

    console.log(`✅ Video final completado para boletín ${id}`);

    return NextResponse.json({
      success: true,
      videoUrl: finalVideoUrl,
      duration: inputProps.totalDuration,
      newsCount: newsWithVideos.length,
      message: 'Video final renderizado exitosamente',
    });
  } catch (error) {
    console.error('❌ Error renderizando video final:', error);

    // Limpiar archivo temporal en caso de error
    if (tempVideoPath) {
      await unlink(tempVideoPath).catch(() => {});
    }

    const { id } = await context.params;

    await db
      .update(bulletins)
      .set({
        finalVideoStatus: 'failed',
        errorLog: {
          step: 'render_final_video',
          message: error instanceof Error ? error.message : 'Error desconocido',
          timestamp: new Date().toISOString(),
        },
      })
      .where(eq(bulletins.id, id));

    return errorResponse('Error renderizando video final', 500, error);
  }
}

/**
 * GET /api/bulletins/[id]/render-final-video
 *
 * Obtiene el estado del video final
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
        errorLog: true,
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
      status: bulletin.finalVideoStatus,
      url: bulletin.finalVideoUrl,
      metadata: bulletin.finalVideoMetadata,
      error: bulletin.errorLog,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error verificando estado del video' },
      { status: 500 }
    );
  }
}
