import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {bulletins} from '@/lib/schema';
import {eq} from 'drizzle-orm';
import path from 'path';
import {mkdir} from 'fs/promises';
import {requireActiveUser} from '@/lib/auth-guard';
import {errorResponse} from '@/lib/http/error-response';
import {checkRateLimit, rateLimitResponse} from '@/lib/rate-limit';

// Force dynamic rendering (no static optimization)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const guard = await requireActiveUser();
    if (!guard.ok) return guard.response;

    // Rate limit: 3 por hora por usuario (pipeline de video compuesto).
    const rl = await checkRateLimit('generate-video', guard.session.user.id, 3, 3600);
    if (!rl.allowed) return rateLimitResponse(rl);

    const {id} = await params;

    // 1. Obtener el boletín
    const bulletin = await db.query.bulletins.findFirst({
      where: eq(bulletins.id, id),
    });

    if (!bulletin) {
      return NextResponse.json(
        {error: 'Boletín no encontrado'},
        {status: 404}
      );
    }

    // 2. Actualizar estado a "processing"
    await db
      .update(bulletins)
      .set({videoStatus: 'processing'})
      .where(eq(bulletins.id, id));

    // 3. Formatear la fecha del boletín
    const bulletinDate = new Date(bulletin.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedDate = bulletinDate.toUpperCase();

    // 4. Importar Remotion dinámicamente (solo en runtime, no durante build)
    console.log('🎬 Cargando módulos de Remotion...');
    const [{bundle}, {renderMedia, selectComposition}] = await Promise.all([
      import('@remotion/bundler'),
      import('@remotion/renderer'),
    ]);

    // 5. Renderizar video con Remotion
    console.log('🎬 Iniciando bundling de Remotion...');
    const bundled = await bundle({
      entryPoint: path.join(process.cwd(), 'remotion', 'index.ts'),
      webpackOverride: (config) => config,
    });

    console.log('✅ Bundling completado. Seleccionando composición...');
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'BulletinNews',
      inputProps: {
        bulletinDate: formattedDate,
        avatarSrc: 'videos/avatar.mp4',
      },
    });

    // 6. Crear carpeta de salida si no existe
    const outputDir = path.join(process.cwd(), 'public', 'videos');
    await mkdir(outputDir, {recursive: true});

    const outputPath = path.join(outputDir, `bulletin-${id}.mp4`);

    console.log('🎥 Renderizando video...');
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: composition.props,
    });

    console.log('✅ Video renderizado exitosamente');

    // 7. Actualizar BD con video generado
    await db
      .update(bulletins)
      .set({
        videoStatus: 'completed',
        videoUrl: `/videos/bulletin-${id}.mp4`,
        videoMetadata: {
          duration: 35,
          resolution: '1080x1920',
          fps: 30,
          codec: 'h264',
          generatedAt: new Date().toISOString(),
        },
      })
      .where(eq(bulletins.id, id));

    return NextResponse.json({
      success: true,
      videoUrl: `/videos/bulletin-${id}.mp4`,
      message: 'Video generado exitosamente',
    });
  } catch (error) {
    console.error('❌ Error generando video:', error);

    const {id} = await params;

    // Actualizar estado a failed
    await db
      .update(bulletins)
      .set({
        videoStatus: 'failed',
        errorLog: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          timestamp: new Date().toISOString(),
        },
      })
      .where(eq(bulletins.id, id));

    return errorResponse('Error generando video', 500, error);
  }
}

// GET para verificar el estado del video
export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const guard = await requireActiveUser();
    if (!guard.ok) return guard.response;

    const {id} = await params;

    const bulletin = await db.query.bulletins.findFirst({
      where: eq(bulletins.id, id),
      columns: {
        videoStatus: true,
        videoUrl: true,
        videoMetadata: true,
        errorLog: true,
      },
    });

    if (!bulletin) {
      return NextResponse.json(
        {error: 'Boletín no encontrado'},
        {status: 404}
      );
    }

    return NextResponse.json({
      status: bulletin.videoStatus,
      url: bulletin.videoUrl,
      metadata: bulletin.videoMetadata,
      error: bulletin.errorLog,
    });
  } catch (error) {
    return NextResponse.json(
      {error: 'Error verificando estado del video'},
      {status: 500}
    );
  }
}
