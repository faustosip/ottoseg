# Crawl4AI + Firecrawl Integration Guide

## Hybrid Architecture

OttoSeguridad uses a two-phase hybrid scraping approach that combines the strengths of both Firecrawl and Crawl4AI.

### Why Hybrid?

**Firecrawl Strengths:**
- Fast category page scraping
- Reliable HTML→Markdown conversion
- Managed API (no infrastructure needed)
- Good for discovering article URLs

**Firecrawl Limitations:**
- Only scrapes category pages (not full articles)
- Cost per API call
- Limited customization

**Crawl4AI Strengths:**
- Extracts complete article content
- Handles JavaScript/dynamic content
- 100% free (self-hosted)
- Highly customizable extraction strategies

**Crawl4AI Limitations:**
- Requires Docker infrastructure
- Slower than simple API calls
- Manual scaling needed

**Solution: Use Both!**
- Firecrawl for fast URL discovery (18 pages)
- Crawl4AI for deep content extraction (~90 articles)

## Data Flow

```
┌──────────────────┐
│  User Request    │
│  POST /api/news  │
│  /scrape         │
└────────┬─────────┘
         │
         v
┌─────────────────────────────────────────────────────────┐
│                    PHASE 1: FIRECRAWL                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐       ┌──────────────┐                │
│  │ 18 Category  │──────>│  Firecrawl   │                │
│  │ Page URLs    │       │  API Call    │                │
│  └──────────────┘       └──────┬───────┘                │
│                                 │                        │
│                                 v                        │
│                         ┌───────────────┐                │
│                         │ Parse Results │                │
│                         │ Extract:      │                │
│                         │ - Titles      │                │
│                         │ - URLs        │                │
│                         │ - Excerpts    │                │
│                         └───────┬───────┘                │
│                                 │                        │
│                                 v                        │
│                         ~90 Article Links                │
│                                                          │
└─────────────────────────┬───────────────────────────────┘
                          │
                          │ Save to DB: bulletins.raw_news
                          │
                          v
┌─────────────────────────────────────────────────────────┐
│                   PHASE 2: CRAWL4AI                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐       ┌──────────────┐                │
│  │ 90 Article   │──────>│  Crawl4AI    │                │
│  │ URLs (batch) │       │  Service     │                │
│  └──────────────┘       └──────┬───────┘                │
│                                 │                        │
│                                 v                        │
│                         ┌───────────────┐                │
│                         │ Extract:      │                │
│                         │ - Full text   │                │
│                         │ - Author      │                │
│                         │ - Pub date    │                │
│                         │ - Images      │                │
│                         │ - Metadata    │                │
│                         └───────┬───────┘                │
│                                 │                        │
│                                 v                        │
│                         Full Article Data                │
│                                                          │
└─────────────────────────┬───────────────────────────────┘
                          │
                          │ Save to DB: bulletins.full_articles
                          │
                          v
                  ┌───────────────┐
                  │  MERGE DATA   │
                  │               │
                  │ Firecrawl +   │
                  │ Crawl4AI      │
                  └───────┬───────┘
                          │
                          v
                  ┌───────────────┐
                  │ AI Processing │
                  │ - Classify    │
                  │ - Summarize   │
                  └───────┬───────┘
                          │
                          v
                  Final Bulletin
```

## Code Implementation

### 1. API Endpoint (`/api/news/scrape`)

```typescript
// src/app/api/news/scrape/route.ts

export async function POST(request: NextRequest) {
  // Parse request options
  const body = await request.json().catch(() => ({}));
  const enableCrawl4AI = body.enableCrawl4AI ?? true; // Default: enabled

  // PHASE 1: Firecrawl - Discover URLs
  const scrapeResult = await scrapeAllSources();
  // Result: ~90 articles with titles, excerpts, URLs

  // Save Phase 1 results
  await updateBulletinRawNews(bulletinId, scrapeResult);

  // PHASE 2: Crawl4AI - Get full content (optional)
  if (enableCrawl4AI) {
    const enrichedResult = await enrichWithFullContent(scrapeResult);
    // Result: Same 90 articles + fullContent, author, publishedDate

    // Save Phase 2 results
    await updateBulletinFullArticles(bulletinId, enrichedResult);
  }

  return { success: true, ...stats };
}
```

### 2. Enrichment Function (`enrichWithFullContent`)

