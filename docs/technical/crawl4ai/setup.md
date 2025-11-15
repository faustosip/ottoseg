# Crawl4AI Setup Guide

## Overview

Crawl4AI is a powerful, open-source web scraper specifically designed for AI applications. In OttoSeguridad, it works alongside Firecrawl in a hybrid architecture to extract complete article content.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ HYBRID SCRAPING PIPELINE                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ PHASE 1: Firecrawl (URL Discovery)                      │
│ ├─ Scrapes 18 category pages                            │
│ ├─ Extracts article titles + URLs (~90 links)           │
│ └─ Fast & cost-effective                                │
│                                                          │
│ PHASE 2: Crawl4AI (Full Content)                        │
│ ├─ Follows the ~90 links from Phase 1                   │
│ ├─ Extracts complete article content                    │
│ ├─ Handles JavaScript/dynamic content                   │
│ └─ 100% free (self-hosted)                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker Swarm cluster
- Portainer (optional, for visual management)
- Traefik for routing
- Ottoseguridadnet network created

## Deployment Steps

### 1. Deploy Crawl4AI Stack

**Using Portainer:**

1. Go to **Stacks** → **Add Stack**
2. Name: `crawl4ai`
3. Paste contents from `docs/business/confcrawl4ai.txt`
4. Deploy the stack

**Using CLI:**

```bash
docker stack deploy -c docs/business/confcrawl4ai.txt crawl4ai
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Crawl4AI Configuration
CRAWL4AI_API_URL=http://crawl4ai_api:11235  # Internal Docker service
CRAWL4AI_TIMEOUT=300000  # 5 minutes

# Required: OpenRouter API key (for LLM extraction)
OPENROUTER_API_KEY=your-key-here
```

### 3. Verify Deployment

Check the service is running:

```bash
# Using Docker CLI
docker service ls | grep crawl4ai

# Check service logs
docker service logs crawl4ai_api
```

**Expected output:**
```
crawl4ai_api.1.xxx    | Server started on http://0.0.0.0:11235
```

### 4. Test the API

**Health Check:**

```bash
curl http://crawl4ai_api:11235/health
```

**From Next.js app:**

```bash
curl http://localhost:3000/api/crawl4ai/health
```

**Expected response:**
```json
{
  "status": "ok",
  "message": "Crawl4AI service is operational",
  "service": "crawl4ai_api",
  "url": "http://crawl4ai_api:11235",
  "duration": "45ms",
  "timestamp": "2025-11-13T10:30:00Z"
}
```

### 5. Test Scraping

```bash
curl -X POST http://localhost:3000/api/news/scrape \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"enableCrawl4AI": true}'
```

## Service Configuration

### Resource Limits

```yaml
resources:
  limits:
    cpus: "1"
    memory: 1024M
```

**Adjust based on usage:**
- Light load: 0.5 CPU, 512MB RAM
- Medium load: 1 CPU, 1GB RAM (default)
- Heavy load: 2 CPU, 2GB RAM

### Scaling

```bash
# Scale to 2 replicas
docker service scale crawl4ai_api=2

# Scale back to 1
docker service scale crawl4ai_api=1
```

### Accessing via Domain

The service is exposed at: `https://crawl.ottoseguridadai.com`

**SSL Certificate:**
- Automatically provisioned via Traefik + Let's Encrypt
- Check cert status: `https://crawl.ottoseguridadai.com/health`

## Troubleshooting

### Service Won't Start

1. Check logs:
```bash
docker service logs crawl4ai_api --follow
```

2. Common issues:
   - Port 11235 already in use
   - Network `Ottoseguridadnet` doesn't exist
   - Insufficient resources

3. Recreate service:
```bash
docker service rm crawl4ai_api
docker stack deploy -c docs/business/confcrawl4ai.txt crawl4ai
```

### Health Check Fails

1. Verify service is running:
```bash
docker service ps crawl4ai_api
```

2. Test internal connectivity:
```bash
docker exec -it $(docker ps -q -f name=crawl4ai_api) curl localhost:11235/health
```

3. Check firewall rules (if accessing externally)

### Slow Performance

1. Check resource usage:
```bash
docker stats $(docker ps -q -f name=crawl4ai_api)
```

2. Increase resources (see Resource Limits above)

3. Reduce concurrency in `.env`:
```env
MAX_CONCURRENT_CRAWLS=3  # Default: 5
```

### Out of Memory

1. Increase memory limit in stack config:
```yaml
resources:
  limits:
    memory: 2048M  # Increase to 2GB
```

2. Enable swap (not recommended for production)

3. Reduce concurrent scraping in your code

## Monitoring

### Service Status

```bash
# Check service status
docker service ps crawl4ai_api

# View logs
docker service logs crawl4ai_api --tail 100

# Real-time logs
docker service logs crawl4ai_api --follow
```

### Performance Metrics

Access via Portainer:
- Stacks → crawl4ai → crawl4ai_api
- View resource usage graphs
- Check replica status

### Alerts

Set up monitoring with:
- Prometheus + Grafana (recommended)
- Docker Healthcheck
- Portainer notifications

## Updating

### Update Docker Image

1. Pull latest image:
```bash
docker pull unclecode/crawl4ai:latest
```

2. Update service:
```bash
docker service update --image unclecode/crawl4ai:latest crawl4ai_api
```

3. Verify update:
```bash
docker service ps crawl4ai_api
```

### Zero-Downtime Update

1. Scale to 2 replicas:
```bash
docker service scale crawl4ai_api=2
```

2. Update image:
```bash
docker service update --image unclecode/crawl4ai:latest crawl4ai_api
```

3. Wait for new replicas to be healthy

4. Scale back to 1:
```bash
docker service scale crawl4ai_api=1
```

## Security Considerations

1. **Internal Access Only**: By default, service is only accessible within Docker network

2. **External Access**: If exposing externally, consider:
   - API key authentication
   - Rate limiting
   - IP whitelisting

3. **Environment Variables**: Never commit API keys to git

4. **SSL/TLS**: Always use HTTPS in production (configured via Traefik)

## Cost Analysis

**Crawl4AI vs Firecrawl:**

| Aspect | Crawl4AI | Firecrawl |
|--------|----------|-----------|
| Cost | $0 (self-hosted) | $X per scrape |
| Infrastructure | Docker Swarm required | None |
| Maintenance | Self-managed | Fully managed |
| Customization | Full control | Limited |
| Scalability | Manual | Automatic |

**Monthly Savings:**
- ~90 articles/day × 30 days = 2,700 articles/month
- Firecrawl cost: $X × 2,700 = $Y/month
- Crawl4AI cost: $0 (infrastructure already exists)
- **Savings: $Y/month**

## Next Steps

- [Integration Guide](./integration.md) - How Crawl4AI works with Firecrawl
- [API Reference](./api.md) - Detailed API documentation
- [Advanced Configuration](./advanced.md) - Custom extraction strategies
