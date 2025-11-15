/**
 * Crawl4AI Health Check Endpoint
 *
 * Verifica el estado del servicio Crawl4AI en Docker Swarm
 */

import { NextResponse } from "next/server";
import { checkCrawl4AIHealth } from "@/lib/crawl4ai";

export async function GET() {
  try {
    const startTime = Date.now();

    // Verificar conectividad con el servicio Crawl4AI
    const isHealthy = await checkCrawl4AIHealth();

    const duration = Date.now() - startTime;

    if (isHealthy) {
      return NextResponse.json({
        status: "ok",
        message: "Crawl4AI service is operational",
        service: "crawl4ai_api",
        url: process.env.CRAWL4AI_API_URL || "http://crawl4ai_api:11235",
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          status: "error",
          message: "Crawl4AI service is not responding",
          service: "crawl4ai_api",
          url: process.env.CRAWL4AI_API_URL || "http://crawl4ai_api:11235",
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("❌ Error checking Crawl4AI health:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check Crawl4AI service health",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
