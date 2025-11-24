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
      baseSelector: 'article.post, article, .post, .article-item, .entry, .c-card',
      fields: [
        {
          name: 'title',
          selector: 'h2 a, h3 a, .entry-title a, .post-title a, h2, h3',
          type: 'text',
        },
        {
          name: 'url',
          selector: 'h2 a, h3 a, .entry-title a, .post-title a, a[rel="bookmark"]',
          type: 'attribute',
          attribute: 'href',
        },
        {
          name: 'excerpt',
          selector: '.entry-excerpt, .excerpt, .post-excerpt, p, .description',
          type: 'text',
        },
        {
          name: 'imageUrl',
          selector: 'picture img, img.wp-post-image, .featured-image img, img, .entry-image img',
          type: 'attribute',
          attribute: 'src',
        },
        {
          name: 'publishedDate',
          selector: 'time, .entry-date, .post-date, .published',
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
  laHora: {
    schema: {
      name: 'La Hora Articles Listing',
      baseSelector: 'section.styles_content__Pe1Q_, div[class*="ItemCustomContent"]',
      fields: [
        {
          name: 'title',
          selector: 'h2 a, a.styles_linkStyled__pYJA9',
          type: 'text',
        },
        {
          name: 'url',
          selector: 'a[href$=".html"]',
          type: 'attribute',
          attribute: 'href',
        },
        {
          name: 'excerpt',
          selector: '.styles_correspondent__Q3Mer',
          type: 'text',
        },
        {
          name: 'imageUrl',
          selector: 'picture img, img.styles_imageStyled__kKZxw, img',
          type: 'attribute',
          attribute: 'src',
        },
        {
          name: 'publishedDate',
          selector: '.styles_correspondent__Q3Mer',
          type: 'text',
        },
      ],
    },
    useLLMFallback: true,
    minArticles: 5,
  },

  // El Comercio - Category pages
  elComercio: {
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
          selector: '.feed__title',
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
          selector: '.feed__time',
          type: 'text',
        },
      ],
    },
    useLLMFallback: true,
    minArticles: 5,
  },

  // Teleamazonas - Category pages (complex, may need LLM)
  teleamazonas: {
    schema: {
      name: 'Teleamazonas Articles Listing',
      baseSelector: 'article, .news-card, .video-card, .story-item',
      fields: [
        {
          name: 'title',
          selector: 'h2, h3, .title',
          type: 'text',
        },
        {
          name: 'url',
          selector: 'a',
          type: 'attribute',
          attribute: 'href',
        },
        {
          name: 'excerpt',
          selector: '.summary, p',
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
          selector: 'time, .date',
          type: 'text',
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
