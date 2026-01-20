/**
 * API Endpoint: /api/subscribers/import
 *
 * POST - Import subscribers from CSV
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { bulkCreateSubscribers } from "@/lib/db/queries/subscribers";

/**
 * POST /api/subscribers/import
 *
 * Import subscribers from CSV data
 * Expects JSON body with array of { email, name? }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Parse body - can be JSON array or FormData with CSV file
    const contentType = request.headers.get("content-type") || "";

    let subscriberData: Array<{ email: string; name?: string }> = [];

    if (contentType.includes("application/json")) {
      // JSON array
      const body = await request.json();

      if (!Array.isArray(body.subscribers)) {
        return NextResponse.json(
          { error: "Se requiere un array de suscriptores" },
          { status: 400 }
        );
      }

      subscriberData = body.subscribers;
    } else if (contentType.includes("multipart/form-data")) {
      // CSV file upload
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No se proporcionó archivo CSV" },
          { status: 400 }
        );
      }

      // Parse CSV
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      // Check if first line is header
      const firstLine = lines[0].toLowerCase();
      const hasHeader =
        firstLine.includes("email") || firstLine.includes("correo");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      for (const line of dataLines) {
        const parts = line.split(",").map((p) => p.trim().replace(/"/g, ""));
        const email = parts[0];
        const name = parts[1] || undefined;

        // Basic email validation
        if (email && email.includes("@")) {
          subscriberData.push({ email, name });
        }
      }
    } else {
      return NextResponse.json(
        { error: "Content-Type no soportado" },
        { status: 400 }
      );
    }

    if (subscriberData.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron suscriptores válidos" },
        { status: 400 }
      );
    }

    // Bulk import
    const result = await bulkCreateSubscribers(subscriberData);

    console.log(
      `✅ Import completed: ${result.created} created, ${result.skipped} skipped`
    );

    return NextResponse.json({
      success: true,
      ...result,
      total: subscriberData.length,
    });
  } catch (error) {
    console.error("❌ Error importing subscribers:", error);

    return NextResponse.json(
      {
        error: "Error importando suscriptores",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
