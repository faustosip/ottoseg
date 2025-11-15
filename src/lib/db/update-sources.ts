/**
 * Script para actualizar las fuentes con las 18 URLs específicas
 *
 * Ejecutar con: npx tsx src/lib/db/update-sources.ts
 */

import { db } from "@/lib/db";
import { newsSources } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function updateSources() {
  console.log("\n🔄 Actualizando fuentes de noticias con URLs múltiples...\n");

  const updates = [
    {
      name: "Primicias",
      urls: [
        "https://www.primicias.ec/politica/",
        "https://www.primicias.ec/economia/",
        "https://www.primicias.ec/seguridad/",
      ],
    },
    {
      name: "La Hora",
      urls: [
        "https://www.lahora.com.ec/seccion/politica",
        "https://www.lahora.com.ec/seccion/economia",
        "https://www.lahora.com.ec/seccion/sociedad",
        "https://www.lahora.com.ec/seccion/seguridad",
      ],
    },
    {
      name: "El Comercio",
      urls: [
        "https://www.elcomercio.com/ultima-hora/",
        "https://www.elcomercio.com/actualidad/",
        "https://www.elcomercio.com/tendencias/",
        "https://www.elcomercio.com/tecnologia/",
        "https://www.elcomercio.com/opinion/",
      ],
    },
    {
      name: "Teleamazonas",
      urls: [
        "https://www.teleamazonas.com/actualidad/noticias/politica/",
        "https://www.teleamazonas.com/actualidad/noticias/seguridad/",
        "https://www.teleamazonas.com/actualidad/noticias/judicial/",
        "https://www.teleamazonas.com/actualidad/noticias/sociedad/",
        "https://www.teleamazonas.com/actualidad/noticias/economia/",
      ],
    },
    {
      name: "ECU911",
      urls: [
        "https://www.ecu911.gob.ec/consulta-de-vias/",
      ],
    },
  ];

  let updated = 0;
  let notFound = 0;

  for (const { name, urls } of updates) {
    try {
      // Buscar la fuente
      const [source] = await db
        .select()
        .from(newsSources)
        .where(eq(newsSources.name, name))
        .limit(1);

      if (!source) {
        console.log(`  ❌ Fuente "${name}" no encontrada en la base de datos`);
        notFound++;
        continue;
      }

      // Obtener scrapeConfig existente o crear nuevo
      const existingConfig = (source.scrapeConfig as Record<string, unknown>) || {};

      // Actualizar con las URLs
      const newConfig = {
        ...existingConfig,
        onlyMainContent: true,
        waitFor: 0,
        removeBase64Images: true,
        urls: urls,
      };

      // Actualizar fuente
      await db
        .update(newsSources)
        .set({
          scrapeConfig: newConfig,
        })
        .where(eq(newsSources.name, name));

      console.log(`  ✅ ${name}: ${urls.length} URL(s) configuradas`);
      urls.forEach((url, i) => {
        console.log(`     ${i + 1}. ${url}`);
      });
      console.log();

      updated++;
    } catch (error) {
      console.error(`  ❌ Error actualizando ${name}:`, error);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ ${updated} fuentes actualizadas`);
  console.log(`   ❌ ${notFound} fuentes no encontradas`);
  console.log(`   📝 Total de URLs configuradas: 18`);
  console.log(`\n✅ Actualización completada!\n`);

  process.exit(0);
}

// Ejecutar actualización
updateSources().catch((error) => {
  console.error("\n❌ Error durante actualización:", error);
  process.exit(1);
});
