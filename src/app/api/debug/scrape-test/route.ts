/**
 * API Endpoint: POST /api/debug/scrape-test
 *
 * Endpoint de depuración para probar el scraping de una fuente
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { errorResponse } from "@/lib/http/error-response";

/**
 * Dominios permitidos para pruebas de scraping. Se restringe a las fuentes de
 * noticias configuradas para evitar que este endpoint sea abusado como proxy
 * SSRF a la red interna o a servicios arbitrarios.
 */
const ALLOWED_HOSTNAMES = [
  "primicias.ec",
  "lahora.com.ec",
  "elcomercio.com",
  "teleamazonas.com",
  "ecu911.gob.ec",
];

function isAllowedUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return ALLOWED_HOSTNAMES.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL es requerida" },
        { status: 400 }
      );
    }

    if (!isAllowedUrl(url)) {
      return NextResponse.json(
        {
          error: "URL no permitida",
          message:
            "Solo se pueden probar URLs de los dominios de noticias configurados.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "FIRECRAWL_API_KEY no está configurada" },
        { status: 500 }
      );
    }

    console.log(`🔍 Testing scrape para: ${url}`);

    // Obtener URL del API de Firecrawl
    const baseUrl = process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev";
    const apiUrl = baseUrl.endsWith("/v1/scrape")
      ? baseUrl
      : `${baseUrl}/v1/scrape`;

    console.log(`🌐 Using Firecrawl API: ${apiUrl}`);

    // Llamar a Firecrawl
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
        waitFor: 2000,
        removeBase64Images: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Firecrawl API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Retornar datos resumidos de Firecrawl (sin payload completo para no
    // exponer headers o metadatos sensibles del backend).
    return NextResponse.json({
      success: data.success,
      url,
      markdownLength: data.data?.markdown?.length || 0,
      htmlLength: data.data?.html?.length || 0,
      markdownPreview: data.data?.markdown?.substring(0, 500) || "",
      htmlPreview: data.data?.html?.substring(0, 500) || "",
      metadata: data.data?.metadata || {},
    });
  } catch (error) {
    console.error("❌ Error en scrape-test:", error);

    return errorResponse("Error interno", 500, error);
  }
}
