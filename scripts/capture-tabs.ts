/**
 * Capturar tabs del detalle del boletín con nombres correctos
 */
import { chromium } from "playwright";
import path from "path";

const BASE_URL = "https://app.ottoseguridadai.com";
const SCREENSHOTS_DIR = path.join(process.cwd(), "public/manual/screenshots");

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "es-EC",
  });
  const page = await context.newPage();

  // Login
  console.log("🔐 Login...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await sleep(2000);
  await page.fill('input[id="email"]', "admin@ottoseguridad.com");
  await page.fill('input[id="password"]', "Admin1234");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 30000 });
  await sleep(2000);

  // Ir al primer boletín
  await page.goto(`${BASE_URL}/dashboard/bulletin`, { waitUntil: "networkidle" });
  await sleep(3000);

  // Obtener todos los links a boletines y filtrar los no válidos
  const allLinks = await page.$$eval('a[href*="/dashboard/bulletin/"]', (els) =>
    els.map((a) => a.getAttribute("href")).filter(Boolean)
  );
  console.log("🔗 Links encontrados:", allLinks);

  const validLinks = allLinks.filter(
    (h) => h && !h.includes("generate") && !h.includes("edit") && h.match(/\/dashboard\/bulletin\/[a-f0-9-]+/)
  );
  console.log("✅ Links válidos:", validLinks);

  const href = validLinks[0];
  if (!href) {
    console.log("❌ No se encontró un boletín válido");
    await browser.close();
    return;
  }

  console.log("📰 Abriendo:", href);
  await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle" });
  await sleep(4000);

  // Capturar vista general
  console.log("📸 Vista general del detalle");
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "06-boletin-detalle.png"),
    fullPage: false,
  });
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "06b-boletin-detalle-full.png"),
    fullPage: true,
  });

  // Listar los tabs reales
  const allTabs = await page.$$eval('button[role="tab"]', (btns) =>
    btns.map((b) => ({ text: (b.textContent || "").trim().substring(0, 50) }))
  );
  console.log("📑 Tabs:", allTabs.map(t => t.text));

  // Tab: Resúmenes
  const resumenesTab = page.locator('button[role="tab"]', { hasText: "Resúmenes" });
  if ((await resumenesTab.count()) > 0) {
    console.log("📸 Tab: Resúmenes");
    await resumenesTab.click();
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-tab-resumenes.png"),
      fullPage: true,
    });
  }

  // Tab: Noticias
  const noticiasTab = page.locator('button[role="tab"]', { hasText: "Noticias" });
  if ((await noticiasTab.count()) > 0) {
    console.log("📸 Tab: Noticias");
    await noticiasTab.click();
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "08-tab-noticias.png"),
      fullPage: true,
    });
  }

  // Tab: Editar
  const editarTab = page.locator('button[role="tab"]', { hasText: "Editar" });
  if ((await editarTab.count()) > 0) {
    console.log("📸 Tab: Editar");
    await editarTab.click();
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "09-tab-editar.png"),
      fullPage: true,
    });
  }

  // Tab: Auditoría
  const auditoriaTab = page.locator('button[role="tab"]', { hasText: "Auditoría" });
  if ((await auditoriaTab.count()) > 0) {
    console.log("📸 Tab: Auditoría");
    await auditoriaTab.click();
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "10-tab-auditoria.png"),
      fullPage: true,
    });
  }

  // Capturar botones de acción (parte superior)
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "12-botones-accion.png"),
    fullPage: false,
  });

  console.log("✅ Tabs capturados!");
  await browser.close();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
