/**
 * API Endpoint: POST /api/debug/scrape-test
 *
 * Endpoint de depuración para probar el scraping de una fuente
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL es requerida" },
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

    // Retornar datos completos de Firecrawl para depuración
    return NextResponse.json({
      success: data.success,
      url,
      markdownLength: data.data?.markdown?.length || 0,
      htmlLength: data.data?.html?.length || 0,
      markdownPreview: data.data?.markdown?.substring(0, 500) || "",
      htmlPreview: data.data?.html?.substring(0, 500) || "",
      metadata: data.data?.metadata || {},
      fullData: data, // Incluir todo para depuración
    });
  } catch (error) {
    console.error("❌ Error en scrape-test:", error);

    return NextResponse.json(
      {
        error: "Error interno",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