```typescript
// src/lib/news/scraper.ts

export async function enrichWithFullContent(
  result: ScrapeResult,
  options?: { maxConcurrency?: number }
): Promise<ScrapeResult> {
  const enrichedResult = { ...result };

  // Process each source
  for (const sourceKey of sources) {
    const articles = result[sourceKey];
    const urls = articles.map(a => a.url);

    // Use Crawl4AI to extract full content
    const fullArticles = await extractArticles(
      urls,
      articles[0].source,
      options?.maxConcurrency || 5
    );

    // Merge: Firecrawl data + Crawl4AI data
    enrichedResult[sourceKey] = articles.map(article => ({
      ...article,
      fullContent: fullArticles.find(f => f.url === article.url)?.fullContent,
      author: fullArticles.find(f => f.url === article.url)?.author,
      publishedDate: fullArticles.find(f => f.url === article.url)?.publishedDate,
    }));
  }

  return enrichedResult;
}
```

### 3. Crawl4AI Client (`extractArticles`)

```typescript
// src/lib/crawl4ai/strategies.ts

export async function extractArticles(
  urls: string[],
  source: string,
  maxConcurrency: number = 5
): Promise<ScrapedArticle[]> {
  const results: ScrapedArticle[] = [];

  // Process in batches (respecting concurrency limit)
  for (let i = 0; i < urls.length; i += maxConcurrency) {
    const batch = urls.slice(i, i + maxConcurrency);

    const batchResults = await Promise.all(
      batch.map(url => extractArticle(url, source))
    );

    results.push(...batchResults.filter(Boolean));
  }

  return results;
}

async function extractArticle(url: string, source: string): Promise<ScrapedArticle | null> {
  const config = getExtractionConfig(source);

  // Build Crawl4AI request
  const requestConfig = {
    url,
    formats: ['markdown', 'html'],
    onlyMainContent: true,
    extractionStrategy: shouldUseLLM(source)
      ? createLLMExtractionStrategy(config)
      : createCSSExtractionStrategy(config),
  };

  // Call Crawl4AI service
  const response = await client.scrape(requestConfig);

  // Parse and return
  return parseArticleResponse(response, url, source);
}
```

## Database Schema

### Before (Firecrawl Only)

```typescript
interface BulletinNews {
  id: string;
  title: string;
  content: string;        // Excerpt only
  url: string;
  imageUrl?: string;
  source: string;
  selected: boolean;
  scrapedAt: string;
}
```

### After (Hybrid)

```typescript
interface BulletinNews {
  id: string;
  title: string;
  content: string;        // Excerpt from Firecrawl
  fullContent?: string;   // Complete article from Crawl4AI ✨
  url: string;
  imageUrl?: string;
  author?: string;        // From Crawl4AI ✨
  publishedDate?: string; // From Crawl4AI ✨
  source: string;
  selected: boolean;
  scrapedAt: string;
  metadata?: {            // From Crawl4AI ✨
    wordCount?: number;
    readingTime?: number;
    contentQuality?: number;
  };
}
```

### Bulletin Table

```sql
CREATE TABLE bulletins (
  id UUID PRIMARY KEY,
  raw_news JSONB,         -- Firecrawl results (Phase 1)
  full_articles JSONB,    -- Crawl4AI results (Phase 2) ✨
  crawl4ai_stats JSONB,   -- Enrichment metrics ✨
  classified_news JSONB,
  -- ... other fields
);
```

## Performance Comparison

### Firecrawl Only

```
Duration: 45-60 seconds
Cost: 18 API calls ($X)
Data Quality: Basic (excerpts only)
Content Length: ~200 words/article
```

### Hybrid (Firecrawl + Crawl4AI)

```
Duration: 3-5 minutes total
  - Phase 1: 45s (Firecrawl)
  - Phase 2: 3-4min (Crawl4AI)

Cost: 18 Firecrawl calls + $0 Crawl4AI = $X total
  (80% cost reduction vs scraping full articles with Firecrawl)

Data Quality: Excellent (full articles)
Content Length: ~500-1500 words/article
```

## Configuration Options

### Enable/Disable Crawl4AI

**Via API Request:**

```bash
# Enable (default)
curl -X POST /api/news/scrape \
  -d '{"enableCrawl4AI": true}'

# Disable (Firecrawl only)
curl -X POST /api/news/scrape \
  -d '{"enableCrawl4AI": false}'
```

**Via Environment Variable:**

```env
# Disable globally (for testing)
CRAWL4AI_ENABLED=false
```

### Concurrency Control

```env
# Max concurrent Crawl4AI requests
MAX_CONCURRENT_CRAWLS=5  # Default

# Reduce for lower resource usage
MAX_CONCURRENT_CRAWLS=3
```

### Timeout Configuration

