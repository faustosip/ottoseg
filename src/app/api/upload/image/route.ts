/**
 * API Route: Upload Image to Supabase Storage
 *
 * POST /api/upload/image
 * Handles image file uploads and stores them in Supabase Storage
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadFile } from "@/lib/storage/supabase-storage";
import { v4 as uuidv4 } from "uuid";

// Allowed image types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Tipo de archivo no permitido",
          allowed: ALLOWED_TYPES,
          received: file.type
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "El archivo es demasiado grande",
          maxSize: "5MB",
          receivedSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = file.name.split(".").pop() || "jpg";
    const uniqueFileName = `${uuidv4()}.${extension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const publicUrl = await uploadFile(uniqueFileName, buffer, file.type);

    console.log(`✅ Imagen subida: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error("❌ Error subiendo imagen:", error);

    return NextResponse.json(
      {
        error: "Error al subir la imagen",
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
