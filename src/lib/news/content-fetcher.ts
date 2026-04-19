/**
 * Content Fetcher Module
 *
 * Fetches full article content from source URLs using direct HTTP + Cheerio.
 * Shared between the manual fetch-full-content endpoint and the automatic process pipeline.
 */

import * as cheerio from "cheerio";
import {
  getBulletinById,
  updateBulletinClassification,
} from "@/lib/db/queries/bulletins";
import type { ClassifiedArticle } from "@/lib/news/classifier";
import { assertAllowedUrl, fetchWithSizeLimit } from "@/lib/net/safe-fetch";

/**
 * Content selectors per source domain
 */
const CONTENT_SELECTORS: Record<string, string[]> = {
  "primicias.ec": [
    "div.c-detail__content",
    "article.c-body.c-detail",
    "div.c-detail__content-information",
    "div.entry-content",
  ],
  "lahora.com.ec": [
    "div[class*='contentNews']",
    "div[class*='content__cD3yf']",
    "div[class*='childrenContent']",
    "div[class*='ContentInner']",
    ".article-content",
    ".entry-content",
  ],
  "elcomercio.com": [
    'div[itemprop="articleBody"]',
    ".article-body",
    ".story-content",
    ".entry-content",
  ],
  "teleamazonas.com": [
    "div.c-detail__content",
    "article.c-detail",
    "div.body-modules",
    ".article-content",
    ".entry-content",
  ],
  "ecu911.gob.ec": [
    ".entry-content",
    ".post-content",
    "article .content",
  ],
};

/**
 * Generic fallback selectors for any news site
 */
const GENERIC_SELECTORS = [
  'article [itemprop="articleBody"]',
  "article .entry-content",
  "article .post-content",
  ".article-body",
  ".story-body",
  ".post-body",
  "article .content",
  ".entry-content",
  "main article",
];

/**
 * Detect source domain from URL
 */
function getSourceDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    for (const domain of Object.keys(CONTENT_SELECTORS)) {
      if (hostname.includes(domain)) return domain;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clean extracted text - remove ads, navigation, etc.
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/gm, "")
    .trim();
}

/**
 * Extract article body from HTML using Cheerio
 */
function extractArticleContent(html: string, url: string): string | null {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $(
    "script, style, nav, header, footer, aside, .ad, .ads, .advertisement, " +
    ".social-share, .share-buttons, .related-articles, .comments, " +
    ".sidebar, .newsletter, .subscription, .cookie, .popup, " +
    "iframe, noscript, .breadcrumb, .tags, .author-bio"
  ).remove();

  const domain = getSourceDomain(url);
  const selectors = domain
    ? [...CONTENT_SELECTORS[domain], ...GENERIC_SELECTORS]
    : GENERIC_SELECTORS;

  for (const selector of selectors) {
    const $content = $(selector);
    if ($content.length > 0) {
      // Get all paragraphs within the content area
      const paragraphs: string[] = [];
      $content.find("p").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) {
          paragraphs.push(text);
        }
      });

      if (paragraphs.length >= 2) {
        return paragraphs.join("\n\n");
      }

      // Fallback: get the text content directly
      const directText = cleanText($content.text());
      if (directText.length > 200) {
        return directText;
      }
    }
  }

  // Last resort: try to find the longest text block
  const allParagraphs: string[] = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 50) {
      allParagraphs.push(text);
    }
  });

  if (allParagraphs.length >= 3) {
    return allParagraphs.join("\n\n");
  }

  return null;
}

/**
 * Extract slug from El Comercio URL for WordPress API
 */
