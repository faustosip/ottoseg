/**
 * Crawl4AI HTTP Client
 *
 * Client for interacting with the Crawl4AI REST API
 */

import type {
  Crawl4AIRequestConfig,
  Crawl4AIResponse,
  Crawl4AIHealthResponse,
  Crawl4AIBatchRequest,
  Crawl4AIBatchResponse,
  Crawl4AIBatchResult,
  Crawl4AIError as Crawl4AIErrorType,
  ExtractionStrategy,
  JsonCssExtractionConfig,
  LLMExtractionConfig,
  CosineExtractionConfig,
} from './types';
import { crawl4aiConfig } from './config';

// ============================================================================
// Error Handling
// ============================================================================

export class Crawl4AIError extends Error implements Crawl4AIErrorType {
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
// Utility Functions
// ============================================================================

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = crawl4aiConfig.maxRetries,
  baseDelay: number = crawl4aiConfig.retryDelay
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ============================================================================
// HTTP Client
// ============================================================================

export class Crawl4AIClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeout?: number) {
    this.baseUrl = baseUrl || crawl4aiConfig.apiUrl;
    this.timeout = timeout || crawl4aiConfig.timeout;
  }

  /**
   * Convert our internal ExtractionStrategy format to Crawl4AI API format
   */
  private convertExtractionStrategy(strategy: ExtractionStrategy): unknown {
    if (strategy.type === 'json_css') {
      const config = strategy.config as JsonCssExtractionConfig;
      return {
        type: 'JsonCssExtractionStrategy',
        params: {
          schema: {
            type: 'dict',
            value: config.schema,
          },
        },
      };
    } else if (strategy.type === 'llm') {
      const config = strategy.config as LLMExtractionConfig;
      return {
        type: 'LLMExtractionStrategy',
        params: {
          provider: config.provider,
          ...(config.apiToken && { api_token: config.apiToken }),
          instruction: config.instruction,
          ...(config.schema && { schema: config.schema }),
        },
      };
    } else if (strategy.type === 'cosine') {
      const config = strategy.config as CosineExtractionConfig;
      return {
        type: 'CosineExtractionStrategy',
        params: {
          ...(config.keywords && { keywords: config.keywords }),
          ...(config.minSimilarity && { min_similarity: config.minSimilarity }),
        },
      };
    }
    throw new Crawl4AIError(`Unsupported extraction strategy type: ${strategy.type}`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<Crawl4AIHealthResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        status: 'ok',
        ...data,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Scrape a single URL
   */
  async scrape(config: Crawl4AIRequestConfig): Promise<Crawl4AIResponse> {
    return retryWithBackoff(async () => {
      const controller = new AbortController();
      const requestTimeout = config.timeout || this.timeout;
      const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

      try {
        // Build Crawl4AI API payload in the correct format
        const crawl4aiPayload = {
          urls: [config.url],
          browser_config: {
            type: 'BrowserConfig',
            params: {
              headless: true,
              verbose: false,
            },
          },
          crawler_config: {
            type: 'CrawlerRunConfig',
            params: {
              // Convert our config to Crawl4AI format
              ...(config.formats && { word_count_threshold: 0 }),
              ...(config.waitTime && { wait_for: `css:body` }),
              ...(config.waitTime && { delay_before_return_html: config.waitTime }),
              ...(config.extractionStrategy && {
                extraction_strategy: this.convertExtractionStrategy(config.extractionStrategy),
              }),
            },
          },
        };

        const response = await fetch(`${this.baseUrl}/crawl`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(crawl4aiPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Crawl4AIError(
            `Crawl4AI API error: ${response.statusText}`,
            response.status,
            errorText
          );
        }

        // Parse JSON with control character sanitization
        // Crawl4AI responses may contain unescaped control characters in HTML content
        const rawText = await response.text();
        const sanitizedText = rawText.replace(/[\x00-\x1F\x7F]/g, (ch) => {
          // Preserve common whitespace characters
          if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
          return '';
        });

        let data: Record<string, unknown>;
        try {
          data = JSON.parse(sanitizedText);
        } catch (parseError) {
          throw new Crawl4AIError(
            `Failed to parse Crawl4AI JSON response: ${(parseError as Error).message}`,
            undefined,
            parseError
          );
        }

        // Crawl4AI returns { success, results: [...] }
        // Extract the first result since we only send one URL
        const results = data.results as Array<Record<string, unknown>> | undefined;
        const result = results?.[0];

        if (!result) {
          throw new Crawl4AIError('No results returned from Crawl4AI');
        }

        // Handle markdown field: newer Crawl4AI versions return an object instead of string
        const rawMarkdown = result.markdown;
        let markdownStr: string | undefined;
        if (typeof rawMarkdown === 'string') {
          markdownStr = rawMarkdown;
        } else if (rawMarkdown && typeof rawMarkdown === 'object') {
          const mdObj = rawMarkdown as Record<string, unknown>;
          markdownStr = (mdObj.raw_markdown || mdObj.fit_markdown || '') as string;
        }

        return {
          success: data.success as boolean,
          data: {
            markdown: markdownStr,
            html: result.html as string | undefined ?? result.cleaned_html as string | undefined,
            text: result.text as string | undefined,
            extracted: result.extracted_content ?? result.extracted,
            screenshot: result.screenshot as string | undefined,
            pdf: result.pdf as string | undefined,
            links: result.links as { internal: string[]; external: string[] } | undefined,
            images: (result.images ?? (result.media as Record<string, unknown> | undefined)?.images) as string[] | undefined,
            title: ((result.metadata as Record<string, unknown> | undefined)?.title ?? result.title) as string | undefined,
            description: ((result.metadata as Record<string, unknown> | undefined)?.description ?? result.description) as string | undefined,
            author: result.author as string | undefined,
            publishedDate: result.published_date as string | undefined,
            keywords: result.keywords as string[] | undefined,
          },
          metadata: {
            url: (result.url as string) || config.url,
            crawledAt: new Date().toISOString(),
            statusCode: result.status_code as number | undefined,
            duration: result.crawl_time as number | undefined,
          },
        };
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Crawl4AIError) {
          throw error;
        }

        if ((error as Error).name === 'AbortError') {
          throw new Crawl4AIError(
            `Request timeout after ${requestTimeout}ms`,
            408,
            error
          );
        }

        throw new Crawl4AIError(
          error instanceof Error ? error.message : 'Unknown error',
          undefined,
          error
        );
      }
    });
  }

  /**
   * Scrape multiple URLs in batch
   */
  async scrapeBatch(request: Crawl4AIBatchRequest): Promise<Crawl4AIBatchResponse> {
    const startTime = Date.now();
    const results: Crawl4AIBatchResult[] = [];
    const maxConcurrency = request.maxConcurrency || crawl4aiConfig.maxConcurrency;

    // Process URLs in batches to limit concurrency
    for (let i = 0; i < request.urls.length; i += maxConcurrency) {
      const batch = request.urls.slice(i, i + maxConcurrency);

      const batchResults = await Promise.all(
        batch.map(async (url) => {
          try {
            const response = await this.scrape({
              url,
              ...request.config,
            });

            return {
              url,
              success: response.success,
              data: response.data,
              metadata: response.metadata,
            };
          } catch (error) {
            return {
              url,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      results.push(...batchResults);
    }

    const duration = Date.now() - startTime;
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: true,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        duration,
      },
    };
  }

  /**
   * Extract markdown from a URL
   */
  async extractMarkdown(url: string, config?: Partial<Crawl4AIRequestConfig>): Promise<string> {
    const response = await this.scrape({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      removeBase64Images: true,
      ...config,
    });

    if (!response.success || !response.data?.markdown) {
      throw new Crawl4AIError('Failed to extract markdown');
    }

    return response.data.markdown;
  }

  /**
   * Extract HTML from a URL
   */
  async extractHTML(url: string, config?: Partial<Crawl4AIRequestConfig>): Promise<string> {
    const response = await this.scrape({
      url,
      formats: ['html'],
      onlyMainContent: true,
      ...config,
    });

    if (!response.success || !response.data?.html) {
      throw new Crawl4AIError('Failed to extract HTML');
    }

    return response.data.html;
  }

  /**
   * Take a screenshot of a URL
   */
  async screenshot(url: string): Promise<string> {
    const response = await this.scrape({
      url,
      screenshot: true,
    });

    if (!response.success || !response.data?.screenshot) {
      throw new Crawl4AIError('Failed to capture screenshot');
    }

    return response.data.screenshot;
  }

  /**
   * Generate PDF from a URL
   */
  async generatePDF(url: string): Promise<string> {
    const response = await this.scrape({
      url,
      pdf: true,
    });

    if (!response.success || !response.data?.pdf) {
      throw new Crawl4AIError('Failed to generate PDF');
    }

    return response.data.pdf;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let crawl4aiClient: Crawl4AIClient | null = null;

/**
 * Get or create the Crawl4AI client singleton
 */
export function getCrawl4AIClient(): Crawl4AIClient {
  if (!crawl4aiClient) {
    crawl4aiClient = new Crawl4AIClient();
  }
  return crawl4aiClient;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick scrape function
 */
export async function scrapeURL(
  url: string,
  config?: Partial<Crawl4AIRequestConfig>
): Promise<Crawl4AIResponse> {
  const client = getCrawl4AIClient();
  return client.scrape({
    url,
    ...config,
  });
}

/**
 * Quick batch scrape function
 */
export async function scrapeURLs(
  urls: string[],
  config?: Partial<Crawl4AIRequestConfig>
): Promise<Crawl4AIBatchResponse> {
  const client = getCrawl4AIClient();
  return client.scrapeBatch({
    urls,
    config,
  });
}

/**
 * Quick health check function
 */
export async function checkCrawl4AIHealth(): Promise<boolean> {
  const client = getCrawl4AIClient();
  const health = await client.healthCheck();
  return health.status === 'ok';
}
