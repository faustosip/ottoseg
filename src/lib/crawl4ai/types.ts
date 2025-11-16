/**
 * Crawl4AI TypeScript Client Types
 *
 * Type definitions for interacting with the Crawl4AI REST API
 */

// ============================================================================
// Request Types
// ============================================================================

export interface Crawl4AIRequestConfig {
  url: string;

  // Extraction options
  formats?: ('markdown' | 'html' | 'text')[];
  onlyMainContent?: boolean;

  // Browser behavior
  waitFor?: string; // CSS selector to wait for
  waitTime?: number; // Time in seconds to wait
  screenshot?: boolean;
  pdf?: boolean;

  // JavaScript execution
  jsCode?: string | string[];
  jsCodePost?: string | string[];

  // Virtual scrolling (for infinite scroll pages)
  virtualScroll?: VirtualScrollConfig;

  // Extraction strategy
  extractionStrategy?: ExtractionStrategy;

  // Content filtering
  contentFilter?: ContentFilter;

  // Advanced options
  removeBase64Images?: boolean;
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  cookies?: Cookie[];

  // Proxy configuration
  proxy?: ProxyConfig;
}

export interface VirtualScrollConfig {
  containerSelector?: string;
  scrollCount?: number;
  scrollBy?: 'container_height' | 'viewport_height' | number;
  waitAfterScroll?: number; // seconds
}

export interface ExtractionStrategy {
  type: 'json_css' | 'llm' | 'cosine';
  config: JsonCssExtractionConfig | LLMExtractionConfig | CosineExtractionConfig;
}

export interface JsonCssExtractionConfig {
  schema: {
    name: string;
    baseSelector: string;
    fields: Array<{
      name: string;
      selector: string;
      type: 'text' | 'attribute' | 'html';
      attribute?: string;
    }>;
  };
}

export interface LLMExtractionConfig {
  provider: string; // e.g., "openrouter/openai/gpt-4o"
  apiToken?: string;
  instruction: string;
  schema?: Record<string, unknown>;
}

export interface CosineExtractionConfig {
  keywords?: string[];
  minSimilarity?: number;
}

export interface ContentFilter {
  type: 'llm' | 'keyword';
  config: LLMContentFilterConfig | KeywordContentFilterConfig;
}

export interface LLMContentFilterConfig {
  provider: string;
  apiToken?: string;
  instruction: string;
}

export interface KeywordContentFilterConfig {
  keywords: string[];
  mode: 'include' | 'exclude';
}

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface Crawl4AIResponse {
  success: boolean;
  data?: Crawl4AIData;
  error?: string;
  metadata?: Crawl4AIMetadata;
}

export interface Crawl4AIData {
  // Content in different formats
  markdown?: string;
  html?: string;
  text?: string;

  // Extracted structured data
  extracted?: unknown;

  // Media
  screenshot?: string; // base64 or URL
  pdf?: string; // base64 or URL

  // Links
  links?: {
    internal: string[];
    external: string[];
  };

  // Images
  images?: string[];

  // Metadata
  title?: string;
  description?: string;
  author?: string;
  publishedDate?: string;
  keywords?: string[];
}

export interface Crawl4AIMetadata {
  url: string;
  statusCode?: number;
  duration?: number; // milliseconds
  crawledAt: string; // ISO timestamp
  contentLength?: number;
  loadTime?: number;
  renderTime?: number;
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface Crawl4AIHealthResponse {
  status: 'ok' | 'error';
  version?: string;
  uptime?: number;
  message?: string;
}

// ============================================================================
// Batch Scraping Types
// ============================================================================

export interface Crawl4AIBatchRequest {
  urls: string[];
  config?: Omit<Crawl4AIRequestConfig, 'url'>;
  maxConcurrency?: number;
}

export interface Crawl4AIBatchResponse {
  success: boolean;
  results: Crawl4AIBatchResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}

export interface Crawl4AIBatchResult {
  url: string;
  success: boolean;
  data?: Crawl4AIData;
  error?: string;
  metadata?: Crawl4AIMetadata;
}

// ============================================================================
// Error Types
// ============================================================================

export class Crawl4AIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'Crawl4AIError';
  }
}

// ============================================================================
// Article Types (for our news scraping use case)
// ============================================================================

export interface ScrapedArticle {
  id: string;
  title: string;
  content: string;
  fullContent?: string; // Full article content from Crawl4AI
  url: string;
  imageUrl?: string;
  author?: string;
  publishedDate?: string;
  source: string;
  selected: boolean;
  scrapedAt: string;
  metadata?: {
    wordCount?: number;
    readingTime?: number;
    contentQuality?: number;
  };
}

export interface Crawl4AIArticleExtractionConfig {
  titleSelector?: string;
  contentSelector?: string;
  authorSelector?: string;
  dateSelector?: string;
  imageSelector?: string;
  useLLM?: boolean;
  llmInstruction?: string;
}

/**
 * Configuration for extracting multiple articles from category pages
 */
export interface CategoryExtractionConfig {
  /** JSON-CSS schema for extracting article listings */
  schema: JsonCssExtractionConfig['schema'];
  /** Whether to use LLM as fallback if CSS extraction fails */
  useLLMFallback?: boolean;
  /** Custom LLM instruction for fallback extraction */
  llmInstruction?: string;
  /** Expected minimum number of articles to extract (for validation) */
  minArticles?: number;
}
