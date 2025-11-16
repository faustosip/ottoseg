/**
 * API Endpoint: GET /api/debug/test-category-extraction
 *
 * Test directo de extractCategoryArticles con debug detallado
 */

import { NextResponse } from "next/server";
import { extractCategoryArticles } from "@/lib/crawl4ai";

export async function GET() {
  try {
    const testUrl = "https://www.primicias.ec/politica/";

    console.log("\n🧪 TEST DE EXTRACCIÓN DE CATEGORÍA");
    console.log("═══════════════════════════════════════════════");
    console.log(`URL: ${testUrl}`);
    console.log(`Fuente: Primicias\n`);

    const articles = await extractCategoryArticles(testUrl, "Primicias");

    console.log(`\n✅ Extracción completada: ${articles.length} artículos\n`);

    if (articles.length > 0) {
      console.log("📰 Artículos extraídos:");
      articles.forEach((article, index) => {
        console.log(`\n${index + 1}. ${article.title}`);
        console.log(`   URL: ${article.url}`);
        console.log(`   Excerpt: ${article.content.substring(0, 100)}...`);
      });
    } else {
      console.log("⚠️  No se extrajeron artículos");
    }

    return NextResponse.json({
      success: true,
      url: testUrl,
      source: "Primicias",
      articlesCount: articles.length,
      articles: articles.map(a => ({
        title: a.title,
        url: a.url,
        excerpt: a.content.substring(0, 200),
        imageUrl: a.imageUrl,
        publishedDate: a.publishedDate,
      })),
    });
  } catch (error) {
    console.error("\n❌ ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        stack: (error as Error).stack,
      },
      { status: 500 }
    );
  }
}
