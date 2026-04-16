/**
 * Script complementario para capturar screenshots del detalle del boletín
 * (tabs, acciones, edición, envío de email)
 *
 * Ejecutar: npx tsx scripts/capture-bulletin-detail.ts
 */

import { chromium } from "playwright";
import path from "path";

const BASE_URL = "https://app.ottoseguridadai.com";
const SCREENSHOTS_DIR = path.join(process.cwd(), "public/manual/screenshots");

const CREDENTIALS = {
  email: "admin@ottoseguridad.com",
  password: "Admin1234",
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("🚀 Capturando detalle del boletín...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "es-EC",
  });
  const page = await context.newPage();

  // Login
  console.log("🔐 Iniciando sesión...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await sleep(2000);
  await page.fill('input[id="email"]', CREDENTIALS.email);
  await page.fill('input[id="password"]', CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 30000 });
  await sleep(2000);

  // Ir a la lista de boletines para obtener el ID del más reciente
  console.log("📋 Obteniendo lista de boletines...");
  await page.goto(`${BASE_URL}/dashboard/bulletin`, {
    waitUntil: "networkidle",
  });
  await sleep(3000);

  // Obtener todos los links a boletines
  const bulletinLinks = await page.$$eval(
    'a[href*="/dashboard/bulletin/"]',
    (links) =>
      links
        .map((a) => a.getAttribute("href"))
        .filter(
          (h) =>
            h &&
            !h.includes("generate") &&
            !h.includes("edit") &&
            h.split("/").length >= 4
        )
  );

  console.log("📝 Boletines encontrados:", bulletinLinks.length);

  if (bulletinLinks.length === 0) {
    console.log("❌ No se encontraron boletines");
    await browser.close();
    return;
  }

  // Usar el primer boletín (más reciente)
  const bulletinUrl = bulletinLinks[0]!;
  console.log("📰 Abriendo boletín:", bulletinUrl);

  await page.goto(`${BASE_URL}${bulletinUrl}`, { waitUntil: "networkidle" });
  await sleep(4000);

  // ============================================================
  // DETALLE - Vista general (top con botones de acción)
  // ============================================================
  console.log("📸 Detalle - Vista general");
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "06-boletin-detalle.png"),
    fullPage: false,
  });

  // Full page
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "06b-boletin-detalle-full.png"),
    fullPage: true,
  });

  // ============================================================
  // TABS - Buscar y clickear cada tab
  // ============================================================
  // Buscar todos los botones de tab
  const tabButtons = await page.$$eval(
    'button[role="tab"], [data-state]',
    (btns) =>
      btns.map((b) => ({
        text: b.textContent?.trim() || "",
        value: b.getAttribute("value") || b.getAttribute("data-value") || "",
      }))
  );
  console.log(
    "📑 Tabs encontrados:",
    tabButtons.map((t) => t.text)
  );

  // Tab: Resúmenes / Summaries
  const summaryTab = page.locator('button[role="tab"]').filter({ hasText: /resum|summar/i }).first();
  if ((await summaryTab.count()) > 0) {
    console.log("📸 Tab: Resúmenes");
    await summaryTab.click();
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-tab-resumenes.png"),
      fullPage: true,
    });
  }

  // Tab: Noticias Raw
  const rawTab = page.locator('button[role="tab"]').filter({ hasText: /raw|noticia.*raw/i }).first();
  if ((await rawTab.count()) > 0) {
    console.log("📸 Tab: Noticias Raw");
    await rawTab.click();
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "08-tab-noticias-raw.png"),
      fullPage: true,
    });
  }

  // Tab: Clasificadas
  const classifiedTab = page.locator('button[role="tab"]').filter({ hasText: /clasif/i }).first();
  if ((await classifiedTab.count()) > 0) {
    console.log("📸 Tab: Clasificadas");
    await classifiedTab.click();
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "09-tab-clasificadas.png"),
      fullPage: true,
    });
  }

  // Tab: Logs
  const logsTab = page.locator('button[role="tab"]').filter({ hasText: /log/i }).first();
  if ((await logsTab.count()) > 0) {
    console.log("📸 Tab: Logs");
    await logsTab.click();
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "10-tab-logs.png"),
      fullPage: true,
    });
  }

  // Tab: Video
  const videoTab = page.locator('button[role="tab"]').filter({ hasText: /video/i }).first();
  if ((await videoTab.count()) > 0) {
    console.log("📸 Tab: Video");
    await videoTab.click();
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "11-tab-video.png"),
      fullPage: true,
    });
  }

  // Tab: Auditoría
  const auditTab = page.locator('button[role="tab"]').filter({ hasText: /audit/i }).first();
  if ((await auditTab.count()) > 0) {
    console.log("📸 Tab: Auditoría");
    await auditTab.click();
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "11b-tab-auditoria.png"),
      fullPage: true,
    });
  }

  // ============================================================
  // VISTA PÚBLICA del boletín
  // ============================================================
  console.log("📸 Vista pública del boletín");
  const bulletinId = bulletinUrl.split("/").pop();
  await page.goto(`${BASE_URL}/bulletin/${bulletinId}`, {
    waitUntil: "networkidle",
  });
  await sleep(4000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "17-vista-publica.png"),
    fullPage: true,
  });

  // Scroll down for more content
  await page.evaluate(() => window.scrollTo(0, 800));
  await sleep(1000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "17b-vista-publica-scroll.png"),
    fullPage: false,
  });

  // ============================================================
  // FIN
  // ============================================================
  console.log("✅ Captura de detalle de boletín completa!");
  await browser.close();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
