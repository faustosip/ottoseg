/**
 * Test script for Crawl4AI scraping
 * Run with: node test-scraping.mjs
 */

import { scrapeAllSources } from './src/lib/news/scraper.ts';

console.log('🚀 Starting Crawl4AI scraping test...\n');

try {
  const result = await scrapeAllSources();

  console.log('\n📊 RESULTADOS DEL SCRAPING:');
  console.log('═══════════════════════════════════════════════\n');

  console.log(`Total de artículos: ${result.metadata.totalArticles}`);
  console.log(`Fuentes exitosas: ${result.metadata.sourcesSuccess}`);
  console.log(`Fuentes fallidas: ${result.metadata.sourcesFailed}`);
  console.log(`Timestamp: ${result.metadata.scrapedAt}\n`);

  console.log('Artículos por fuente:');
  console.log(`  - Primicias: ${result.primicias.length}`);
  console.log(`  - La Hora: ${result.laHora.length}`);
  console.log(`  - El Comercio: ${result.elComercio.length}`);
  console.log(`  - Teleamazonas: ${result.teleamazonas.length}`);
  console.log(`  - ECU911: ${result.ecu911.length}\n`);

  if (result.primicias.length > 0) {
    console.log('📰 Primeros 3 artículos de Primicias:');
    console.log('───────────────────────────────────────────────\n');
    result.primicias.slice(0, 3).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Excerpt: ${article.content.substring(0, 100)}...`);
      console.log(`   Image: ${article.imageUrl || 'N/A'}`);
      console.log(`   Date: ${article.publishedDate || 'N/A'}`);
      console.log('');
    });
  }

  if (result.metadata.errors.length > 0) {
    console.log('❌ ERRORES:');
    console.log('───────────────────────────────────────────────\n');
    result.metadata.errors.forEach(error => {
      console.log(`  - ${error.source}: ${error.error}`);
    });
  }

  console.log('\n✅ Test completado!');

} catch (error) {
  console.error('\n❌ ERROR EN EL TEST:');
  console.error(error);
  process.exit(1);
}
