/**
 * Crawl4AI Configuration
 *
 * Site-specific configurations for scraping Ecuadorian news sources
 */

import type { Crawl4AIArticleExtractionConfig } from './types';

// ============================================================================
// Environment Configuration
// ============================================================================

export const crawl4aiConfig = {
  apiUrl: process.env.CRAWL4AI_API_URL || 'http://crawl4ai_api:11235',
  timeout: parseInt(process.env.CRAWL4AI_TIMEOUT || '300000', 10), // 5 minutes
  maxRetries: 2,
  retryDelay: 3000, // 3 seconds
  maxConcurrency: 5,
} as const;

// ============================================================================
// Site-Specific Extraction Configurations
// ============================================================================

/**
 * Extraction configurations for each news source
 * These are optimized based on each site's structure
 */
export const siteExtractionConfigs: Record<string, Crawl4AIArticleExtractionConfig> = {
  // Primicias - Modern news site
  primicias: {
    titleSelector: 'h1.entry-title, h1.post-title, article h1',
    contentSelector: 'div.entry-content, article.post-content, div.article-body',
    authorSelector: 'span.author-name, a.author, .by-author',
    dateSelector: 'time, .published-date, .entry-date',
    imageSelector: 'article img.wp-post-image, .featured-image img, article img:first-of-type',
    useLLM: false, // Simple structure, CSS is enough
  },

  // La Hora - Traditional news site
  laHora: {
    titleSelector: 'h1, .article-title, .post-title',
    contentSelector: '.article-content, .post-content, .entry-content',
    authorSelector: '.author, .byline, .writer-name',
    dateSelector: 'time, .date, .published',
    imageSelector: '.article-image img, .featured-image img',
    useLLM: false,
  },

  // El Comercio - Complex layout
  elComercio: {
    titleSelector: 'h1.headline, h1[itemprop="headline"], h1.article-title',
    contentSelector: 'div[itemprop="articleBody"], .article-body, .story-content',
    authorSelector: 'span[itemprop="author"], .author-name, .byline',
    dateSelector: 'time[itemprop="datePublished"], .publish-date',
    imageSelector: 'figure.main-media img, img[itemprop="image"]',
    useLLM: false,
  },

  // Teleamazonas - Video-heavy site, may need LLM
  teleamazonas: {
    titleSelector: 'h1, .article-title',
    contentSelector: '.article-content, .story-body',
    authorSelector: '.author, .writer',
    dateSelector: 'time, .date',
    imageSelector: '.article-image img, .main-image img',
    useLLM: true, // Complex structure with videos
    llmInstruction: `Extract the following information from this news article:
- title: The main headline
- content: The full article text (exclude ads, related articles, comments)
- author: Author name if available
- publishedDate: Publication date
- imageUrl: Main article image URL

Return as JSON with these exact field names.`,
  },

  // ECU911 - Dynamic content site
  ecu911: {
    titleSelector: 'h1, .title',
    contentSelector: '.content, .article-body',
    authorSelector: '.author',
    dateSelector: '.date, time',
    imageSelector: 'img.main-image, .featured-image img',
    useLLM: false,
  },
};

// ============================================================================
// Default Extraction Configuration
// ============================================================================

export const defaultExtractionConfig: Crawl4AIArticleExtractionConfig = {
  titleSelector: 'h1, .title, .headline, article h1',
  contentSelector: 'article, .article-content, .post-content, .entry-content, main',
  authorSelector: '.author, .byline, .writer, [rel="author"]',
  dateSelector: 'time, .date, .published, .post-date',
  imageSelector: 'article img:first-of-type, .featured-image img, .main-image img',
  useLLM: false,
};

// ============================================================================
// LLM Extraction Configuration
// ============================================================================

export const defaultLLMInstruction = `You are a news article extraction assistant. Extract the following information from this web page:

1. title: The main article headline
2. content: The complete article text (remove ads, navigation, related articles, comments, and other non-article content)
3. author: The article author's name (if available)
4. publishedDate: The publication date in ISO format (if available)
5. imageUrl: The URL of the main article image (if available)

Return the data as a JSON object with these exact field names. If a field is not available, omit it or set it to null.

Focus on extracting only the main article content, not sidebars, headers, footers, or related content.`;

// ============================================================================
// Site-Specific Special Configurations
// ============================================================================

/**
 * Sites that need virtual scrolling (infinite scroll, lazy loading)
 */
export const virtualScrollSites = new Set(['ecu911']);

/**
 * Sites that require JavaScript rendering
 */
export const jsRenderingSites = new Set(['ecu911', 'teleamazonas']);

/**
 * Sites that work better with LLM extraction
 */
export const llmExtractionSites = new Set(['teleamazonas']);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get extraction config for a specific source
 */
export function getExtractionConfig(source: string): Crawl4AIArticleExtractionConfig {
  const normalizedSource = source.toLowerCase().replace(/\s+/g, '');
  return siteExtractionConfigs[normalizedSource] || defaultExtractionConfig;
}

/**
 * Check if a source needs virtual scrolling
 */
export function needsVirtualScroll(source: string): boolean {
  const normalizedSource = source.toLowerCase().replace(/\s+/g, '');
  return virtualScrollSites.has(normalizedSource);
}

/**
 * Check if a source needs JavaScript rendering
 */
export function needsJSRendering(source: string): boolean {
  const normalizedSource = source.toLowerCase().replace(/\s+/g, '');
  return jsRenderingSites.has(normalizedSource);
}

/**
 * Check if a source should use LLM extraction
 */
export function shouldUseLLM(source: string): boolean {
  const normalizedSource = source.toLowerCase().replace(/\s+/g, '');
  const config = getExtractionConfig(source);
  return config.useLLM || llmExtractionSites.has(normalizedSource);
}
