/**
 * Crawl4AI Extraction Strategies
 *
 * Specialized strategies for extracting article content from news sources
 */

import * as cheerio from 'cheerio';
import type {
  Crawl4AIRequestConfig,
  Crawl4AIResponse,
  ScrapedArticle,
  ExtractionStrategy,
  JsonCssExtractionConfig,
  LLMExtractionConfig,
  VirtualScrollConfig,
  CategoryExtractionConfig,
} from './types';
import {
  getExtractionConfig,
  getCategoryExtractionConfig,
  needsVirtualScroll,
  needsJSRendering,
  shouldUseLLM,
  defaultLLMInstruction,
} from './config';
import { getCrawl4AIClient } from './client';
import { randomUUID } from 'crypto';

// ============================================================================
// Article Extraction
// ============================================================================

/**
 * Extract a full article from a URL
 */
export async function extractArticle(
  url: string,
  source: string
): Promise<ScrapedArticle | null> {
  try {
    const config = getExtractionConfig(source);
    const client = getCrawl4AIClient();

    // Build the request configuration
    const requestConfig: Crawl4AIRequestConfig = {
      url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      removeBase64Images: true,
      timeout: 30000, // 30 seconds per article (reduced for speed)
    };

    // Add virtual scrolling if needed (e.g., ECU911)
    if (needsVirtualScroll(source)) {
      requestConfig.virtualScroll = createVirtualScrollConfig();
    }

    // Add JS rendering wait time if needed
    if (needsJSRendering(source)) {
      requestConfig.waitTime = 3; // Wait 3 seconds for JS to load
    }

    // Add extraction strategy
    if (shouldUseLLM(source)) {
      requestConfig.extractionStrategy = createLLMExtractionStrategy(config);
    } else {
      requestConfig.extractionStrategy = createCSSExtractionStrategy(config);
    }

    // Scrape the article
    const response = await client.scrape(requestConfig);

    if (!response.success || !response.data) {
      console.error(`Failed to scrape article from ${url}`);
      return null;
    }

    // Parse the response into a ScrapedArticle
    return parseArticleResponse(response, url, source);
  } catch (error) {
    console.error(`Error extracting article from ${url}:`, error);
    return null;
  }
}

/**
 * Check if URL is an image file
 */
function isImageUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
  return imageExtensions.test(url);
}

/**
 * Extract image URL from an element with multiple fallback strategies
 * Handles lazy loading attributes (data-src, srcset) and relative URLs
 */
function extractImageUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $element: cheerio.Cheerio<any>,
  selector: string,
  baseUrl: string
): string | undefined {
  let imageUrl: string | undefined;

  // Try to find the image element
  const $img = selector ? $element.find(selector).first() : $element;

  if ($img.length === 0) {
    console.log(`      - No element found with selector: "${selector}"`);
    return undefined;
  }

  console.log(`      - Found element with selector: "${selector}"`);


  // Strategy 1: Try srcset attribute (common in responsive images)
  const srcset = $img.attr('srcset');
  if (srcset) {
    // Extract the first URL from srcset (format: "url 1x, url 2x")
    const srcsetMatch = srcset.match(/([^\s,]+)/);
    if (srcsetMatch) {
      imageUrl = srcsetMatch[1];
      console.log(`      - Strategy 1 (srcset): Found "${imageUrl.substring(0, 50)}..."`);
    }
  }

  // Strategy 2: Try data-src (lazy loading)
  if (!imageUrl) {
    const dataSrc = $img.attr('data-src');
    if (dataSrc) {
      imageUrl = dataSrc;
      console.log(`      - Strategy 2 (data-src): Found "${imageUrl.substring(0, 50)}..."`);
    }
  }

  // Strategy 3: Try data-lazy-src (another lazy loading variant)
  if (!imageUrl) {
    const dataLazySrc = $img.attr('data-lazy-src');
    if (dataLazySrc) {
      imageUrl = dataLazySrc;
      console.log(`      - Strategy 3 (data-lazy-src): Found "${imageUrl.substring(0, 50)}..."`);
    }
  }

  // Strategy 4: Try standard src attribute
  if (!imageUrl) {
    const src = $img.attr('src');
    if (src) {
      imageUrl = src;
      console.log(`      - Strategy 4 (src): Found "${imageUrl.substring(0, 50)}..."`);
    }
  }

  // Strategy 5: Try source elements inside picture tag
  if (!imageUrl) {
    const $picture = $element.find('picture').first();
    if ($picture.length > 0) {
      const $source = $picture.find('source').first();
      const sourceSrcset = $source.attr('srcset');
      if (sourceSrcset) {
        const srcsetMatch = sourceSrcset.match(/([^\s,]+)/);
        if (srcsetMatch) {
          imageUrl = srcsetMatch[1];
          console.log(`      - Strategy 5 (picture > source): Found "${imageUrl.substring(0, 50)}..."`);
        }
      }
    }
  }

  if (!imageUrl) {
    console.log(`      - No image URL found with any strategy`);
    return undefined;
  }

  imageUrl = imageUrl.trim();

  // Normalize relative URLs to absolute
  if (imageUrl && !imageUrl.match(/^https?:\/\//)) {
    try {
      const base = new URL(baseUrl);
      imageUrl = new URL(imageUrl, base.origin).href;
    } catch {
      console.log(`    ⚠️  Failed to normalize image URL: "${imageUrl}"`);
      return undefined;
    }
  }

  // Validate that it's a proper HTTP(S) URL
  if (!imageUrl || !imageUrl.match(/^https?:\/\/.+/)) {
    return undefined;
  }

  return imageUrl;
}

/**
 * Extract multiple articles in batch
 */
export async function extractArticles(
  urls: string[],
  source: string,
  maxConcurrency: number = 5
): Promise<ScrapedArticle[]> {
  const results: ScrapedArticle[] = [];

  // Filter out image URLs
  const validUrls = urls.filter(url => {
    if (isImageUrl(url)) {
      console.log(`  ⏭️  Skipping image URL: ${url.substring(0, 80)}...`);
      return false;
    }
    return true;
  });

  if (validUrls.length === 0) {
    console.log(`  ⚠️  No valid article URLs to process (all were images)`);
    return [];
  }

  console.log(`  📰 Processing ${validUrls.length}/${urls.length} valid URLs (filtered ${urls.length - validUrls.length} images)`);

  // Process in batches
  for (let i = 0; i < validUrls.length; i += maxConcurrency) {
    const batch = validUrls.slice(i, i + maxConcurrency);

    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          return await extractArticle(url, source);
        } catch (error) {
          console.error(`Error in batch extraction for ${url}:`, error);
          return null;
        }
      })
    );

    // Filter out failed extractions
    const successfulResults = batchResults.filter(
      (article): article is ScrapedArticle => article !== null
    );

    results.push(...successfulResults);
  }

  return results;
}

