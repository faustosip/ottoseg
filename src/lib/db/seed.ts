/**
 * Script de Seed - Población de Base de Datos
 *
 * Ejecutar con: pnpm run db:seed
 */

import { db } from "@/lib/db";
import { bulletinDesigns, bulletinCategories, user } from "@/lib/schema";
import { auth } from "@/lib/auth";
import {
  createSource,
  getSourceByName,
} from "@/lib/db/queries/sources";
import {
  createTemplate,
  getTemplateByCategory,
} from "@/lib/db/queries/templates";
import {
  SUMMARIZATION_SYSTEM_PROMPT,
  SUMMARIZATION_USER_PROMPT_TEMPLATE,
} from "@/lib/ai/prompts";
import { eq } from "drizzle-orm";

/**
 * Seed de fuentes de noticias
 */
async function seedSources() {
  console.log("\n📰 Seeding fuentes de noticias...");

  const sources = [
    {
      name: "Primicias",
      url: "https://www.primicias.ec", // URL principal (no se usa, ver scrapeConfig.urls)
      baseUrl: "https://www.primicias.ec",
      selector: null,
      scrapeConfig: {
        onlyMainContent: true,
        waitFor: 0,
        removeBase64Images: true,
        urls: [
          "https://www.primicias.ec/politica/",
          "https://www.primicias.ec/economia/",
          "https://www.primicias.ec/seguridad/",
        ],
      },
      isActive: true,
    },
    {
      name: "La Hora",
      url: "https://www.lahora.com.ec",
      baseUrl: "https://www.lahora.com.ec",
      selector: null,
      scrapeConfig: {
        onlyMainContent: true,
        waitFor: 0,
        removeBase64Images: true,
        urls: [
          "https://www.lahora.com.ec/seccion/politica",
          "https://www.lahora.com.ec/seccion/economia",
          "https://www.lahora.com.ec/seccion/sociedad",
          "https://www.lahora.com.ec/seccion/seguridad",
        ],
      },
      isActive: true,
    },
    {
      name: "El Comercio",
      url: "https://www.elcomercio.com",
      baseUrl: "https://www.elcomercio.com",
      selector: null,
      scrapeConfig: {
        onlyMainContent: true,
        waitFor: 0,
        removeBase64Images: true,
        urls: [
          "https://www.elcomercio.com/ultima-hora/",
          "https://www.elcomercio.com/actualidad/",
          "https://www.elcomercio.com/tendencias/",
          "https://www.elcomercio.com/tecnologia/",
          "https://www.elcomercio.com/opinion/",
        ],
      },
      isActive: true,
    },
    {
      name: "Teleamazonas",
      url: "https://www.teleamazonas.com",
      baseUrl: "https://www.teleamazonas.com",
      selector: null,
      scrapeConfig: {
        onlyMainContent: true,
        waitFor: 0,
        removeBase64Images: true,
        urls: [
          "https://www.teleamazonas.com/actualidad/noticias/politica/",
          "https://www.teleamazonas.com/actualidad/noticias/seguridad/",
          "https://www.teleamazonas.com/actualidad/noticias/judicial/",
          "https://www.teleamazonas.com/actualidad/noticias/sociedad/",
          "https://www.teleamazonas.com/actualidad/noticias/economia/",
        ],
      },
      isActive: true,
    },
    {
      name: "ECU911",
      url: "https://www.ecu911.gob.ec",
      baseUrl: "https://www.ecu911.gob.ec",
      selector: null,
      scrapeConfig: {
        onlyMainContent: true,
        waitFor: 0,
        removeBase64Images: true,
        urls: [
          "https://www.ecu911.gob.ec/consulta-de-vias/",
        ],
      },
      isActive: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const sourceData of sources) {
    try {
      // Verificar si ya existe
      const existing = await getSourceByName(sourceData.name);

      if (existing) {
        console.log(`  ⏭️  ${sourceData.name} ya existe, omitiendo...`);
        skipped++;
        continue;
      }

      // Crear fuente
      await createSource(sourceData);
      console.log(`  ✅ ${sourceData.name} creada`);
      created++;
    } catch (error) {
      console.error(`  ❌ Error creando ${sourceData.name}:`, error);
    }
  }

  console.log(`\n📊 Fuentes: ${created} creadas, ${skipped} omitidas`);
}

/**
 * Seed de templates de resúmenes
 */
async function seedTemplates() {
  console.log("\n📝 Seeding templates de resúmenes...");

  const templates = [
    {
      name: "Template Economía",
      category: "economia",
      systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
      userPromptTemplate: SUMMARIZATION_USER_PROMPT_TEMPLATE,
      exampleOutput:
        "El Banco Central del Ecuador reporta un crecimiento del 2.4% en el PIB del primer trimestre. Las exportaciones de banano alcanzaron récord histórico con 350 millones de cajas. La inflación mensual se ubicó en 0.2%, mientras el desempleo bajó a 3.8% según el INEC.",
      maxWords: 150,
      tone: "profesional",
      version: 1,
      isActive: true,
    },
    {
      name: "Template Política",
      category: "politica",
      systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
      userPromptTemplate: SUMMARIZATION_USER_PROMPT_TEMPLATE,
      exampleOutput:
        "La Asamblea Nacional aprobó en segundo debate la Ley de Eficiencia Económica con 95 votos a favor. El Presidente Daniel Noboa anunció cambios en tres ministerios del gabinete. La Corte Constitucional declaró constitucional el proyecto de reforma tributaria presentado por el Ejecutivo.",
      maxWords: 150,
      tone: "profesional",
      version: 1,
      isActive: true,
    },
    {
      name: "Template Sociedad",
      category: "sociedad",
      systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
      userPromptTemplate: SUMMARIZATION_USER_PROMPT_TEMPLATE,
      exampleOutput:
        "El Ministerio de Educación inicia plan de refuerzo escolar en 500 instituciones a nivel nacional. El MSP reporta aumento del 15% en vacunación infantil durante marzo. Quito inaugura nuevo hospital de especialidades con 200 camas. La selección sub-20 clasifica al Sudamericano tras vencer 2-0 a Colombia.",
      maxWords: 150,
      tone: "profesional",
      version: 1,
      isActive: true,
    },
    {
      name: "Template Seguridad",
      category: "seguridad",
      systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
      userPromptTemplate: SUMMARIZATION_USER_PROMPT_TEMPLATE,
      exampleOutput:
        "La Policía Nacional desarticuló banda dedicada al narcotráfico en Guayaquil, incautando 800 kilos de droga. Operativo en cárcel de Latacunga decomisa armas y celulares. Las estadísticas del Ministerio del Interior muestran reducción del 18% en homicidios durante el primer bimestre comparado con 2024.",
      maxWords: 150,
      tone: "profesional",
      version: 1,
      isActive: true,
    },
    {
      name: "Template Internacional",
      category: "internacional",
      systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
      userPromptTemplate: SUMMARIZATION_USER_PROMPT_TEMPLATE,
      exampleOutput:
        "Ecuador firma acuerdo comercial con Corea del Sur para exportación de camarón. La Cancillería reporta 150 ecuatorianos repatriados desde Venezuela. El país participa en cumbre de la CELAC en Honduras abordando migración y cambio climático. Delegación viaja a China para renegociar deuda externa.",
      maxWords: 150,
      tone: "profesional",
      version: 1,
      isActive: true,
    },
    {
      name: "Template Vial",
      category: "vial",
      systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
      userPromptTemplate: SUMMARIZATION_USER_PROMPT_TEMPLATE,
      exampleOutput:
        "Accidente de tránsito en la vía Quito-Papallacta deja 3 heridos y cierre parcial por 4 horas. El MTOP anuncia inicio de trabajos en 12 kilómetros de la Troncal Amazónica. Operativo de control vehicular en Guayaquil detecta 45 vehículos con documentación irregular. Restricción vehicular en Cuenca se amplía a placas terminadas en 7 y 8.",
      maxWords: 150,
      tone: "profesional",
      version: 1,
      isActive: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const templateData of templates) {
    try {
      // Verificar si ya existe template para esta categoría
      const existing = await getTemplateByCategory(templateData.category);

      if (existing) {
        console.log(
          `  ⏭️  Template para ${templateData.category} ya existe, omitiendo...`
        );
        skipped++;
        continue;
      }

      // Crear template
      await createTemplate(templateData);
      console.log(`  ✅ Template ${templateData.category} creado`);
      created++;
    } catch (error) {
      console.error(
        `  ❌ Error creando template ${templateData.category}:`,
        error
      );
    }
  }

  console.log(`\n📊 Templates: ${created} creados, ${skipped} omitidos`);
}

/**
 * Seed de diseños de boletines
 */
async function seedDesigns() {
  console.log("\n🎨 Seeding diseños de boletines...");

  const designs = [
    {
      name: "classic",
      displayName: "Clásico",
      description: "Diseño tradicional de periódico, ideal para audiencia mayor",
      layoutConfig: {
        font: "serif",
        spacing: "comfortable",
        headerStyle: "traditional",
      },
      isActive: true,
    },
    {
      name: "modern",
      displayName: "Moderno",
      description: "Diseño contemporáneo con estética limpia y minimalista",
      layoutConfig: {
        font: "sans-serif",
        spacing: "compact",
        headerStyle: "minimal",
      },
      isActive: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const designData of designs) {
    try {
      // Verificar si ya existe
      const [existing] = await db
        .select()
        .from(bulletinDesigns)
        .where(eq(bulletinDesigns.name, designData.name))
        .limit(1);

      if (existing) {
        console.log(`  ⏭️  Diseño ${designData.name} ya existe, omitiendo...`);
        skipped++;
        continue;
      }

      // Crear diseño
      await db.insert(bulletinDesigns).values(designData);
      console.log(`  ✅ Diseño ${designData.name} creado`);
      created++;
    } catch (error) {
      console.error(`  ❌ Error creando diseño ${designData.name}:`, error);
    }
  }

  console.log(`\n📊 Diseños: ${created} creados, ${skipped} omitidos`);
}

/**
 * Seed de categorías de boletín
 */
async function seedCategories() {
  console.log("\n📂 Seeding categorías de boletín...");

  const categories = [
    { name: "economia", displayName: "Economía", displayOrder: 1, isDefault: true },
    { name: "politica", displayName: "Política", displayOrder: 2, isDefault: true },
    { name: "sociedad", displayName: "Sociedad", displayOrder: 3, isDefault: true },
    { name: "seguridad", displayName: "Seguridad", displayOrder: 4, isDefault: true },
    { name: "internacional", displayName: "Internacional", displayOrder: 5, isDefault: true },
    { name: "vial", displayName: "Vial", displayOrder: 6, isDefault: true },
    { name: "ultima_hora", displayName: "Última Hora", displayOrder: 7, isDefault: true },
  ];

  let created = 0;
  let skipped = 0;

  for (const categoryData of categories) {
    try {
      const [existing] = await db
        .select()
        .from(bulletinCategories)
        .where(eq(bulletinCategories.name, categoryData.name))
        .limit(1);

      if (existing) {
        console.log(`  ⏭️  Categoría ${categoryData.name} ya existe, omitiendo...`);
        skipped++;
        continue;
      }

      await db.insert(bulletinCategories).values(categoryData);
      console.log(`  ✅ Categoría ${categoryData.displayName} creada`);
      created++;
    } catch (error) {
      console.error(`  ❌ Error creando categoría ${categoryData.name}:`, error);
    }
  }

  console.log(`\n📊 Categorías: ${created} creadas, ${skipped} omitidas`);
}

/**
 * Seed admin user - Crea el usuario administrador inicial
 */
async function seedAdminUser() {
  console.log("👤 Creando usuario administrador...");

  const adminEmail = "admin@ottoseguridad.com";
  const adminPassword = "Admin1234";
  const adminName = "Administrador";

  // Verificar si ya existe
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, adminEmail));
  if (existing.length > 0) {
    console.log("  ⏭️  Usuario admin ya existe, saltando...");
    return;
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      },
    });
    console.log(`  ✅ Usuario admin creado: ${adminEmail} / ${adminPassword}`);
    console.log("  ⚠️  ¡Cambia la contraseña después del primer login!");
  } catch (error) {
    console.error("  ❌ Error creando admin:", error);
  }
}

/**
 * Main seed function
 */
async function seed() {
  console.log("🌱 Iniciando seed de base de datos...\n");

  try {
    await seedSources();
    await seedTemplates();
    await seedDesigns();
    await seedCategories();
    await seedAdminUser();

    console.log("\n✅ Seed completado exitosamente!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error durante seed:", error);
    process.exit(1);
  }
}

// Ejecutar seed
seed();
