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
      timeout: 120000, // 2 minutes per article
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
export async function extractCategoryArticles(
  url: string,
  source: string
): Promise<ScrapedArticle[]> {
  try {
    console.log(`  🔍 Extracting articles from category page: ${url}`);

    const config = getCategoryExtractionConfig(source);
    const client = getCrawl4AIClient();

    // Build the request configuration with CSS extraction strategy
    const requestConfig: Crawl4AIRequestConfig = {
      url,
      formats: ['markdown', 'html'],
      onlyMainContent: false, // Category pages need full content including sidebars
      removeBase64Images: true,
      timeout: 120000, // 2 minutes
    };

    // Add virtual scrolling if needed (e.g., ECU911)
    if (needsVirtualScroll(source)) {
      requestConfig.virtualScroll = createVirtualScrollConfig();
    }

    // Add JS rendering wait time if needed
    if (needsJSRendering(source)) {
      requestConfig.waitTime = 3; // Wait 3 seconds for JS to load
    }

    // Note: Crawl4AI v0.5.1-d1 doesn't support extraction_strategy in REST API
    // So we get HTML and parse with Cheerio in parseCategoryResponse
    console.log(`  📋 Scraping HTML for Cheerio parsing with baseSelector: "${config.schema.baseSelector}"`);

    // Scrape the category page (just HTML)
    const response = await client.scrape(requestConfig);

    if (!response.success || !response.data) {
      console.error(`  ❌ Failed to scrape category page from ${url}`);
      return [];
    }

    // Parse with Cheerio (parseCategoryResponse handles fallback automatically)
    const articles = parseCategoryResponse(response, url, source);

    console.log(`  ✅ Total extracted: ${articles.length} articles from category page`);
    return articles;
  } catch (error) {
    console.error(`  ❌ Error extracting category articles from ${url}:`, error);
    return [];
  }
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
 * Create LLM-based extraction strategy for category pages
 */
function createCategoryLLMStrategy(instruction: string): ExtractionStrategy {
  const llmConfig: LLMExtractionConfig = {
    provider: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    apiToken: process.env.OPENROUTER_API_KEY,
    instruction,
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          excerpt: { type: 'string' },
          imageUrl: { type: 'string' },
          publishedDate: { type: 'string' },
        },
        required: ['title', 'url'],
      },
    },
  };

  return {
    type: 'llm',
    config: llmConfig,
  };
}

/**
 * Generate default LLM instruction for category page extraction
 */
function generateDefaultCategoryLLMInstruction(source: string): string {
  return `Extract all news articles from this ${source} category page. For each article card/item, extract:
- title: The article headline or title
- url: The link to the full article (must be a valid URL)
- excerpt: A brief summary or description (50-200 words)
- imageUrl: The featured/thumbnail image URL if available
- publishedDate: The publication date if shown

Return an array of article objects. Focus only on actual news articles, ignore:
- Navigation menus
- Advertisements
- Related content widgets
- Footer content
- Social media links

Minimum expected: 5 articles.`;
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
 * Parse HTML with Cheerio using CSS selectors (fallback when Crawl4AI doesn't extract)
 */
function parseHTMLWithCheerio(
  html: string,
  categoryUrl: string,
  source: string
): ScrapedArticle[] {
  const config = getCategoryExtractionConfig(source);
  const schema = config.schema;
  const $ = cheerio.load(html);
  const articles: ScrapedArticle[] = [];

  console.log(`  🔍 Parsing HTML with Cheerio...`);
  console.log(`     Base selector: "${schema.baseSelector}"`);

  // Find all article containers
  const containers = $(schema.baseSelector);
  console.log(`     Found ${containers.length} containers`);

  containers.each((index, element) => {
    const $el = $(element);
    const extracted: Record<string, unknown> = {};

    // Extract each field
    for (const field of schema.fields) {
      const fieldElement = $el.find(field.selector).first();

      if (field.type === 'text') {
        extracted[field.name] = fieldElement.text().trim();
      } else if (field.type === 'attribute' && field.attribute) {
        extracted[field.name] = fieldElement.attr(field.attribute)?.trim();
      } else if (field.type === 'html') {
        extracted[field.name] = fieldElement.html()?.trim();
      }
    }

    // Validate required fields
    const title = String(extracted.title || '').trim();
    let url = String(extracted.url || '').trim();

    if (!title || title.length < 10) {
      return; // Skip
    }

    // Normalize relative URLs
    if (url && !url.startsWith('http')) {
      try {
        const baseUrl = new URL(categoryUrl);
        url = new URL(url, baseUrl.origin).href;
      } catch (e) {
        console.log(`    ⏭️  Skipping item with invalid URL: "${url}"`);
        return;
      }
    }

    if (!url || !url.match(/^https?:\/\/.+/)) {
      return; // Skip
    }

    // Filter out non-article URLs
    if (isNonArticleUrl(url)) {
      return; // Skip
    }

    // Create article
    const excerpt = String(extracted.excerpt || extracted.content || '').trim().substring(0, 500);
    const imageUrl = extracted.imageUrl ? String(extracted.imageUrl).trim() : undefined;
    const publishedDate = extracted.publishedDate ? String(extracted.publishedDate).trim() : undefined;

    const article: ScrapedArticle = {
      id: randomUUID(),
      title,
      content: excerpt || title,
      url,
      imageUrl: imageUrl && imageUrl.match(/^https?:\/\//) ? imageUrl : undefined,
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
 * Parse category page response into array of ScrapedArticle
 */
function parseCategoryResponse(
  response: Crawl4AIResponse,
  categoryUrl: string,
  source: string
): ScrapedArticle[] {
  const data = response.data;

  // If no extracted data, try parsing HTML with Cheerio
  if (!data || !data.extracted) {
    console.warn(`  ⚠️  No extracted data, falling back to Cheerio parsing`);
    if (data?.html) {
      return parseHTMLWithCheerio(data.html, categoryUrl, source);
    }
    return [];
  }

  const articles: ScrapedArticle[] = [];
  const extracted = data.extracted;

  // Handle both array responses and object responses
  const items = Array.isArray(extracted) ? extracted : [extracted];

  for (const item of items) {
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
    const imageUrl = rawItem.imageUrl ? String(rawItem.imageUrl).trim() : undefined;
    const publishedDate = rawItem.publishedDate ? String(rawItem.publishedDate).trim() : undefined;

    // Create article object
    const article: ScrapedArticle = {
      id: randomUUID(),
      title,
      content: excerpt || title, // Use title as fallback if no excerpt
      url,
      imageUrl: imageUrl && imageUrl.match(/^https?:\/\//) ? imageUrl : undefined,
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
