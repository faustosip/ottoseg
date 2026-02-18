/**
 * API Endpoint: GET /api/news/diagnose
 *
 * Diagnostica problemas de conectividad con fuentes de noticias.
 * Prueba fetch directo y Crawl4AI para cada fuente.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getActiveSources } from "@/lib/db/queries/sources";
import * as cheerio from "cheerio";
import { getCategoryExtractionConfig } from "@/lib/crawl4ai/config";
import { getCrawl4AIClient } from "@/lib/crawl4ai/client";

export const maxDuration = 120;

export async function GET() {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sources = await getActiveSources();
    const results: Record<string, unknown> = {};

    // Only test La Hora in detail (the problematic source)
    for (const source of sources) {
      const scrapeConfig = source.scrapeConfig as { urls?: string[] } | null;
      const urls = scrapeConfig?.urls || [source.url];
      const normalizedSource = source.name.toLowerCase().replace(/\s+/g, "");
      const config = getCategoryExtractionConfig(source.name);

      // For La Hora, test only the first URL but with more detail
      const testUrl = urls[0];
      const isLaHora = normalizedSource === "lahora";

      // Test 1: Direct HTTP fetch
      let directResult: Record<string, unknown> = {};
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(testUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const html = await response.text();
        const $ = cheerio.load(html);
        const baseSelector = config.schema.baseSelector;
        const matchCount = $(baseSelector).length;
        const pageTitle = $("title").text().trim().substring(0, 200);

        // Capture response headers for CDN analysis
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        directResult = {
          url: testUrl,
          status: response.status,
          statusText: response.statusText,
          htmlLength: html.length,
          pageTitle,
          baseSelector,
          selectorMatches: matchCount,
          ok: response.ok && matchCount > 0,
          // Include challenge page body if small (CDN challenge detection)
          challengePageBody: html.length < 5000 ? html : undefined,
          responseHeaders: isLaHora ? responseHeaders : undefined,
        };
      } catch (error) {
        directResult = {
          url: testUrl,
          status: 0,
          error: (error as Error).message,
          ok: false,
        };
      }

      // Test 2: Crawl4AI (only for La Hora to test browser bypass)
      let crawl4aiResult: Record<string, unknown> | undefined;
      if (isLaHora) {
        try {
          const client = getCrawl4AIClient();
          const crawlResponse = await client.scrape({
            url: testUrl,
            formats: ["html"],
            onlyMainContent: false,
            removeBase64Images: true,
            timeout: 30000,
            waitTime: 5, // Wait 5 seconds for CDN challenge to resolve
          });

          if (crawlResponse.success && crawlResponse.data?.html) {
            const html = crawlResponse.data.html;
            const $ = cheerio.load(html);
            const baseSelector = config.schema.baseSelector;
            const matchCount = $(baseSelector).length;
            const pageTitle = $("title").text().trim().substring(0, 200);

            crawl4aiResult = {
              success: true,
              htmlLength: html.length,
              pageTitle,
              selectorMatches: matchCount,
              ok: matchCount > 0,
              htmlPreview: html.length < 5000 ? html : html.substring(0, 500) + "...",
            };
          } else {
            crawl4aiResult = {
              success: false,
              error: "No HTML returned",
              rawResponse: JSON.stringify(crawlResponse).substring(0, 500),
            };
          }
        } catch (error) {
          crawl4aiResult = {
            success: false,
            error: (error as Error).message,
          };
        }
      }

      results[source.name] = {
        normalizedName: normalizedSource,
        totalUrls: urls.length,
        urls,
        directFetch: directResult,
        crawl4ai: crawl4aiResult,
        configuredSelector: config.schema.baseSelector,
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
