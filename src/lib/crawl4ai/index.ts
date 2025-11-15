/**
 * Crawl4AI Module
 *
 * Hybrid scraping solution complementing Firecrawl
 * - Firecrawl: Quick category page scraping for article discovery
 * - Crawl4AI: Deep article extraction with full content
 */

// Client exports
export { Crawl4AIClient, Crawl4AIError, getCrawl4AIClient, scrapeURL, scrapeURLs, checkCrawl4AIHealth } from './client';

// Strategy exports
export { extractArticle, extractArticles } from './strategies';

// Configuration exports
export { crawl4aiConfig, getExtractionConfig, needsVirtualScroll, needsJSRendering, shouldUseLLM } from './config';

// Type exports
export type {
  Crawl4AIRequestConfig,
  Crawl4AIResponse,
  Crawl4AIData,
  Crawl4AIMetadata,
  Crawl4AIHealthResponse,
  Crawl4AIBatchRequest,
  Crawl4AIBatchResponse,
  Crawl4AIBatchResult,
  ScrapedArticle,
  ExtractionStrategy,
  JsonCssExtractionConfig,
  LLMExtractionConfig,
  CosineExtractionConfig,
  VirtualScrollConfig,
  ContentFilter,
  ProxyConfig,
  Cookie,
  Crawl4AIArticleExtractionConfig,
} from './types';
