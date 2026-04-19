/**
 * Utilidades para convertir videos HLS a MP4
 * Usado para procesar videos de Simli API
 */

import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import { unlink } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { assertAllowedSimliHlsUrl } from './simli-url';

/**
 * Descarga un video HLS (.m3u8) y lo convierte a MP4
 *
 * @param hlsUrl - URL del archivo .m3u8
 * @param outputFilename - Nombre del archivo de salida (sin extensión)
 * @returns Buffer del video MP4
 */
export async function convertHLStoMP4(
  hlsUrl: string,
  outputFilename: string
): Promise<Buffer> {
  // Defensa en profundidad: rechazamos URLs fuera de la allowlist de Simli
  // antes de pasarle nada a FFmpeg.
  assertAllowedSimliHlsUrl(hlsUrl);

  const tempOutputPath = path.join(tmpdir(), `${outputFilename}.mp4`);

  console.log(`🎬 Convirtiendo HLS a MP4: ${hlsUrl}`);

  return new Promise((resolve, reject) => {
    ffmpeg(hlsUrl)
      .outputOptions([
        '-c copy', // Copiar codecs sin re-encodear (más rápido)
        '-bsf:a aac_adtstoasc', // Convertir AAC para MP4
      ])
      .output(tempOutputPath)
      .on('start', (commandLine) => {
        console.log(`📹 FFmpeg command: ${commandLine}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`⏳ Progreso: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on('end', async () => {
        try {
          console.log(`✅ Conversión completada: ${tempOutputPath}`);

          // Leer el archivo convertido
          const buffer = await fs.readFile(tempOutputPath);

          // Eliminar archivo temporal
          await unlink(tempOutputPath).catch(() => {});

          resolve(buffer);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error(`❌ Error en conversión FFmpeg:`, error);
        reject(error);
      })
      .run();
  });
}

/**
 * Descarga un video HLS directamente sin conversión
 * (solo si el formato ya es compatible)
 */
export async function downloadHLS(hlsUrl: string): Promise<Buffer> {
  assertAllowedSimliHlsUrl(hlsUrl);

  console.log(`⬇️ Descargando HLS: ${hlsUrl}`);

  const response = await fetch(hlsUrl);

  if (!response.ok) {
    throw new Error(`Error descargando HLS: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Obtiene información del video (duración, resolución, etc.)
 */
export async function getVideoInfo(
  videoPath: string
): Promise<{
  duration: number;
  width: number;
  height: number;
  codec: string;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === 'video'
      );

      if (!videoStream) {
        reject(new Error('No se encontró stream de video'));
        return;
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        codec: videoStream.codec_name || 'unknown',
      });
    });
  });
}
