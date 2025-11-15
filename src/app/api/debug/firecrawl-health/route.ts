/**
 * API Endpoint: GET /api/debug/firecrawl-health
 *
 * Verifica la conectividad con Firecrawl API
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    const baseUrl = process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev";
    const apiUrl = baseUrl.endsWith("/v1/scrape")
      ? baseUrl
      : `${baseUrl}/v1/scrape`;

    if (!apiKey) {
      return NextResponse.json(
        {
          status: "error",
          message: "FIRECRAWL_API_KEY no está configurada",
        },
        { status: 500 }
      );
    }

    console.log(`🔍 Testing Firecrawl health check...`);
    console.log(`   API URL: ${apiUrl}`);
    console.log(`   API Key: ${apiKey.substring(0, 10)}...`);

    // Hacer un scrape simple de Google (siempre disponible)
    const testUrl = "https://www.google.com";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: testUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Firecrawl error: ${response.status}`, errorText);

      return NextResponse.json(
        {
          status: "error",
          message: `Firecrawl API returned ${response.status}`,
          details: errorText.substring(0, 500),
          apiUrl,
          duration: `${(duration / 1000).toFixed(2)}s`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log(`✅ Firecrawl health check OK (${(duration / 1000).toFixed(2)}s)`);

    return NextResponse.json({
      status: "ok",
      message: "Firecrawl API is working correctly",
      apiUrl,
      duration: `${(duration / 1000).toFixed(2)}s`,
      testUrl,
      firecrawlResponse: {
        success: data.success,
        hasData: !!data.data,
        markdownLength: data.data?.markdown?.length || 0,
      },
    });
  } catch (error) {
    console.error("❌ Error en health check:", error);

    return NextResponse.json(
      {
        status: "error",
        message: (error as Error).message,
        errorType: (error as Error).name,
      },
      { status: 500 }
    );
  }
}
