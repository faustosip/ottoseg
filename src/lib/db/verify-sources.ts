/**
 * Script para verificar las URLs de las fuentes
 *
 * Ejecutar con: npx tsx src/lib/db/verify-sources.ts
 */

import { db } from "@/lib/db";
import { newsSources } from "@/lib/schema";

interface ScrapeConfig {
  urls?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  removeBase64Images?: boolean;
}

async function verifySources() {
  console.log("\n🔍 Verificando configuración de fuentes...\n");

  const sources = await db.select().from(newsSources);

  let totalUrls = 0;

  for (const source of sources) {
    const scrapeConfig = source.scrapeConfig as ScrapeConfig | null;
    const urls = scrapeConfig?.urls || [source.url];

    console.log(`📌 ${source.name}:`);
    console.log(`   Estado: ${source.isActive ? "✅ Activa" : "❌ Inactiva"}`);
    console.log(`   URLs configuradas: ${urls.length}`);

    urls.forEach((url, i) => {
      console.log(`   ${i + 1}. ${url}`);
    });

    console.log();
    totalUrls += urls.length;
  }

  console.log(`📊 Resumen:`);
  console.log(`   🌐 Total de fuentes: ${sources.length}`);
  console.log(`   🔗 Total de URLs: ${totalUrls}`);
  console.log(`   ✅ URLs activas: ${totalUrls} (esperado: 18)\n`);

  if (totalUrls === 18) {
    console.log("✅ La configuración es correcta!\n");
  } else {
    console.log(`⚠️  Advertencia: Se esperaban 18 URLs pero se encontraron ${totalUrls}\n`);
  }

  process.exit(0);
}

verifySources().catch((error) => {
  console.error("\n❌ Error durante verificación:", error);
  process.exit(1);
});
