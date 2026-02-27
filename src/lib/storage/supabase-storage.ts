/**
 * Supabase Storage Service
 *
 * Maneja todas las operaciones de almacenamiento de archivos en Supabase Storage
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Bucket para imágenes de boletines
const BUCKET_NAME = "bulletin-images";

// Cliente singleton (lazy initialization)
let supabaseAdmin: SupabaseClient | null = null;

/**
 * Obtiene el cliente de Supabase (lazy initialization)
 * Esto evita que el cliente se inicialice durante el build de Next.js
 */
function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    // Buscar URL en múltiples variables (SUPABASE_URL para server-side, NEXT_PUBLIC_SUPABASE_URL como fallback)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variables de Supabase faltantes:", {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      throw new Error(
        "Supabase no está configurado. Configura SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY."
      );
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}

/**
 * Inicializa el bucket si no existe
 */
export async function initializeBucket(): Promise<void> {
  try {
    const client = getSupabaseAdmin();

    // Verificar si el bucket existe
    const { data: buckets, error: listError } = await client.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError);
      throw listError;
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log(`📦 Creando bucket "${BUCKET_NAME}"...`);

      const { error: createError } = await client.storage.createBucket(
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

    const client = getSupabaseAdmin();

    // Subir archivo
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true, // Sobrescribir si existe
      });

    if (error) {
      throw error;
    }

    // Obtener URL pública
    const { data: urlData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log(`✅ Archivo subido a Supabase Storage: ${fileName}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Error subiendo archivo a Supabase: ${fileName}`, error);
    throw error;
  }
}

// Bucket para videos de boletines
const VIDEO_BUCKET_NAME = "bulletin-videos";

/**
 * Inicializa el bucket de videos si no existe
 */
async function initializeVideoBucket(): Promise<void> {
  try {
    const client = getSupabaseAdmin();
    const { data: buckets, error: listError } = await client.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    const bucketExists = buckets?.some((b) => b.name === VIDEO_BUCKET_NAME);

    if (!bucketExists) {
      console.log(`📦 Creando bucket "${VIDEO_BUCKET_NAME}"...`);

      const { error: createError } = await client.storage.createBucket(
        VIDEO_BUCKET_NAME,
        {
          public: true,
          fileSizeLimit: 150 * 1024 * 1024, // 150MB max
          allowedMimeTypes: ["video/mp4"],
        }
      );

      if (createError) {
        if (!createError.message?.includes("already exists")) {
          throw createError;
        }
      }

      console.log(`✅ Bucket "${VIDEO_BUCKET_NAME}" creado y configurado`);
    }
  } catch (error) {
    console.error("❌ Error inicializando bucket de videos:", error);
    throw error;
  }
}

/**
 * Sube un archivo de video al bucket de videos
 */
export async function uploadVideoFile(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string = "video/mp4"
): Promise<string> {
  try {
    await initializeVideoBucket();

    const client = getSupabaseAdmin();

    const { data, error } = await client.storage
      .from(VIDEO_BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = client.storage
      .from(VIDEO_BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log(`✅ Video subido a Supabase Storage: ${fileName}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Error subiendo video a Supabase: ${fileName}`, error);
    throw error;
  }
}

/**
 * Elimina un archivo
 */
export async function deleteFile(fileName: string): Promise<void> {
  try {
    const client = getSupabaseAdmin();

    const { error } = await client.storage
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
  const client = getSupabaseAdmin();

  const { data } = client.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Lista archivos en una carpeta
 */
export async function listFiles(prefix: string = ""): Promise<string[]> {
  try {
    const client = getSupabaseAdmin();

    const { data, error } = await client.storage
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
    const client = getSupabaseAdmin();

    const folder = fileName.split("/").slice(0, -1).join("/");
    const name = fileName.split("/").pop() || "";

    const { data, error } = await client.storage
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
