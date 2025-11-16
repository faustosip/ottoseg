/**
 * Inspeccionar el HTML para verificar selectores
 */

const payload = {
  urls: ["https://www.primicias.ec/politica/"],
  browser_config: {
    type: "BrowserConfig",
    params: { headless: true }
  },
  crawler_config: {
    type: "CrawlerRunConfig",
    params: {}
  }
};

const response = await fetch('https://crawl.ottoseguridadai.com/crawl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const data = await response.json();
const html = data.results[0].html;

console.log('HTML Length:', html.length);
console.log('\n🔍 Buscando selectores CSS en el HTML...\n');

// Verificar diferentes selectores
const checks = [
  'article.post',
  'article',
  '.post',
  '.article-item',
  'div.card',
  'div.article',
  '.entry',
  'div[class*="article"]',
  'div[class*="post"]'
];

for (const selector of checks) {
  const regex = new RegExp(`<([^>]+class="[^"]*${selector.replace('.', '')}[^"]*"[^>]*)>`, 'gi');
  const matches = html.match(regex);
  console.log(`${selector.padEnd(25)} → ${matches ? `✅ ${matches.length} matches` : '❌ No matches'}`);
  if (matches && matches.length > 0 && matches.length < 5) {
    console.log(`   Ejemplos:`, matches.slice(0, 2).map(m => m.substring(0, 100)));
  }
}

// Buscar h2, h3 con links
console.log('\n🔍 Buscando títulos (h2/h3 con links)...\n');
const h2Links = html.match(/<h2[^>]*>.*?<a[^>]*>/gi);
const h3Links = html.match(/<h3[^>]*>.*?<a[^>]*>/gi);
console.log(`h2 con <a>: ${h2Links?.length || 0}`);
console.log(`h3 con <a>: ${h3Links?.length || 0}`);

if (h2Links && h2Links.length > 0) {
  console.log('Ejemplo h2:', h2Links[0].substring(0, 200));
}
if (h3Links && h3Links.length > 0) {
  console.log('Ejemplo h3:', h3Links[0].substring(0, 200));
}
