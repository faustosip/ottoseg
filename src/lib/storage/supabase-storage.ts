/**
 * Supabase Storage Service
 *
 * Maneja todas las operaciones de almacenamiento de archivos en Supabase Storage
 */

import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase desde variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Bucket para imágenes de boletines
const BUCKET_NAME = "bulletin-images";

/**
 * Cliente de Supabase con service role key para operaciones de storage
 */
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Inicializa el bucket si no existe
 */
export async function initializeBucket(): Promise<void> {
  try {
    // Verificar si el bucket existe
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError);
      throw listError;
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log(`📦 Creando bucket "${BUCKET_NAME}"...`);

      const { error: createError } = await supabaseAdmin.storage.createBucket(
        BUCKET_NAME,
        {
          public: true, // Acceso público para las imágenes
          fileSizeLimit: 5 * 1024 * 1024, // 5MB max
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
          ],
        }
      );

      if (createError) {
        // Si el error es que ya existe, ignorarlo
        if (!createError.message?.includes("already exists")) {
          throw createError;
        }
      }

      console.log(`✅ Bucket "${BUCKET_NAME}" creado y configurado`);
    } else {
      console.log(`✅ Bucket "${BUCKET_NAME}" ya existe`);
    }
  } catch (error) {
    console.error("❌ Error inicializando bucket Supabase:", error);
    throw error;
  }
}

/**
 * Sube un archivo desde un Buffer
 */
export async function uploadFile(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string = "application/octet-stream"
): Promise<string> {
  try {
    await initializeBucket();

    // Subir archivo
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true, // Sobrescribir si existe
      });

    if (error) {
      throw error;
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log(`✅ Archivo subido a Supabase Storage: ${fileName}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Error subiendo archivo a Supabase: ${fileName}`, error);
    throw error;
  }
}

/**
 * Elimina un archivo
 */
export async function deleteFile(fileName: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      throw error;
    }

    console.log(`✅ Archivo eliminado de Supabase: ${fileName}`);
  } catch (error) {
    console.error(`❌ Error eliminando archivo de Supabase: ${fileName}`, error);
    throw error;
  }
}

/**
 * Genera URL pública de un archivo
 */
export function getPublicUrl(fileName: string): string {
  const { data } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Lista archivos en una carpeta
 */
export async function listFiles(prefix: string = ""): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(prefix);

    if (error) {
      throw error;
    }

    return data?.map((file) => file.name) || [];
  } catch (error) {
    console.error(`❌ Error listando archivos de Supabase: ${prefix}`, error);
    throw error;
  }
}

/**
 * Verifica si un archivo existe
 */
export async function fileExists(fileName: string): Promise<boolean> {
  try {
    const folder = fileName.split("/").slice(0, -1).join("/");
    const name = fileName.split("/").pop() || "";

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(folder);

    if (error) {
      return false;
    }

    return data?.some((file) => file.name === name) || false;
  } catch {
    return false;
  }
}
