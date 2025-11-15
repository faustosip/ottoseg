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
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // Crawl4AI API expects 'urls' (plural) not 'url'
        const { url, ...restConfig } = config;
        const crawl4aiPayload = {
          urls: [url],  // Convert single URL to array
          ...restConfig,
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

        const data = await response.json();

        return {
          success: true,
          data: data.data,
          metadata: {
            url: config.url,
            crawledAt: new Date().toISOString(),
            ...data.metadata,
          },
        };
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Crawl4AIError) {
          throw error;
        }

        if ((error as Error).name === 'AbortError') {
          throw new Crawl4AIError(
            `Request timeout after ${this.timeout}ms`,
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