```env
# Max time per article (milliseconds)
CRAWL4AI_TIMEOUT=120000  # 2 minutes default

# Increase for slow sites
CRAWL4AI_TIMEOUT=180000  # 3 minutes
```

## Extraction Strategies

### CSS-Based Extraction (Fast)

Used for: Primicias, La Hora, El Comercio

```typescript
const strategy = {
  type: 'json_css',
  config: {
    schema: {
      baseSelector: 'article',
      fields: [
        { name: 'title', selector: 'h1', type: 'text' },
        { name: 'content', selector: '.article-body', type: 'text' },
        { name: 'author', selector: '.author', type: 'text' },
      ]
    }
  }
};
```

### LLM-Based Extraction (Accurate)

Used for: Teleamazonas (complex layout)

```typescript
const strategy = {
  type: 'llm',
  config: {
    provider: 'openrouter/openai/gpt-4o',
    instruction: `Extract title, content, author, and date from this article.
                  Ignore ads, navigation, and related articles.`,
  }
};
```

### Virtual Scrolling (Dynamic Content)

Used for: ECU911 (infinite scroll)

```typescript
const config = {
  virtualScroll: {
    containerSelector: 'body',
    scrollCount: 5,
    waitAfterScroll: 1.0,
  }
};
```

## Error Handling

### Graceful Degradation

If Crawl4AI fails:
- Firecrawl data is still available (excerpts)
- Bulletin can still be generated
- Error logged for investigation

```typescript
try {
  enrichedResult = await enrichWithFullContent(scrapeResult);
} catch (error) {
  console.error('Crawl4AI failed, using Firecrawl data only:', error);
  enrichedResult = scrapeResult; // Fallback to Phase 1 data
}
```

### Retry Logic

Built into Crawl4AI client:
- 2 retries per article
- 3s delay between retries
- Exponential backoff

### Partial Success

If some articles fail:
- Successful articles are still saved
- Failed articles use Firecrawl excerpts
- Stats tracked in `crawl4aiStats`

```json
{
  "enabled": true,
  "totalArticles": 90,
  "enrichedArticles": 85,
  "failedArticles": 5,
  "successRate": "94.44%"
}
```

## Monitoring

### Logs

```typescript
// Phase 1
console.log("✅ FASE 1 completada: 90 artículos descubiertos");

// Phase 2
console.log("🚀 FASE 2: Enriqueciendo con Crawl4AI...");
console.log("✅ FASE 2 completada: 85/90 artículos enriquecidos");
```

### Database Logs

```sql
SELECT * FROM bulletin_logs
WHERE bulletin_id = 'xxx'
ORDER BY created_at DESC;
```

```
| step       | status    | message                                      |
|------------|-----------|----------------------------------------------|
| scraping   | completed | FASE 1 (Firecrawl) completada: 90 artículos |
| enrichment | completed | FASE 2 (Crawl4AI) completada: 85/90         |
```

### API Response

```json
{
  "success": true,
  "bulletinId": "...",
  "totalNews": 90,
  "sources": { ... },
  "crawl4ai": {
    "enabled": true,
    "totalArticles": 90,
    "enrichedArticles": 85,
    "failedArticles": 5,
    "successRate": "94.44%",
    "duration": 245000
  }
}
```

## Best Practices

1. **Always run Phase 1 first** - Firecrawl discovers URLs fast
2. **Make Phase 2 optional** - Allow disabling for testing
3. **Use CSS extraction when possible** - Faster than LLM
4. **Limit concurrency** - Don't overwhelm the service
5. **Handle failures gracefully** - Firecrawl data is enough for basic bulletins
6. **Monitor performance** - Track success rates and duration
7. **Cache when possible** - Avoid re-scraping the same articles

## Troubleshooting

### Crawl4AI Timeout

**Symptom:** Articles timeout after 2 minutes

**Solution:**
```env
CRAWL4AI_TIMEOUT=300000  # Increase to 5 minutes
```

### Low Success Rate

**Symptom:** Only 50% of articles enriched

**Possible causes:**
1. Sites blocking the crawler
2. Incorrect CSS selectors
3. Service overloaded

**Solutions:**
1. Add user-agent rotation
2. Update extraction configs
3. Increase resources or reduce concurrency

### Slow Performance

**Symptom:** Phase 2 takes 10+ minutes

**Solutions:**
1. Reduce article count
2. Increase concurrency (if resources allow)
3. Scale Crawl4AI service to multiple replicas

## Next Steps

- [Setup Guide](./setup.md) - Deploy Crawl4AI service
- [API Reference](./api.md) - Detailed API documentation
- [Advanced Configuration](./advanced.md) - Custom strategies
