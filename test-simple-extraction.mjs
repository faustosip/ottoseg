/**
 * Test SUPER SIMPLE de extracción
 */

const schema = {
  name: "Test",
  baseSelector: "article",  // Sabemos que HAY 53
  fields: [
    { name: "content", type: "text" }
  ]
};

const payload = {
  urls: ["https://www.primicias.ec/politica/"],
  browser_config: {
    type: "BrowserConfig",
    params: { headless: true }
  },
  crawler_config: {
    type: "CrawlerRunConfig",
    params: {
      extraction_strategy: {
        type: "JsonCssExtractionStrategy",
        params: {
          schema: {
            type: "dict",
            value: schema
          }
        }
      }
    }
  }
};

console.log('🧪 Test con selector SUPER SIMPLE (article)...\n');

const response = await fetch('https://crawl.ottoseguridadai.com/crawl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const data = await response.json();
const result = data.results[0];

console.log('Status:', response.status);
console.log('Success:', data.success);
console.log('Has extracted:', !!result.extracted);
console.log('Extracted type:', typeof result.extracted);

if (result.extracted) {
  console.log('\n✅ ¡FUNCIONA! Extracted content:');
  console.log(JSON.stringify(result.extracted, null, 2).substring(0, 500));
} else {
  console.log('\n❌ NO FUNCIONA - La estrategia NO se está ejecutando');
  console.log('Error message:', result.error_message);
  console.log('\n📋 Resultado completo:');
  console.log(JSON.stringify(result, null, 2).substring(0, 1000));
}