function extractElComercioSlug(url: string): string | null {
  try {
    const pathname = new URL(url).pathname.replace(/\/$/, "");
    const parts = pathname.split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

/**
 * Fetch El Comercio article via WordPress REST API
 */
async function fetchElComercioContent(url: string): Promise<string | null> {
  const slug = extractElComercioSlug(url);
  if (!slug) return null;

  try {
    const apiUrl = `https://www.elcomercio.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=content`;

    // Validar hostname + IP (anti-SSRF). Si falla, simplemente no seguimos.
    await assertAllowedUrl(apiUrl);

    const response = await fetchWithSizeLimit(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeoutMs: 15_000,
      maxBytes: 5 * 1024 * 1024,
    });

    if (!response.ok) return null;

    const data = JSON.parse(response.text);
    if (!Array.isArray(data) || data.length === 0) return null;

    const htmlContent = data[0]?.content?.rendered;
    if (!htmlContent) return null;

    // Parse HTML and extract text
    const $ = cheerio.load(htmlContent);
    $("script, style, iframe").remove();

    // Remove "Más noticias" / "Te recomendamos" headings and their adjacent link lists
    $("h3").each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes("Te recomendamos") || text.includes("Más noticias")) {
        const next = $(el).next();
        if (next.is("ul")) next.remove();
        $(el).remove();
      }
    });

    const paragraphs: string[] = [];
    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 15 && !text.startsWith("Información extra:")) {
        paragraphs.push(text);
      }
    });

    return paragraphs.length >= 2 ? paragraphs.join("\n\n") : null;
  } catch (error) {
    console.warn(`  El Comercio API error for ${url}:`, (error as Error).message);
    return null;
  }
}

/**
 * Fetch full content from a single URL
 */
export async function fetchArticleFullContent(
  url: string
): Promise<string | null> {
  try {
    // El Comercio: use WordPress API (JS-rendered site)
    if (url.includes("elcomercio.com")) {
      return await fetchElComercioContent(url);
    }

    // Validar URL contra allowlist + resolver DNS (anti-SSRF)
    await assertAllowedUrl(url);

    const response = await fetchWithSizeLimit(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-EC,es;q=0.9,en;q=0.8",
      },
      timeoutMs: 15_000,
      maxBytes: 5 * 1024 * 1024,
    });

    if (!response.ok) {
      console.warn(`  HTTP ${response.status} for ${url}`);
      return null;
    }

    const html = response.text;

    // CDN challenge detection (< 5KB = likely challenge page)
    if (html.length < 5000) {
      console.warn(`  Possible CDN challenge for ${url} (${html.length} bytes)`);
      return null;
    }

    return extractArticleContent(html, url);
  } catch (error) {
    console.warn(`  Error fetching ${url}:`, (error as Error).message);
    return null;
  }
}

/**
 * Enrich all articles in a bulletin's classifiedNews with full content.
 * Reads classifiedNews from DB, fetches content, and saves back.
 */
export async function enrichBulletinFullContent(bulletinId: string): Promise<{
  enriched: number;
  failed: number;
  skipped: number;
  total: number;
}> {
  const bulletin = await getBulletinById(bulletinId);

  if (!bulletin?.classifiedNews) {
    return { enriched: 0, failed: 0, skipped: 0, total: 0 };
  }

  const classifiedNews = bulletin.classifiedNews as Record<
    string,
    ClassifiedArticle[]
  >;

  console.log(`📄 Fetching full content for bulletin ${bulletinId}`);

  let enrichedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  const updatedNews: Record<string, ClassifiedArticle[]> = {};

  for (const [category, articles] of Object.entries(classifiedNews)) {
    if (!Array.isArray(articles)) {
      updatedNews[category] = articles;
      continue;
    }

    const results = await Promise.all(
      articles.map(async (article) => {
        // Skip if already has fullContent
        if (article.fullContent && article.fullContent.length > 200) {
          skippedCount++;
          return article;
        }

        if (!article.url) {
          failedCount++;
          return article;
        }

        const fullContent = await fetchArticleFullContent(article.url);

        if (fullContent && fullContent.length > 100) {
          enrichedCount++;
          console.log(
            `  ✓ ${article.title.substring(0, 50)}... (${fullContent.length} chars)`
          );
          return { ...article, fullContent };
        } else {
          failedCount++;
          console.log(
            `  ✗ ${article.title.substring(0, 50)}... (no content extracted)`
          );
          return article;
        }
      })
    );

    updatedNews[category] = results;
  }

  // Save updated classifiedNews
  await updateBulletinClassification(
    bulletinId,
    updatedNews as unknown as Record<string, unknown>
  );

  const stats = {
    enriched: enrichedCount,
    failed: failedCount,
    skipped: skippedCount,
    total: enrichedCount + failedCount + skippedCount,
  };

  console.log(`✅ Full content fetch complete:`, stats);

  return stats;
}
