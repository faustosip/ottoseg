/**
 * API Endpoint: GET /api/news/diagnose
 *
 * Diagnostica problemas de conectividad con fuentes de noticias.
 * Para La Hora, prueba las 3 estrategias: section+amp, homepage, Google News RSS.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getActiveSources } from "@/lib/db/queries/sources";
import * as cheerio from "cheerio";
import { getCategoryExtractionConfig } from "@/lib/crawl4ai/config";

export const maxDuration = 60;

async function testUrl(url: string, baseSelector: string) {
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
    const matchCount = $(baseSelector).length;
    const pageTitle = $("title").text().trim().substring(0, 200);

    return {
      url,
      status: response.status,
      htmlLength: html.length,
      pageTitle,
      selectorMatches: matchCount,
      ok: response.ok && matchCount > 0,
      isChallenge: html.length < 5000,
    };
  } catch (error) {
    return {
      url,
      status: 0,
      error: (error as Error).message,
      ok: false,
    };
  }
}

/**
 * Test La Hora homepage scraping strategy
 */
async function testLaHoraHomepage() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch("https://www.lahora.com.ec/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        Referer: "https://www.google.com/",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const html = await response.text();
    const $ = cheerio.load(html);

    // Count article links per section
    const sections: Record<string, number> = {};
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const match = href.match(/^\/([a-z]+)\/[^/]+\.html$/);
      if (match) {
        const section = match[1];
        sections[section] = (sections[section] || 0) + 1;
      }
    });

    return {
      url: "https://www.lahora.com.ec/",
      status: response.status,
      htmlLength: html.length,
      isChallenge: html.length < 5000,
      ok: response.ok && html.length > 10000,
      articleLinksBySection: sections,
      totalArticleLinks: Object.values(sections).reduce((a, b) => a + b, 0),
    };
  } catch (error) {
    return {
      url: "https://www.lahora.com.ec/",
      status: 0,
      error: (error as Error).message,
      ok: false,
    };
  }
}

/**
 * Test Google News RSS strategy for La Hora
 */
async function testGoogleNewsRSS(section: string) {
  try {
    const query = `site:lahora.com.ec/${section} when:3d`;
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-419&gl=EC&ceid=EC:es-419`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    const rssXml = await response.text();
    const $ = cheerio.load(rssXml, { xmlMode: true });
    const items: string[] = [];
    $("item").each((_, item) => {
      const title = $(item).find("title").text().trim();
      if (title && title.length > 5) items.push(title);
    });

    return {
      url: rssUrl,
      status: response.status,
      ok: response.ok && items.length > 0,
      articleCount: items.length,
      sampleTitles: items.slice(0, 3),
    };
  } catch (error) {
    return {
      url: `Google News RSS for ${section}`,
      status: 0,
      error: (error as Error).message,
      ok: false,
    };
  }
}

export async function GET() {
  try {
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
      const selector = config.schema.baseSelector;

      const testUrl1 = urls[0];

      // Test direct fetch
      const directResult = await testUrl(testUrl1, selector);

      if (normalizedSource === "lahora") {
        // La Hora: test all 3 strategies
        const ampUrl =
          testUrl1 + (testUrl1.includes("?") ? "&" : "?") + "amp=1";
        const ampResult = await testUrl(ampUrl, selector);
        const homepageResult = await testLaHoraHomepage();
        const googleNewsResult = await testGoogleNewsRSS("seguridad");

        results[source.name] = {
          normalizedName: normalizedSource,
          urls,
          configuredSelector: selector,
          strategy1_sectionAmp: ampResult,
          strategy2_homepage: homepageResult,
          strategy3_googleNews: googleNewsResult,
          directFetch_raw: directResult,
        };
      } else {
        results[source.name] = {
          normalizedName: normalizedSource,
          urls,
          directFetch: directResult,
          configuredSelector: selector,
        };
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
