/**
 * Test del Pipeline Híbrido: Firecrawl + Crawl4AI
 *
 * Prueba el flujo completo de scraping de noticias
 * Uso: node test-pipeline.mjs
 */

const CRAWL4AI_URL = 'https://crawl.ottoseguridadai.com';

// URLs de prueba (artículos reales)
const TEST_URLS = [
  'https://www.primicias.ec/noticias/politica/',
  'https://www.lahora.com.ec/noticias/seguridad/',
];

async function testCrawl4AIExtraction() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   TEST: EXTRACCIÓN DE CONTENIDO CON CRAWL4AI          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`📡 URL del servicio: ${CRAWL4AI_URL}\n`);

  for (const testUrl of TEST_URLS) {
    console.log(`\n🔍 Probando URL: ${testUrl}`);
    console.log('─'.repeat(60));

    try {
      const startTime = Date.now();

      const response = await fetch(`${CRAWL4AI_URL}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          urls: [testUrl],
          word_count_threshold: 10,
          extraction_strategy: {
            type: 'markdown',
            params: {
              content_only: true,
            }
          },
          chunking_strategy: {
            type: 'regex',
          },
          screenshot: false,
          verbose: true,
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Error ${response.status}: ${response.statusText}`);
        console.log(`📄 Respuesta: ${errorText.substring(0, 300)}...\n`);
        continue;
      }

      const data = await response.json();

      console.log(`✅ Scraping exitoso (${(duration / 1000).toFixed(2)}s)`);
      console.log('\n📊 Resultados:');

      if (data.results && data.results.length > 0) {
        const result = data.results[0];

        console.log(`   - Success: ${result.success}`);
        console.log(`   - URL: ${result.url}`);
        console.log(`   - Markdown: ${result.markdown?.length || 0} caracteres`);
        console.log(`   - HTML: ${result.html?.length || 0} caracteres`);
        console.log(`   - Links: ${result.links?.internal?.length || 0} internos, ${result.links?.external?.length || 0} externos`);

        if (result.markdown) {
          console.log('\n📝 Preview del contenido:');
          console.log('─'.repeat(60));
          const preview = result.markdown.substring(0, 300).replace(/\n+/g, '\n');
          console.log(preview);
          console.log('...');
          console.log('─'.repeat(60));
        }

        // Buscar noticias en el contenido
        if (result.links?.internal) {
          console.log(`\n📰 Enlaces encontrados: ${result.links.internal.length}`);
          const newsLinks = result.links.internal.slice(0, 5);
          newsLinks.forEach((link, i) => {
            console.log(`   ${i + 1}. ${link}`);
          });
        }
      } else {
        console.log('⚠️  No se obtuvieron resultados');
      }

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
    }

    console.log('\n');
  }
}

async function testHealthCheck() {
  console.log('🔍 Verificando health check...');
  try {
    const response = await fetch(`${CRAWL4AI_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Servicio operativo (versión ${data.version})\n`);
      return true;
    } else {
      console.log(`❌ Health check falló: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`❌ No se pudo conectar: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║      PIPELINE HÍBRIDO - TEST DE INTEGRACIÓN           ║');
  console.log('║      Firecrawl + Crawl4AI                              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Verificar health
  const healthy = await testHealthCheck();
  if (!healthy) {
    console.log('❌ El servicio Crawl4AI no está disponible.');
    console.log('💡 Verifica que el stack esté corriendo en Portainer.\n');
    process.exit(1);
  }

  // Probar extracción
  await testCrawl4AIExtraction();

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║              PRUEBAS COMPLETADAS                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('📋 SIGUIENTE PASO:');
  console.log('   - Inicia el servidor: npm run dev');
  console.log('   - Prueba el endpoint: http://localhost:3000/api/crawl4ai/health');
  console.log('   - Haz un scraping completo: POST /api/news/scrape\n');
}

main().catch(console.error);