/**
 * Extract multiple articles from a category/listing page
 * Uses CSS selectors first, falls back to LLM if needed
 */
/**
 * Extract articles from El Comercio using WordPress REST API
 * El Comercio is JS-rendered so normal scraping doesn't work, but it exposes a WP REST API
 */
async function extractElComercioViaAPI(url: string): Promise<ScrapedArticle[]> {
  try {
    // Map URL path to WP category slug
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const slug = pathSegments[pathSegments.length - 1] || pathSegments[0] || '';

    console.log(`  📡 El Comercio: Using WordPress REST API (category: ${slug})`);

    // Get category ID from slug
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let apiUrl = `https://www.elcomercio.com/wp-json/wp/v2/posts?per_page=5&_embed&_fields=title,link,excerpt,date,_links,_embedded`;

    // Try to get category ID to filter posts
    if (slug && slug !== 'ultima-hora') {
      try {
        const catResponse = await fetch(
          `https://www.elcomercio.com/wp-json/wp/v2/categories?slug=${slug}&_fields=id`,
          { signal: controller.signal }
        );
        if (catResponse.ok) {
          const cats = await catResponse.json() as Array<{ id: number }>;
          if (cats.length > 0) {
            apiUrl += `&categories=${cats[0].id}`;
          }
        }
      } catch {
        // If category lookup fails, just get latest posts
      }
    }

    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`  ❌ El Comercio API failed: HTTP ${response.status}`);
      return [];
    }

    const posts = await response.json() as Array<Record<string, unknown>>;
    const articles: ScrapedArticle[] = [];

    for (const post of posts) {
      if (articles.length >= 3) break;

      const titleObj = post.title as { rendered?: string } | undefined;
      const title = (titleObj?.rendered || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&#8220;|&#8221;/g, '"')
        .replace(/&#8216;|&#8217;/g, "'")
        .replace(/&#038;/g, '&')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .trim();
      const link = post.link as string || '';
      const date = post.date as string || '';
      const excerptObj = post.excerpt as { rendered?: string } | undefined;
      const excerpt = (excerptObj?.rendered || '').replace(/<[^>]+>/g, '').trim();

      // Get featured image from _embedded
      const embedded = post._embedded as Record<string, unknown[]> | undefined;
      const featuredMedia = embedded?.['wp:featuredmedia'] as Array<Record<string, unknown>> | undefined;
      let imageUrl: string | undefined;

      if (featuredMedia && featuredMedia.length > 0) {
        const media = featuredMedia[0];
        imageUrl = media.source_url as string;
        if (!imageUrl) {
          const sizes = (media.media_details as Record<string, unknown> | undefined)?.sizes as Record<string, { source_url?: string }> | undefined;
          imageUrl = sizes?.medium_large?.source_url || sizes?.large?.source_url || sizes?.full?.source_url;
        }
      }

      if (!title || title.length < 10 || !link) continue;

      articles.push({
        id: randomUUID(),
        title,
        content: excerpt || title,
        url: link,
        imageUrl,
        source: 'El Comercio',
        publishedDate: date,
        selected: true,
        scrapedAt: new Date().toISOString(),
      });
    }

    console.log(`  ✅ El Comercio API: ${articles.length} articles extracted`);
    return articles;
  } catch (error) {
    console.error(`  ❌ El Comercio API error: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Extract articles from ECU911 using WordPress REST API
 * ECU911 is a WordPress site - the configured URL (/consulta-de-vias/) is not a news page,
 * so we use the REST API to get the latest news posts directly.
 */
async function extractEcu911ViaAPI(): Promise<ScrapedArticle[]> {
  try {
    console.log(`  📡 ECU911: Using WordPress REST API`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Fetch latest 15 posts to find at least 3 with images
    const apiUrl = `https://www.ecu911.gob.ec/wp-json/wp/v2/posts?per_page=15&_embed&_fields=title,link,excerpt,date,_links,_embedded`;

    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`  ❌ ECU911 API failed: HTTP ${response.status}`);
      return [];
    }

    const posts = await response.json() as Array<Record<string, unknown>>;
    const articles: ScrapedArticle[] = [];

    for (const post of posts) {
      if (articles.length >= 3) break;

      const titleObj = post.title as { rendered?: string } | undefined;
      const title = (titleObj?.rendered || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&#8220;|&#8221;/g, '"')
        .replace(/&#8216;|&#8217;/g, "'")
        .replace(/&#038;/g, '&')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .trim();
      const link = post.link as string || '';
      const date = post.date as string || '';
      const excerptObj = post.excerpt as { rendered?: string } | undefined;
      const excerpt = (excerptObj?.rendered || '').replace(/<[^>]+>/g, '').trim();

      // Get featured image from _embedded
      const embedded = post._embedded as Record<string, unknown[]> | undefined;
      const featuredMedia = embedded?.['wp:featuredmedia'] as Array<Record<string, unknown>> | undefined;
      let imageUrl: string | undefined;

      if (featuredMedia && featuredMedia.length > 0) {
        const media = featuredMedia[0];
        imageUrl = media.source_url as string;
        if (!imageUrl) {
          const sizes = (media.media_details as Record<string, unknown> | undefined)?.sizes as Record<string, { source_url?: string }> | undefined;
          imageUrl = sizes?.medium_large?.source_url || sizes?.large?.source_url || sizes?.full?.source_url;
        }
      }

      if (!title || title.length < 10 || !link) continue;

      // Skip posts without images (we have enough posts to be selective)
      if (!imageUrl) continue;

      articles.push({
        id: randomUUID(),
        title,
        content: excerpt || title,
        url: link,
        imageUrl,
        source: 'ECU911',
        publishedDate: date,
        selected: true,
        scrapedAt: new Date().toISOString(),
      });
    }

    console.log(`  ✅ ECU911 API: ${articles.length} articles extracted`);
    return articles;
  } catch (error) {
    console.error(`  ❌ ECU911 API error: ${(error as Error).message}`);
    return [];
  }
}

/**
 * La Hora: Multi-strategy article extraction
 * Section pages are blocked by AWS WAF from datacenter IPs (returns 202 challenge).
 * Strategies:
 *   1. Direct fetch section page with ?amp=1 bypass
 *   2. Scrape homepage and filter articles by section URL path
 *   3. Google News RSS as last resort
 */
async function extractLaHoraArticles(sectionUrl: string): Promise<ScrapedArticle[]> {
  // Extract section slug: /seccion/seguridad → seguridad
  const urlObj = new URL(sectionUrl);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  const sectionSlug = pathParts[pathParts.length - 1] || '';
  console.log(`  📡 La Hora: Extracting articles for section "${sectionSlug}"`);

  const config = getCategoryExtractionConfig('La Hora');

  // Strategy 1: Direct fetch with ?amp=1
  const ampUrl = sectionUrl + (sectionUrl.includes('?') ? '&' : '?') + 'amp=1';
  try {
    console.log(`  📋 Strategy 1: Direct fetch with ?amp=1 → ${ampUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(ampUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      if (html.length > 5000) {
        const $ = cheerio.load(html);
        const matches = $(config.schema.baseSelector).length;
        console.log(`  ✅ Strategy 1: ${html.length} chars, ${matches} selector matches`);

        if (matches > 0) {
          const articles = parseHTMLWithCheerioAndConfig(html, sectionUrl, 'La Hora', config);
          if (articles.length > 0) {
            console.log(`  ✅ La Hora Strategy 1 success: ${articles.length} articles`);
            return articles;
          }
        }
      } else {
        console.warn(`  ⚠️  Strategy 1: Small HTML (${html.length} chars) - likely WAF challenge`);
      }
    } else {
      console.warn(`  ⚠️  Strategy 1: HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn(`  ⚠️  Strategy 1 failed: ${(error as Error).message}`);
  }

  // Strategy 2: Scrape homepage and filter by section
  try {
    console.log(`  📋 Strategy 2: Homepage scraping (filter: /${sectionSlug}/)`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('https://www.lahora.com.ec/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com/',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      if (html.length > 10000) {
        console.log(`  ✅ Strategy 2: Homepage HTML ${html.length} chars`);

        const $ = cheerio.load(html);
        const articles: ScrapedArticle[] = [];
        const seenUrls = new Set<string>();

        // Find article links matching the section in their URL path
        // La Hora article URLs: /{section}/slug-YYYYMMDD-NNNN.html
        $('a[href]').each((_, el) => {
          if (articles.length >= 3) return false;

          const $a = $(el);
          let href = $a.attr('href') || '';

          if (!href || href === '#' || href.startsWith('javascript:')) return;

          // Normalize to absolute URL
          if (!href.startsWith('http')) {
            href = `https://www.lahora.com.ec${href.startsWith('/') ? '' : '/'}${href}`;
          }

          // Check if URL belongs to the target section
          try {
            const articleUrl = new URL(href);
            // Must match /{sectionSlug}/something.html (article page, not section index)
            if (!articleUrl.pathname.startsWith(`/${sectionSlug}/`) || !articleUrl.pathname.endsWith('.html')) return;
          } catch {
            return;
          }

          if (seenUrls.has(href)) return;
          seenUrls.add(href);

          // Extract title from link text or parent heading
          let title = $a.text().trim();
          if (!title || title.length < 10) {
            const $heading = $a.closest('h1, h2, h3, h4, h5');
            if ($heading.length) title = $heading.text().trim();
          }
          if (!title || title.length < 10) return;

          // Find image in parent container
          let imageUrl: string | undefined;
          // Walk up to find a container that has both the link and an image
          const $container = $a.closest('[class*="Item"], article, div').filter((_, container) => {
            return $(container).find('img').length > 0;
          }).first();

          if ($container.length) {
            imageUrl = extractImageUrl($container, 'img', 'https://www.lahora.com.ec');
          }

          articles.push({
            id: randomUUID(),
            title,
            content: title,
            url: href,
            imageUrl,
            source: 'La Hora',
            selected: true,
            scrapedAt: new Date().toISOString(),
          });
        });

        if (articles.length > 0) {
          console.log(`  ✅ La Hora Strategy 2 success: ${articles.length} articles from homepage`);
          return articles;
        }
        console.warn(`  ⚠️  Strategy 2: No articles found for section "${sectionSlug}" on homepage`);
      } else {
        console.warn(`  ⚠️  Strategy 2: Small HTML (${html.length} chars) - blocked`);
      }
    } else {
      console.warn(`  ⚠️  Strategy 2: HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn(`  ⚠️  Strategy 2 failed: ${(error as Error).message}`);
  }

  // Strategy 3: Google News RSS
  try {
    console.log(`  📋 Strategy 3: Google News RSS (site:lahora.com.ec/${sectionSlug})`);
    const query = `site:lahora.com.ec/${sectionSlug} when:3d`;
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-419&gl=EC&ceid=EC:es-419`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const rssXml = await response.text();
      const $ = cheerio.load(rssXml, { xmlMode: true });
      const articles: ScrapedArticle[] = [];

      $('item').each((_, item) => {
        if (articles.length >= 3) return false;

        const title = $(item).find('title').text().trim();
        const pubDate = $(item).find('pubDate').text().trim();

        if (!title || title.length < 10) return;

        // Google News RSS link element contains the URL as text content
        const link = $(item).find('link').text().trim();

        articles.push({
          id: randomUUID(),
          title,
          content: title,
          url: link || sectionUrl, // Fallback to section URL if link parsing fails
          source: 'La Hora',
          publishedDate: pubDate,
          selected: true,
          scrapedAt: new Date().toISOString(),
        });
      });

      // Try to resolve Google News redirect URLs to actual article URLs
      for (const article of articles) {
        if (article.url.includes('news.google.com')) {
          try {
            const resolved = await resolveRedirectUrl(article.url);
            if (resolved && resolved.includes('lahora.com.ec')) {
              article.url = resolved;
            }
          } catch {
            // Keep original URL
          }
        }
      }

      if (articles.length > 0) {
        console.log(`  ✅ La Hora Strategy 3 success: ${articles.length} articles from Google News`);
        return articles;
      }
    }
  } catch (error) {
    console.warn(`  ⚠️  Strategy 3 failed: ${(error as Error).message}`);
  }

  console.error(`  ❌ La Hora: All strategies failed for section "${sectionSlug}"`);
  return [];
}

/**
 * Resolve a redirect URL by following the HTTP redirect chain
 */
async function resolveRedirectUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    clearTimeout(timeoutId);

    const location = response.headers.get('location');
    if (location) {
      // Follow one more redirect if needed
      if (location.includes('google.com')) {
        return resolveRedirectUrl(location);
      }
      return location;
    }
    return null;
  } catch {
    return null;
  }
}

export async function extractCategoryArticles(
  url: string,
  source: string,
  customSelector?: string
): Promise<ScrapedArticle[]> {
  console.log(`  🔍 Extracting articles from category page: ${url}`);

  const normalizedSource = source.toLowerCase().replace(/\s+/g, '');

  // La Hora special case: section pages are blocked by AWS WAF from datacenter IPs
  // Uses cascading fallback: section+amp → homepage scraping → Google News RSS
  if (normalizedSource === 'lahora') {
    return extractLaHoraArticles(url);
  }

  // El Comercio special case: use WordPress REST API (site is JS-rendered)
  if (normalizedSource === 'elcomercio') {
    return extractElComercioViaAPI(url);
  }

  // ECU911 special case: use WordPress REST API (configured URL is not a news page)
  if (normalizedSource === 'ecu911') {
    return extractEcu911ViaAPI();
  }

  const config = getCategoryExtractionConfig(source);

  // Override baseSelector if custom selector is provided from database
  // Skip generic selectors like "article" that would override better site-specific ones
  const genericSelectors = ['article', 'div', '.post', '.article'];
  if (customSelector && customSelector.trim() !== '' && !genericSelectors.includes(customSelector.trim())) {
    console.log(`  📌 Using custom selector from database: "${customSelector}"`);
    config.schema.baseSelector = customSelector;
  } else if (customSelector && genericSelectors.includes(customSelector.trim())) {
    console.log(`  ⏭️  Ignoring generic DB selector "${customSelector}", using config-based: "${config.schema.baseSelector}"`);
  }

  // For sources that DON'T need JS rendering, prefer direct HTTP fetch (faster & more reliable).
  // Crawl4AI can strip CSS module classes from HTML, breaking selectors like div[class*="ItemCustomContent"].
  // For JS-rendered sources (e.g. El Comercio), use Crawl4AI with its browser.
  const useDirectFetchFirst = !needsJSRendering(source);
  let html: string | undefined;

  if (useDirectFetchFirst) {
    // Strategy: Direct HTTP fetch first, Crawl4AI as fallback
    try {
      console.log(`  📋 Direct HTTP fetch for ${url} (non-JS source)...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const fetchResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (fetchResponse.ok) {
        const fetchedHtml = await fetchResponse.text();
        // Detect CDN challenge pages: real news pages are > 10KB, challenge pages are ~2KB
        if (fetchedHtml.length < 5000) {
          console.warn(`  ⚠️  Direct fetch returned suspiciously small HTML (${fetchedHtml.length} chars) - likely CDN challenge page, skipping`);
        } else {
          html = fetchedHtml;
          console.log(`  ✅ Direct fetch returned HTML (${html.length} chars)`);
        }
      } else {
        console.error(`  ❌ Direct fetch failed: HTTP ${fetchResponse.status} for ${url}`);
        if (fetchResponse.status === 404) {
          console.error(`  ⚠️  URL devuelve 404 - verificar que la URL es correcta en Fuentes (dashboard/settings/sources)`);
        }
      }
    } catch (fetchError) {
      console.error(`  ❌ Direct fetch error: ${(fetchError as Error).message}`);
    }

    // Fallback to Crawl4AI if direct fetch failed or returned challenge page
    if (!html) {
      try {
        console.log(`  🔄 Fallback: Trying Crawl4AI for ${url}...`);
        const client = getCrawl4AIClient();
        const requestConfig: Crawl4AIRequestConfig = {
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: false,
          removeBase64Images: true,
          timeout: 30000,
        };
        if (needsVirtualScroll(source)) {
          requestConfig.virtualScroll = createVirtualScrollConfig();
        }
        const response = await client.scrape(requestConfig);
        if (response.success && response.data?.html) {
          html = response.data.html;
          console.log(`  ✅ Crawl4AI fallback returned HTML (${html.length} chars)`);
        }
      } catch (crawl4aiError) {
        console.warn(`  ⚠️  Crawl4AI fallback failed: ${(crawl4aiError as Error).message}`);
      }
    }
  } else {
    // Strategy: Crawl4AI first (JS rendering needed), direct fetch as fallback
    try {
      const client = getCrawl4AIClient();
      const requestConfig: Crawl4AIRequestConfig = {
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        removeBase64Images: true,
        timeout: 30000,
      };
      if (needsVirtualScroll(source)) {
        requestConfig.virtualScroll = createVirtualScrollConfig();
      }
      requestConfig.waitTime = 3;

      console.log(`  📋 Trying Crawl4AI for HTML (JS-rendered source)...`);
      const response = await client.scrape(requestConfig);

      if (response.success && response.data?.html) {
        html = response.data.html;
        console.log(`  ✅ Crawl4AI returned HTML (${html.length} chars)`);
      }
    } catch (crawl4aiError) {
      console.warn(`  ⚠️  Crawl4AI failed: ${(crawl4aiError as Error).message}`);
    }

    if (!html) {
      try {
        console.log(`  🔄 Fallback: Direct HTTP fetch for ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const fetchResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (fetchResponse.ok) {
          const fetchedHtml = await fetchResponse.text();
          if (fetchedHtml.length < 5000) {
            console.warn(`  ⚠️  Direct fetch returned CDN challenge page (${fetchedHtml.length} chars), cannot bypass without browser`);
          } else {
            html = fetchedHtml;
            console.log(`  ✅ Direct fetch returned HTML (${html.length} chars)`);
          }
        } else {
          console.error(`  ❌ Direct fetch failed: HTTP ${fetchResponse.status}`);
        }
      } catch (fetchError) {
        console.error(`  ❌ Direct fetch error: ${(fetchError as Error).message}`);
      }
    }
  }

  if (!html) {
    console.error(`  ❌ No HTML obtained for ${url} (all methods failed - source may require browser to bypass CDN protection)`);
    return [];
  }

  // Parse with Cheerio
  console.log(`  📋 Parsing HTML with Cheerio (baseSelector: "${config.schema.baseSelector}")`);
  const fakeResponse = {
    success: true,
    data: { html, markdown: undefined, text: undefined, extracted: undefined },
    metadata: { url, crawledAt: new Date().toISOString() },
  };

  const articles = parseCategoryResponseWithConfig(
    fakeResponse as unknown as Crawl4AIResponse,
    url,
    source,
    config,
  );

  console.log(`  ✅ Total extracted: ${articles.length} articles from category page`);
  return articles;
}

// ============================================================================
// Strategy Builders
// ============================================================================

/**
 * Create CSS-based extraction strategy
 */
function createCSSExtractionStrategy(
  config: ReturnType<typeof getExtractionConfig>
): ExtractionStrategy {
  const cssConfig: JsonCssExtractionConfig = {
    schema: {
      name: 'Article',
      baseSelector: 'article, main, .article, .post',
      fields: [
        {
          name: 'title',
          selector: config.titleSelector || 'h1',
          type: 'text',
        },
        {
          name: 'content',
          selector: config.contentSelector || 'article',
          type: 'text',
        },
      ],
    },
  };

  // Add optional fields if configured
  if (config.authorSelector) {
    cssConfig.schema.fields.push({
      name: 'author',
      selector: config.authorSelector,
      type: 'text',
    });
  }

  if (config.dateSelector) {
    cssConfig.schema.fields.push({
      name: 'publishedDate',
      selector: config.dateSelector,
      type: 'attribute',
      attribute: 'datetime',
    });
  }

  if (config.imageSelector) {
    cssConfig.schema.fields.push({
      name: 'imageUrl',
      selector: config.imageSelector,
      type: 'attribute',
      attribute: 'src',
    });
  }

  return {
    type: 'json_css',
    config: cssConfig,
  };
}

/**
 * Create LLM-based extraction strategy
 */
function createLLMExtractionStrategy(
  config: ReturnType<typeof getExtractionConfig>
): ExtractionStrategy {
  const llmConfig: LLMExtractionConfig = {
    provider: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
    apiToken: process.env.OPENROUTER_API_KEY,
    instruction: config.llmInstruction || defaultLLMInstruction,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        author: { type: 'string' },
        publishedDate: { type: 'string' },
        imageUrl: { type: 'string' },
      },
      required: ['title', 'content'],
    },
  };

  return {
    type: 'llm',
    config: llmConfig,
  };
}


/**
 * Create virtual scroll configuration
 */
function createVirtualScrollConfig(): VirtualScrollConfig {
  return {
    containerSelector: 'body',
    scrollCount: 5,
    scrollBy: 'viewport_height',
    waitAfterScroll: 1.0, // 1 second between scrolls
  };
}

// ============================================================================
// Response Parsing
// ============================================================================

/**
 * Parse HTML with Cheerio using a pre-configured schema (supports custom selectors from DB)
 */
function parseHTMLWithCheerioAndConfig(
  html: string,
  categoryUrl: string,
  source: string,
  config: CategoryExtractionConfig
): ScrapedArticle[] {
  const schema = config.schema;
  const $ = cheerio.load(html);
  const articles: ScrapedArticle[] = [];

  console.log(`  🔍 Parsing HTML with Cheerio...`);
  console.log(`     Base selector: "${schema.baseSelector}"`);

  // Find all article containers
  const containers = $(schema.baseSelector);
  console.log(`     Found ${containers.length} containers`);

  let validArticleIndex = 0;

  containers.each((index, element) => {
    // Limit to maximum 3 VALID articles per category page
    if (articles.length >= 3) {
      return false; // Stop iteration
    }

    const $el = $(element);
    const extracted: Record<string, unknown> = {};

    console.log(`    🔍 Examining container ${index + 1}/${containers.length}`);

    // Extract each field
    for (const field of schema.fields) {
      // Special handling for image fields to use advanced extraction
      if (field.name === 'imageUrl' && field.type === 'attribute') {
        const imageUrl = extractImageUrl($el, field.selector || '', categoryUrl);
        extracted[field.name] = imageUrl;
        continue;
      }

      // If selector is empty string, get attribute from the base element itself
      if (field.selector === '' && field.type === 'attribute' && field.attribute) {
        extracted[field.name] = $el.attr(field.attribute)?.trim();
      } else if (field.selector) {
        const fieldElement = $el.find(field.selector).first();

        if (field.type === 'text') {
          extracted[field.name] = fieldElement.text().trim();
        } else if (field.type === 'attribute' && field.attribute) {
          extracted[field.name] = fieldElement.attr(field.attribute)?.trim();
        } else if (field.type === 'html') {
          extracted[field.name] = fieldElement.html()?.trim();
        }
      }
    }

    // Validate required fields
    // Clean title: remove category prefixes like "Ecuador •", "Política •", etc.
    let title = String(extracted.title || '').trim().replace(/^[^•]+•\s*/, '');
    if (!title) title = String(extracted.title || '').trim(); // fallback to original
    let url = String(extracted.url || '').trim();
    const imageUrl = extracted.imageUrl ? String(extracted.imageUrl).trim() : undefined;

    // Skip if no title
    if (!title || title.length < 10) {
      console.log(`    ⏭️  Container ${index + 1}: Skipping - title too short (${title.length} chars)`);
      return; // Skip
    }

    // Normalize relative URLs
    if (url && !url.startsWith('http')) {
      try {
        const baseUrl = new URL(categoryUrl);
        url = new URL(url, baseUrl.origin).href;
      } catch {
        console.log(`    ⏭️  Container ${index + 1}: Skipping - invalid URL: "${url}"`);
        return;
      }
    }

    // Skip if no valid URL
    if (!url || !url.match(/^https?:\/\/.+/)) {
      console.log(`    ⏭️  Container ${index + 1}: Skipping - no valid URL`);
      return; // Skip
    }

    // Filter out non-article URLs
    if (isNonArticleUrl(url)) {
      console.log(`    ⏭️  Container ${index + 1}: Skipping - non-article URL: ${url}`);
      return; // Skip
    }

    // IMPORTANT: Skip if no image found
    // This ensures we only get articles with images
    if (!imageUrl) {
      console.log(`    ⏭️  Container ${index + 1}: Skipping - NO IMAGE FOUND`);
      console.log(`       Title: "${title.substring(0, 50)}..."`);
      console.log(`       URL: ${url}`);
      return; // Skip articles without images
    }

    // Create article (only if it has an image!)
    validArticleIndex++;
    const excerpt = String(extracted.excerpt || extracted.content || '').trim().substring(0, 500);
    const publishedDate = extracted.publishedDate ? String(extracted.publishedDate).trim() : undefined;

    console.log(`    ✅ Container ${index + 1} → Valid Article #${validArticleIndex}`);
    console.log(`       Title: "${title.substring(0, 50)}..."`);
    console.log(`       Image: ${imageUrl.substring(0, 60)}...`);

    const article: ScrapedArticle = {
      id: randomUUID(),
      title,
      content: excerpt || title,
      url,
      imageUrl, // Already validated and normalized by extractImageUrl
      source,
      publishedDate,
      selected: true,
      scrapedAt: new Date().toISOString(),
    };

    articles.push(article);
  });

  console.log(`  ✅ Cheerio extracted ${articles.length} articles`);
  return articles;
}

/**
 * Parse category page response with pre-configured schema (supports custom selectors from DB)
 */
function parseCategoryResponseWithConfig(
  response: Crawl4AIResponse,
  categoryUrl: string,
  source: string,
  config: CategoryExtractionConfig
): ScrapedArticle[] {
  const data = response.data;

  // If no extracted data, try parsing HTML with Cheerio
  if (!data || !data.extracted) {
    console.warn(`  ⚠️  No extracted data, falling back to Cheerio parsing`);
    if (data?.html) {
      return parseHTMLWithCheerioAndConfig(data.html, categoryUrl, source, config);
    }
    return [];
  }

  const articles: ScrapedArticle[] = [];
  const extracted = data.extracted;

  // Handle both array responses and object responses
  const items = Array.isArray(extracted) ? extracted : [extracted];

  for (const item of items) {
    // Limit to maximum 3 articles per category page
    if (articles.length >= 3) {
      break;
    }

    if (typeof item !== 'object' || item === null) continue;

    const rawItem = item as Record<string, unknown>;

    // Extract and validate required fields
    const title = String(rawItem.title || '').trim();
    const url = String(rawItem.url || '').trim();

    // Skip invalid items
    if (!title || title.length < 15) {
      console.log(`    ⏭️  Skipping item with invalid title: "${title}"`);
      continue;
    }

    if (!url || !url.match(/^https?:\/\/.+/)) {
      console.log(`    ⏭️  Skipping item with invalid URL: "${url}"`);
      continue;
    }

    // Filter out non-article URLs
    if (isNonArticleUrl(url)) {
      console.log(`    ⏭️  Skipping non-article URL: ${url}`);
      continue;
    }

    // Extract optional fields
    const excerpt = String(rawItem.excerpt || rawItem.content || '').trim().substring(0, 500);
    let imageUrl = rawItem.imageUrl ? String(rawItem.imageUrl).trim() : undefined;
    const publishedDate = rawItem.publishedDate ? String(rawItem.publishedDate).trim() : undefined;

    // Normalize image URL if it's relative
    if (imageUrl && !imageUrl.match(/^https?:\/\//)) {
      try {
        const base = new URL(categoryUrl);
        imageUrl = new URL(imageUrl, base.origin).href;
      } catch {
        console.log(`    ⚠️  Failed to normalize image URL from extracted data: "${imageUrl}"`);
        imageUrl = undefined;
      }
    }

    // Create article object
    const article: ScrapedArticle = {
      id: randomUUID(),
      title,
      content: excerpt || title, // Use title as fallback if no excerpt
      url,
      imageUrl, // Already normalized
      source,
      publishedDate,
      selected: true,
      scrapedAt: new Date().toISOString(),
    };

    articles.push(article);
  }

  console.log(`  📋 Parsed ${articles.length}/${items.length} valid articles from category page`);
  return articles;
}

/**
 * Check if URL is likely not an article (navigation, category, etc.)
 */
function isNonArticleUrl(url: string): boolean {
  const nonArticlePatterns = [
    /\/(categoria|category|seccion|section|tag|tags)\//i,
    /\/(login|registro|suscripcion|newsletter|contacto)/i,
    /\/(#|javascript:|mailto:)/i,
    /\.(pdf|doc|docx|zip|rar)$/i,
  ];

  return nonArticlePatterns.some(pattern => pattern.test(url));
}

/**
 * Parse Crawl4AI response into ScrapedArticle
 */
function parseArticleResponse(
  response: Crawl4AIResponse,
  url: string,
  source: string
): ScrapedArticle | null {
  const data = response.data;
  if (!data) return null;

  // Try to get data from structured extraction first
  let title = '';
  let content = '';
  let author: string | undefined;
  let publishedDate: string | undefined;
  let imageUrl: string | undefined;

  if (data.extracted && typeof data.extracted === 'object') {
    const extracted = data.extracted as Record<string, unknown>;
    title = (extracted.title as string) || '';
    content = (extracted.content as string) || '';
    author = extracted.author as string | undefined;
    publishedDate = extracted.publishedDate as string | undefined;
    imageUrl = extracted.imageUrl as string | undefined;
  }

  // Fallback to markdown/HTML if extraction failed
  if (!title || !content) {
    title = data.title || extractTitleFromMarkdown(data.markdown || '');
    content = data.markdown || data.text || '';
  }

  // Try to get image from response
  if (!imageUrl && data.images && data.images.length > 0) {
    imageUrl = data.images[0];
  }

  // Validate we have minimum required data
  if (!title || title.length < 10) {
    console.warn(`Article from ${url} has invalid title`);
    return null;
  }

  if (!content || content.length < 100) {
    console.warn(`Article from ${url} has insufficient content`);
    return null;
  }

  // Calculate metadata
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

  return {
    id: randomUUID(),
    title: title.trim(),
    content: truncateContent(content, 500), // Keep first 500 chars for excerpt
    fullContent: content.trim(),
    url,
    imageUrl,
    author,
    publishedDate,
    source,
    selected: false,
    scrapedAt: new Date().toISOString(),
    metadata: {
      wordCount,
      readingTime,
      contentQuality: calculateContentQuality(content),
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract title from markdown content
 */
function extractTitleFromMarkdown(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

/**
 * Truncate content to a specific length
 */
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;

  const truncated = content.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Calculate a simple content quality score (0-100)
 */
function calculateContentQuality(content: string): number {
  let score = 50; // Base score

  const wordCount = content.split(/\s+/).length;

  // Penalize very short content
  if (wordCount < 100) score -= 30;
  else if (wordCount < 200) score -= 10;

  // Reward longer content
  if (wordCount > 500) score += 20;
  else if (wordCount > 300) score += 10;

  // Penalize content with too many special characters (likely parsing issues)
  const specialCharRatio = (content.match(/[^a-zA-Z0-9\s.,;:!?'"()-]/g) || []).length / content.length;
  if (specialCharRatio > 0.1) score -= 20;

  // Reward content with proper sentence structure
  const sentenceCount = content.split(/[.!?]+/).length;
  if (sentenceCount > 3 && wordCount / sentenceCount > 10 && wordCount / sentenceCount < 50) {
    score += 10; // Good sentence length distribution
  }

  return Math.max(0, Math.min(100, score));
}
