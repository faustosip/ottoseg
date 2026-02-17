/**
 * Crawl4AI Configuration
 *
 * Site-specific configurations for scraping Ecuadorian news sources
 */

import type { Crawl4AIArticleExtractionConfig, CategoryExtractionConfig } from './types';

// ============================================================================
// Environment Configuration
// ============================================================================

export const crawl4aiConfig = {
  apiUrl: process.env.CRAWL4AI_API_URL || 'http://crawl4ai_api:11235',
  timeout: parseInt(process.env.CRAWL4AI_TIMEOUT || '30000', 10), // 30 seconds default (reduced from 60s)
  maxRetries: 0, // Sin reintentos para evitar timeouts largos (antes era 1)
  retryDelay: 1000, // 1 second
  maxConcurrency: 5,
} as const;

// ============================================================================
// Site-Specific Extraction Configurations
// ============================================================================

/**
 * Extraction configurations for each news source
 * These are optimized based on each site's structure
 */
// Mapping from normalized source names to config keys
// normalizeSource("La Hora") → "lahora", normalizeSource("El Comercio") → "elcomercio"
const sourceNameMapping: Record<string, string> = {
  lahora: 'lahora',
  elcomercio: 'elcomercio',
  primicias: 'primicias',
  teleamazonas: 'teleamazonas',
  ecu911: 'ecu911',
};

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
  lahora: {
    titleSelector: 'h1, .article-title, .post-title',
    contentSelector: '.article-content, .post-content, .entry-content',
    authorSelector: '.author, .byline, .writer-name',
    dateSelector: 'time, .date, .published',
    imageSelector: '.article-image img, .featured-image img',
    useLLM: false,
  },

  // El Comercio - Complex layout
  elcomercio: {
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
// Category Page Extraction Configurations
// ============================================================================

/**
 * Extraction configurations for category/listing pages
 * These extract multiple article cards from category pages
 */
export const categoryExtractionConfigs: Record<string, CategoryExtractionConfig> = {
  // Primicias - Category pages (política, economía, seguridad)
  primicias: {
    schema: {
      name: 'Primicias Articles Listing',
      baseSelector: 'article.c-article',
      fields: [
        {
          name: 'title',
          selector: 'h2.c-article__title a, h2 a, h3 a',
          type: 'text',
        },
        {
          name: 'url',
          selector: 'h2.c-article__title a, h2 a, h3 a, figure a',
          type: 'attribute',
          attribute: 'href',
        },
        {
          name: 'excerpt',
          selector: 'p.c-article__excerpt, p',
          type: 'text',
        },
        {
          name: 'imageUrl',
          selector: 'picture img, img',
          type: 'attribute',
          attribute: 'src',
        },
        {
          name: 'publishedDate',
          selector: 'time, .c-article__date',
          type: 'attribute',
          attribute: 'datetime',
        },
      ],
    },
    useLLMFallback: true,
    llmInstruction: `Extract all news articles from this Primicias category page. For each article card, extract:
- title: The article headline/title
- url: The link to the full article
- excerpt: A brief summary or first paragraph (50-200 words)
- imageUrl: The featured image URL if available
- publishedDate: The publication date if shown

Return an array of article objects. Ignore navigation, ads, and other non-article content.`,
    minArticles: 5,
  },

  // La Hora - Category pages
  lahora: {
    schema: {
      name: 'La Hora Articles Listing',
      baseSelector: 'div[class*="ItemCustomContent"]',
      fields: [
        {
          name: 'title',
          selector: 'h2 a',
          type: 'text',
        },
        {
          name: 'url',
          selector: 'h2 a',
          type: 'attribute',
          attribute: 'href',
        },
        {
          name: 'excerpt',
          selector: 'p',
          type: 'text',
        },
        {
          name: 'imageUrl',
          selector: 'picture img, img',
          type: 'attribute',
          attribute: 'src',
        },
        {
          name: 'publishedDate',
          selector: 'time',
          type: 'text',
        },
      ],
    },
    useLLMFallback: true,
    minArticles: 5,
  },

  // El Comercio - Category pages (JS-rendered, needs Crawl4AI browser)
  elcomercio: {
    schema: {
      name: 'El Comercio Articles Listing',
      baseSelector: 'a.feed__item',
      fields: [
        {
          name: 'title',
          selector: '.feed__title',
          type: 'text',
        },
        {
          name: 'url',
          selector: '',
          type: 'attribute',
          attribute: 'href',
        },
        {
          name: 'excerpt',
          selector: '.feed__excerpt',
          type: 'text',
        },
        {
          name: 'imageUrl',
          selector: 'x-img img, picture img, img',
          type: 'attribute',
          attribute: 'src',
        },
        {
          name: 'publishedDate',
          selector: '.feed__time',
          type: 'text',
        },
      ],
    },
    useLLMFallback: true,
    minArticles: 5,
  },

  // Teleamazonas - Category pages (uses same CMS as Primicias: c-article structure)
  teleamazonas: {
    schema: {
      name: 'Teleamazonas Articles Listing',
      baseSelector: 'article.c-article',
      fields: [
        {
          name: 'title',
          selector: 'h2.c-article__title a, h2 a, h3 a',
          type: 'text',
        },
        {
          name: 'url',
          selector: 'h2.c-article__title a, h2 a, h3 a, figure a',
          type: 'attribute',
          attribute: 'href',
        },
        {
          name: 'excerpt',
          selector: 'p.c-article__excerpt, p',
          type: 'text',
        },
        {
          name: 'imageUrl',
          selector: 'picture img, img',
          type: 'attribute',
          attribute: 'src',
        },
        {
          name: 'publishedDate',
          selector: 'time, .c-article__date',
          type: 'attribute',
          attribute: 'datetime',
        },
      ],
    },
    useLLMFallback: true,
    llmInstruction: `Extract all news articles from this Teleamazonas category page. Include both regular articles and video content. For each item, extract:
- title: The headline
- url: Link to full content
- excerpt: Brief description
- imageUrl: Thumbnail or featured image
- publishedDate: When it was published

Return an array. Ignore ads and navigation.`,
    minArticles: 3,
  },

  // ECU911 - News page with simple link structure
  ecu911: {
    schema: {
      name: 'ECU911 News Articles',
      baseSelector: '#contenido-comunica a[href*="ecu911.gob.ec"]',
      fields: [
        {
          name: 'title',
          selector: 'span.titulo',
          type: 'text',
        },
        {
          name: 'url',
          selector: '',
          type: 'attribute',
          attribute: 'href',
        },
        {
          name: 'excerpt',
          selector: 'span.titulo',
          type: 'text',
        },
        {
          name: 'imageUrl',
          selector: '',
          type: 'text',
        },
        {
          name: 'publishedDate',
          selector: 'span.time',
          type: 'text',
        },
      ],
    },
    useLLMFallback: true,
    minArticles: 3,
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
export const virtualScrollSites = new Set<string>([]);

/**
 * Sites that require JavaScript rendering
 */
export const jsRenderingSites = new Set(['elcomercio']);

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

/**
 * Get category extraction config for a specific source
 */
export function getCategoryExtractionConfig(source: string): CategoryExtractionConfig {
  const normalizedSource = source.toLowerCase().replace(/\s+/g, '');

  // Default fallback configuration
  const defaultConfig: CategoryExtractionConfig = {
    schema: {
      name: 'Generic Articles Listing',
      baseSelector: 'article, .article, .post, .news-item',
      fields: [
        { name: 'title', selector: 'h2, h3, .title', type: 'text' },
        { name: 'url', selector: 'a', type: 'attribute', attribute: 'href' },
        { name: 'excerpt', selector: 'p, .excerpt, .summary', type: 'text' },
        { name: 'imageUrl', selector: 'picture img, img', type: 'attribute', attribute: 'src' },
      ],
    },
    useLLMFallback: true,
    minArticles: 3,
  };

  return categoryExtractionConfigs[normalizedSource] || defaultConfig;
}
