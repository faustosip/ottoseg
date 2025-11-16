/**
 * Test directo de la API de Crawl4AI
 */

const schema = {
  name: "Primicias Articles",
  baseSelector: "article.post, article, .post, .article-item",
  fields: [
    { name: "title", selector: "h2 a, h3 a, h2, h3", type: "text" },
    { name: "url", selector: "h2 a, h3 a, a", type: "attribute", attribute: "href" },
  ]
};

const payload = {
  urls: ["https://www.primicias.ec/politica/"],
  browser_config: {
    type: "BrowserConfig",
    params: { headless: true, verbose: false }
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

console.log('📤 PAYLOAD ENVIADO:');
console.log(JSON.stringify(payload, null, 2));
console.log('\n🌐 Llamando a Crawl4AI...\n');

const response = await fetch('https://crawl.ottoseguridadai.com/crawl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const data = await response.json();

console.log('📥 RESPUESTA:');
console.log('Status:', response.status);
console.log('Success:', data.success);
console.log('Results count:', data.results?.length);

if (data.results?.[0]) {
  const result = data.results[0];
  console.log('\n📊 PRIMER RESULTADO:');
  console.log('URL:', result.url);
  console.log('Status Code:', result.status_code);
  console.log('Has extracted:', !!result.extracted);

  if (result.extracted) {
    console.log('Extracted type:', typeof result.extracted);
    console.log('Extracted content:', JSON.stringify(result.extracted, null, 2).substring(0, 1000));
  } else {
    console.log('❌ NO HAY DATOS EXTRAÍDOS');
    console.log('HTML length:', result.html?.length || 0);
    console.log('Markdown length:', result.markdown?.length || 0);
  }
}

console.log('\n\n📋 RESPUESTA COMPLETA (primeros 2000 chars):');
console.log(JSON.stringify(data, null, 2).substring(0, 2000));
