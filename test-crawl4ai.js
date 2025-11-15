/**
 * Script de prueba para verificar Crawl4AI
 *
 * Uso: node test-crawl4ai.js
 */

const CRAWL4AI_URL = process.env.CRAWL4AI_API_URL || 'https://crawl.ottoseguridadai.com';

async function testCrawl4AIHealth() {
  console.log('🔍 Probando Crawl4AI Health Check...');
  console.log(`📡 URL: ${CRAWL4AI_URL}`);

  try {
    const healthUrl = `${CRAWL4AI_URL}/health`;
    console.log(`\n⏳ Verificando: ${healthUrl}`);

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`\n📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Crawl4AI está funcionando correctamente!\n');
      console.log('📄 Respuesta:', JSON.stringify(data, null, 2));
      return true;
    } else {
      const text = await response.text();
      console.log('\n❌ Error en el health check');
      console.log('📄 Respuesta:', text);
      return false;
    }
  } catch (error) {
    console.error('\n❌ Error conectando a Crawl4AI:', error.message);
    console.error('\n💡 Posibles causas:');
    console.error('   - El servicio no está corriendo en Docker');
    console.error('   - Traefik no ha configurado el dominio aún');
    console.error('   - DNS no apunta al servidor correcto');
    console.error('   - Certificado SSL no está listo');
    return false;
  }
}

async function testCrawl4AIScrape() {
  console.log('\n\n🔍 Probando scraping de URL...');

  try {
    const scrapeUrl = `${CRAWL4AI_URL}/crawl`;
    console.log(`\n⏳ Scraping URL de prueba...`);

    const response = await fetch(scrapeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://primicias.ec/',
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 30000,
      }),
    });

    console.log(`\n📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Scraping exitoso!\n');
      console.log('📊 Estadísticas:');
      console.log(`   - Success: ${data.success}`);
      console.log(`   - Markdown length: ${data.data?.markdown?.length || 0} chars`);
      console.log(`   - HTML length: ${data.data?.html?.length || 0} chars`);
      return true;
    } else {
      const text = await response.text();
      console.log('\n❌ Error en el scraping');
      console.log('📄 Respuesta:', text.substring(0, 500));
      return false;
    }
  } catch (error) {
    console.error('\n❌ Error en scraping:', error.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         CRAWL4AI - TEST DE VERIFICACIÓN               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Test 1: Health Check
  const healthOk = await testCrawl4AIHealth();

  if (!healthOk) {
    console.log('\n❌ Health check falló. No se puede continuar.\n');
    process.exit(1);
  }

  // Test 2: Scraping (opcional)
  console.log('\n¿Deseas probar el scraping? (puede tomar 10-30 segundos)');
  console.log('Presiona Ctrl+C para cancelar, o espera 3 segundos...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  await testCrawl4AIScrape();

  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║              PRUEBAS COMPLETADAS                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
