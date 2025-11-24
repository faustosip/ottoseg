/**
 * MinIO Storage Service
 *
 * Maneja todas las operaciones de almacenamiento de archivos en MinIO
 */

import * as Minio from 'minio';
import { Readable } from 'stream';

// Configuración de MinIO desde variables de entorno
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'noticias';

/**
 * Cliente de MinIO singleton
 */
export const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

/**
 * Inicializa el bucket si no existe
 */
export async function initializeBucket(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(MINIO_BUCKET);

    if (!exists) {
      console.log(`📦 Creando bucket "${MINIO_BUCKET}"...`);
      await minioClient.makeBucket(MINIO_BUCKET, 'us-east-1');

      // Configurar política pública para el bucket (solo lectura)
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(MINIO_BUCKET, JSON.stringify(policy));
      console.log(`✅ Bucket "${MINIO_BUCKET}" creado y configurado`);
    } else {
      console.log(`✅ Bucket "${MINIO_BUCKET}" ya existe`);
    }
  } catch (error) {
    console.error('❌ Error inicializando bucket MinIO:', error);
    throw error;
  }
}

/**
 * Sube un archivo desde un Buffer
 */
export async function uploadFile(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  try {
    await initializeBucket();

    const metadata = {
      'Content-Type': contentType,
    };

    await minioClient.putObject(
      MINIO_BUCKET,
      fileName,
      fileBuffer,
      fileBuffer.length,
      metadata
    );

    // Construir URL pública
    const publicUrl = getPublicUrl(fileName);

    console.log(`✅ Archivo subido a MinIO: ${fileName}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Error subiendo archivo a MinIO: ${fileName}`, error);
    throw error;
  }
}

/**
 * Sube un archivo desde un Stream
 */
export async function uploadStream(
  fileName: string,
  stream: Readable,
  size: number,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  try {
    await initializeBucket();

    const metadata = {
      'Content-Type': contentType,
    };

    await minioClient.putObject(
      MINIO_BUCKET,
      fileName,
      stream,
      size,
      metadata
    );

    const publicUrl = getPublicUrl(fileName);

    console.log(`✅ Stream subido a MinIO: ${fileName}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Error subiendo stream a MinIO: ${fileName}`, error);
    throw error;
  }
}

/**
 * Descarga un archivo y lo retorna como Buffer
 */
export async function downloadFile(fileName: string): Promise<Buffer> {
  try {
    const dataStream = await minioClient.getObject(MINIO_BUCKET, fileName);

    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      dataStream.on('data', (chunk) => chunks.push(chunk));
      dataStream.on('end', () => resolve(Buffer.concat(chunks)));
      dataStream.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Error descargando archivo de MinIO: ${fileName}`, error);
    throw error;
  }
}

/**
 * Elimina un archivo
 */
export async function deleteFile(fileName: string): Promise<void> {
  try {
    await minioClient.removeObject(MINIO_BUCKET, fileName);
    console.log(`✅ Archivo eliminado de MinIO: ${fileName}`);
  } catch (error) {
    console.error(`❌ Error eliminando archivo de MinIO: ${fileName}`, error);
    throw error;
  }
}

/**
 * Genera URL pública de un archivo
 */
export function getPublicUrl(fileName: string): string {
  const protocol = MINIO_USE_SSL ? 'https' : 'http';
  const port = MINIO_PORT === 443 || MINIO_PORT === 80 ? '' : `:${MINIO_PORT}`;

  return `${protocol}://${MINIO_ENDPOINT}${port}/${MINIO_BUCKET}/${fileName}`;
}

/**
 * Genera URL pre-firmada (temporal) para descarga privada
 */
export async function getPresignedUrl(
  fileName: string,
  expirySeconds: number = 3600
): Promise<string> {
  try {
    const url = await minioClient.presignedGetObject(
      MINIO_BUCKET,
      fileName,
      expirySeconds
    );

    return url;
  } catch (error) {
    console.error(`❌ Error generando URL pre-firmada: ${fileName}`, error);
    throw error;
  }
}

/**
 * Lista archivos en una carpeta
 */
export async function listFiles(prefix: string = ''): Promise<string[]> {
  try {
    const stream = minioClient.listObjects(MINIO_BUCKET, prefix, true);

    const files: string[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          files.push(obj.name);
        }
      });
      stream.on('end', () => resolve(files));
      stream.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Error listando archivos de MinIO: ${prefix}`, error);
    throw error;
  }
}

/**
 * Verifica si un archivo existe
 */
export async function fileExists(fileName: string): Promise<boolean> {
  try {
    await minioClient.statObject(MINIO_BUCKET, fileName);
    return true;
  } catch (error) {
    return false;
  }
}
