/**
 * Script para capturar screenshots del sistema OttoSeguridad
 * para el manual de usuario.
 *
 * Ejecutar: npx tsx scripts/capture-manual-screenshots.ts
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
  console.log("🚀 Iniciando captura de screenshots...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "es-EC",
  });
  const page = await context.newPage();

  // ============================================================
  // 1. PANTALLA DE LOGIN
  // ============================================================
  console.log("📸 1. Pantalla de Login");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await sleep(2000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "01-login.png"),
    fullPage: true,
  });

  // ============================================================
  // 2. LOGIN - Llenando credenciales
  // ============================================================
  console.log("📸 2. Login con credenciales");
  await page.fill('input[id="email"]', CREDENTIALS.email);
  await page.fill('input[id="password"]', CREDENTIALS.password);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "02-login-filled.png"),
    fullPage: true,
  });

  // ============================================================
  // 3. Hacer login
  // ============================================================
  console.log("🔐 Iniciando sesión...");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 30000 });
  await sleep(3000);

  // ============================================================
  // 4. DASHBOARD EJECUTIVO
  // ============================================================
  console.log("📸 3. Dashboard ejecutivo");
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  await sleep(3000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "03-dashboard.png"),
    fullPage: true,
  });

  // Capturar solo la sección de KPIs (viewport)
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "03b-dashboard-kpis.png"),
    fullPage: false,
  });

  // ============================================================
  // 5. LISTA DE BOLETINES
  // ============================================================
  console.log("📸 4. Lista de boletines");
  await page.goto(`${BASE_URL}/dashboard/bulletin`, {
    waitUntil: "networkidle",
  });
  await sleep(3000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "04-boletines-lista.png"),
    fullPage: true,
  });

  // ============================================================
  // 6. GENERAR NUEVO BOLETÍN (si el botón está habilitado)
  // ============================================================
  console.log("📸 5. Generación de boletín");
  const generateBtn = page.locator('a[href="/dashboard/bulletin/generate"]');
  const btnExists = (await generateBtn.count()) > 0;

  if (btnExists) {
    await page.goto(`${BASE_URL}/dashboard/bulletin/generate`, {
      waitUntil: "networkidle",
    });
    await sleep(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-generar-boletin.png"),
      fullPage: true,
    });
  } else {
    console.log(
      "   ⚠️ Boletín de hoy ya existe, capturando estado actual..."
    );
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-boletin-existe-hoy.png"),
      fullPage: true,
    });
  }

  // ============================================================
  // 7. DETALLE DE BOLETÍN (primer boletín disponible)
  // ============================================================
  console.log("📸 6. Detalle de boletín");
  await page.goto(`${BASE_URL}/dashboard/bulletin`, {
    waitUntil: "networkidle",
  });
  await sleep(2000);

  // Click en el primer boletín de la lista
  const firstBulletinLink = page.locator("a[href*='/dashboard/bulletin/']").first();
  if ((await firstBulletinLink.count()) > 0) {
    const href = await firstBulletinLink.getAttribute("href");
    if (href && href !== "/dashboard/bulletin/generate") {
      await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle" });
      await sleep(3000);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, "06-boletin-detalle.png"),
        fullPage: true,
      });

      // ============================================================
      // 8. TAB: Resúmenes
      // ============================================================
      console.log("📸 7. Tab Resúmenes");
      const tabResumenes = page.locator('button:has-text("Resúmenes"), [value="summaries"]');
      if ((await tabResumenes.count()) > 0) {
        await tabResumenes.first().click();
        await sleep(2000);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, "07-tab-resumenes.png"),
          fullPage: true,
        });
      }

      // ============================================================
      // 9. TAB: Noticias Raw
      // ============================================================
      console.log("📸 8. Tab Noticias Raw");
      const tabRaw = page.locator('button:has-text("Noticias Raw"), button:has-text("Raw"), [value="raw"]');
      if ((await tabRaw.count()) > 0) {
        await tabRaw.first().click();
        await sleep(2000);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, "08-tab-noticias-raw.png"),
          fullPage: true,
        });
      }

      // ============================================================
      // 10. TAB: Noticias Clasificadas
      // ============================================================
      console.log("📸 9. Tab Noticias Clasificadas");
      const tabClassified = page.locator(
        'button:has-text("Clasificadas"), button:has-text("Noticias Clasificadas"), [value="classified"]'
      );
      if ((await tabClassified.count()) > 0) {
        await tabClassified.first().click();
        await sleep(2000);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, "09-tab-clasificadas.png"),
          fullPage: true,
        });
      }

      // ============================================================
      // 11. TAB: Logs
      // ============================================================
      console.log("📸 10. Tab Logs");
      const tabLogs = page.locator('button:has-text("Logs"), [value="logs"]');
      if ((await tabLogs.count()) > 0) {
        await tabLogs.first().click();
        await sleep(2000);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, "10-tab-logs.png"),
          fullPage: true,
        });
      }

      // ============================================================
      // 12. TAB: Video
      // ============================================================
      console.log("📸 11. Tab Video");
      const tabVideo = page.locator('button:has-text("Video"), [value="video"]');
      if ((await tabVideo.count()) > 0) {
        await tabVideo.first().click();
        await sleep(2000);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, "11-tab-video.png"),
          fullPage: true,
        });
      }

      // ============================================================
      // 13. Botones de acción (Autorizar, Publicar, etc.)
      // ============================================================
      console.log("📸 12. Botones de acción del boletín");
      // Volver a la tab principal
      if ((await tabResumenes.count()) > 0) {
        await tabResumenes.first().click();
        await sleep(1000);
      }
      // Scroll to top to capture action buttons
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(1000);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, "12-botones-accion.png"),
        fullPage: false,
      });
    }
  }

  // ============================================================
  // 14. FUENTES DE NOTICIAS
  // ============================================================
  console.log("📸 13. Fuentes de noticias");
  await page.goto(`${BASE_URL}/dashboard/settings/sources`, {
    waitUntil: "networkidle",
  });
  await sleep(3000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "13-fuentes.png"),
    fullPage: true,
  });

  // ============================================================
  // 15. SUSCRIPTORES
  // ============================================================
  console.log("📸 14. Suscriptores");
  await page.goto(`${BASE_URL}/dashboard/subscribers`, {
    waitUntil: "networkidle",
  });
  await sleep(3000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "14-suscriptores.png"),
    fullPage: true,
  });

  // ============================================================
  // 16. CATEGORÍAS
  // ============================================================
  console.log("📸 15. Categorías");
  await page.goto(`${BASE_URL}/dashboard/settings/categories`, {
    waitUntil: "networkidle",
  });
  await sleep(3000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "15-categorias.png"),
    fullPage: true,
  });

  // ============================================================
  // 17. USUARIOS
  // ============================================================
  console.log("📸 16. Usuarios");
  await page.goto(`${BASE_URL}/dashboard/settings/users`, {
    waitUntil: "networkidle",
  });
  await sleep(3000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "16-usuarios.png"),
    fullPage: true,
  });

  // ============================================================
  // 18. VISTA PÚBLICA DEL BOLETÍN
  // ============================================================
  console.log("📸 17. Vista pública del boletín");
  // Buscar el boletín más reciente publicado
  await page.goto(`${BASE_URL}/dashboard/bulletin`, {
    waitUntil: "networkidle",
  });
  await sleep(2000);
  const bulletinLink = page.locator("a[href*='/dashboard/bulletin/']").first();
  if ((await bulletinLink.count()) > 0) {
    const href = await bulletinLink.getAttribute("href");
    if (href) {
      const bulletinId = href.split("/").pop();
      // Vista pública
      await page.goto(`${BASE_URL}/bulletin/${bulletinId}`, {
        waitUntil: "networkidle",
      });
      await sleep(3000);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, "17-vista-publica.png"),
        fullPage: true,
      });

      // Vista pública - scroll para ver más contenido
      await page.evaluate(() => window.scrollTo(0, 600));
      await sleep(1000);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, "17b-vista-publica-scroll.png"),
        fullPage: false,
      });
    }
  }

  // ============================================================
  // 19. PERFIL DE USUARIO
  // ============================================================
  console.log("📸 18. Perfil de usuario");
  await page.goto(`${BASE_URL}/profile`, { waitUntil: "networkidle" });
  await sleep(2000);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, "18-perfil.png"),
    fullPage: true,
  });

  // ============================================================
  // 20. MENÚ DE NAVEGACIÓN (header)
  // ============================================================
  console.log("📸 19. Menú de navegación");
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  await sleep(2000);
  const header = page.locator("header").first();
  if ((await header.count()) > 0) {
    await header.screenshot({
      path: path.join(SCREENSHOTS_DIR, "19-menu-navegacion.png"),
    });
  }

  // ============================================================
  // FIN
  // ============================================================
  console.log("✅ Captura completa! Screenshots guardados en:", SCREENSHOTS_DIR);
  await browser.close();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
