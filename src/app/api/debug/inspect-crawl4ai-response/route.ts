/**
 * API Endpoint: GET /api/debug/inspect-crawl4ai-response
 *
 * Inspecciona la respuesta RAW de Crawl4AI para debug
 */

import { NextResponse } from "next/server";
import { getCrawl4AIClient } from "@/lib/crawl4ai/client";
import { getCategoryExtractionConfig } from "@/lib/crawl4ai/config";
import type { Crawl4AIRequestConfig } from "@/lib/crawl4ai/types";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const testUrl = "https://www.primicias.ec/politica/";
    const source = "Primicias";

    console.log("\n🔍 INSPECCIÓN DE RESPUESTA CRAWL4AI");
    console.log("═══════════════════════════════════════════════");
    console.log(`URL: ${testUrl}`);
    console.log(`Fuente: ${source}\n`);

    const config = getCategoryExtractionConfig(source);
    const client = getCrawl4AIClient();

    console.log("📋 Schema CSS configurado:");
    console.log(`   baseSelector: "${config.schema.baseSelector}"`);
    console.log(`   fields: ${config.schema.fields.length}`);
    config.schema.fields.forEach(field => {
      console.log(`     - ${field.name}: "${field.selector}" (${field.type})`);
    });

    // Hacer request con la estrategia CSS
    const requestConfig: Crawl4AIRequestConfig = {
      url: testUrl,
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      removeBase64Images: true,
      timeout: 120000,
      extractionStrategy: {
        type: 'json_css',
        config: { schema: config.schema },
      },
    };

    console.log("\n🌐 Enviando request a Crawl4AI...");

    // Hacer el request directamente para ver la respuesta RAW
    const rawResponse = await fetch(`${process.env.CRAWL4AI_API_URL}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [testUrl],
        ...requestConfig,
        url: undefined, // Remove url field, we use urls
      }),
    });

    const rawData = await rawResponse.json();
    console.log("\n📦 RESPUESTA RAW DE CRAWL4AI:");
    console.log(JSON.stringify(rawData, null, 2).substring(0, 2000));

    const response = await client.scrape(requestConfig);
    console.log(`\n✅ Respuesta procesada: success=${response.success}`);

    if (!response.data) {
      console.log("⚠️  No hay datos en la respuesta");
      return NextResponse.json({
        success: false,
        error: "No data in response",
        response,
      });
    }

    const data = response.data;

    console.log("\n📊 Datos en la respuesta:");
    console.log(`   - markdown: ${typeof data.markdown === 'string' ? data.markdown.length : 'NOT A STRING'} chars`);
    console.log(`   - html: ${typeof data.html === 'string' ? data.html.length : 'NOT A STRING'} chars`);
    console.log(`   - extracted: ${data.extracted ? 'SÍ' : 'NO'}`);
    console.log(`   - title: "${data.title || 'N/A'}"`);
    console.log(`   - images: ${data.images?.length || 0}`);
    console.log(`   - links: ${data.links ? `${data.links.internal?.length || 0} internal, ${data.links.external?.length || 0} external` : 'N/A'}`);

    if (data.extracted) {
      const extracted = data.extracted;
      const isArray = Array.isArray(extracted);
      console.log(`\n📦 Extracted data:`);
      console.log(`   - Type: ${isArray ? 'Array' : typeof extracted}`);
      console.log(`   - Length/Keys: ${isArray ? extracted.length : Object.keys(extracted as object).join(', ')}`);

      if (isArray && extracted.length > 0) {
        console.log(`\n📰 Primer item extraído:`);
        console.log(JSON.stringify(extracted[0], null, 2));
      } else {
        console.log(`\n📰 Datos extraídos completos:`);
        console.log(JSON.stringify(extracted, null, 2));
      }
    }

    return NextResponse.json({
      success: true,
      url: testUrl,
      config: {
        baseSelector: config.schema.baseSelector,
        fields: config.schema.fields,
      },
      response: {
        success: response.success,
        hasData: !!response.data,
        markdownLength: typeof data.markdown === 'string' ? data.markdown.length : 0,
        htmlLength: typeof data.html === 'string' ? data.html.length : 0,
        hasExtracted: !!data.extracted,
        extractedType: data.extracted ? (Array.isArray(data.extracted) ? 'array' : typeof data.extracted) : null,
        extractedLength: Array.isArray(data.extracted) ? data.extracted.length : null,
        extractedSample: Array.isArray(data.extracted) ? data.extracted.slice(0, 2) : data.extracted,
        markdownPreview: typeof data.markdown === 'string' ? data.markdown.substring(0, 1000) : 'NOT A STRING',
        title: data.title,
        imagesCount: data.images?.length || 0,
      },
    });
  } catch (error) {
    console.error("\n❌ ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Error interno",
        stack:
          process.env.NODE_ENV === "development" ? (error as Error).stack : undefined,
      },
      { status: 500 }
    );
  }
}
