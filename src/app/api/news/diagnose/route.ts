/**
 * API Endpoint: GET /api/news/diagnose
 *
 * Diagnostica problemas de conectividad con fuentes de noticias.
 * Prueba cada URL de cada fuente y reporta el resultado.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getActiveSources } from "@/lib/db/queries/sources";
import * as cheerio from "cheerio";
import { getCategoryExtractionConfig } from "@/lib/crawl4ai/config";

export const maxDuration = 60;

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

    for (const source of sources) {
      const scrapeConfig = source.scrapeConfig as { urls?: string[] } | null;
      const urls = scrapeConfig?.urls || [source.url];
      const normalizedSource = source.name.toLowerCase().replace(/\s+/g, "");
      const config = getCategoryExtractionConfig(source.name);

      const urlResults = await Promise.all(
        urls.map(async (url) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
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

            // Get first 200 chars of <title> for identification
            const pageTitle = $("title").text().trim().substring(0, 200);

            return {
              url,
              status: response.status,
              statusText: response.statusText,
              htmlLength: html.length,
              pageTitle,
              baseSelector,
              selectorMatches: matchCount,
              ok: response.ok && matchCount > 0,
            };
          } catch (error) {
            return {
              url,
              status: 0,
              error: (error as Error).message,
              ok: false,
            };
          }
        })
      );

      results[source.name] = {
        id: source.id,
        normalizedName: normalizedSource,
        totalUrls: urls.length,
        urlResults,
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
