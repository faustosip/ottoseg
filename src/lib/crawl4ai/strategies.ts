/**
 * Crawl4AI Extraction Strategies
 *
 * Specialized strategies for extracting article content from news sources
 */

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
