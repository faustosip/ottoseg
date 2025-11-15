/**
 * API Endpoint: GET /api/cron/daily-bulletin
 *
 * Ejecuta el pipeline completo de generación de boletín
 * Este endpoint debe ser llamado por un servicio de cron (ej: Vercel Cron, GitHub Actions)
 */

import { NextRequest, NextResponse } from "next/server";
import { getTodayBulletin } from "@/lib/db/queries/bulletins";

/**
 * GET /api/cron/daily-bulletin
 *
 * Pipeline completo: scrape → classify → summarize
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let pipeline: Record<string, any> = {};

  try {
    // Verificar autorización con CRON_SECRET
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("⚠️  CRON_SECRET no está configurado en variables de entorno");
      return NextResponse.json(
        { error: "Configuración de cron inválida" },
        { status: 500 }
      );
    }

    const expectedAuth = `Bearer ${cronSecret}`;

    if (authHeader !== expectedAuth) {
      console.error("❌ Autorización de cron inválida");
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    console.log("🔐 Cron autorizado correctamente");

    // Verificar si ya existe boletín de hoy
    const todayBulletin = await getTodayBulletin();

    if (todayBulletin && todayBulletin.status !== "failed") {
      console.log(`⚠️  Ya existe boletín de hoy (${todayBulletin.status})`);
      return NextResponse.json({
        success: true,
        message: "Ya existe un boletín para hoy",
        bulletinId: todayBulletin.id,
        status: todayBulletin.status,
        skipped: true,
      });
    }

    console.log("🚀 Iniciando pipeline de generación de boletín...");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Paso 1: Scraping
    console.log("\n📍 Paso 1/3: Scraping");
    const scrapeStart = Date.now();

    try {
      const scrapeResponse = await fetch(`${baseUrl}/api/news/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Usar un token interno o session de admin
          Cookie: request.headers.get("Cookie") || "",
        },
      });

      if (!scrapeResponse.ok) {
        throw new Error(
          `Scraping falló: ${scrapeResponse.status} ${scrapeResponse.statusText}`
        );
      }

      const scrapeData = await scrapeResponse.json();
      pipeline.scraping = {
        success: true,
        duration: Date.now() - scrapeStart,
        bulletinId: scrapeData.bulletinId,
        totalNews: scrapeData.totalNews,
        sources: scrapeData.sources,
      };

      console.log(`✅ Scraping exitoso: ${scrapeData.totalNews} noticias`);
      console.log(`   Duración: ${(pipeline.scraping.duration / 1000).toFixed(2)}s`);

      const bulletinId = scrapeData.bulletinId;

      // Paso 2: Clasificación
      console.log("\n📍 Paso 2/3: Clasificación");
      const classifyStart = Date.now();

      try {
        const classifyResponse = await fetch(`${baseUrl}/api/news/classify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || "",
          },
          body: JSON.stringify({ bulletinId }),
        });

        if (!classifyResponse.ok) {
          throw new Error(
            `Clasificación falló: ${classifyResponse.status} ${classifyResponse.statusText}`
          );
        }

        const classifyData = await classifyResponse.json();
        pipeline.classification = {
          success: true,
          duration: Date.now() - classifyStart,
          totalClassified: classifyData.totalClassified,
          breakdown: classifyData.breakdown,
        };

        console.log(`✅ Clasificación exitosa: ${classifyData.totalClassified} noticias`);
        console.log(`   Duración: ${(pipeline.classification.duration / 1000).toFixed(2)}s`);
        console.log("   Distribución:", classifyData.breakdown);

        // Paso 3: Summarización
        console.log("\n📍 Paso 3/3: Summarización");
        const summarizeStart = Date.now();

        try {
          const summarizeResponse = await fetch(
            `${baseUrl}/api/news/summarize`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: request.headers.get("Cookie") || "",
              },
              body: JSON.stringify({ bulletinId, streaming: false }),
            }
          );

          if (!summarizeResponse.ok) {
            throw new Error(
              `Summarización falló: ${summarizeResponse.status} ${summarizeResponse.statusText}`
            );
          }

          const summarizeData = await summarizeResponse.json();
          pipeline.summarization = {
            success: true,
            duration: Date.now() - summarizeStart,
            categoriesGenerated: summarizeData.categoriesGenerated,
          };

          console.log(`✅ Summarización exitosa: ${summarizeData.categoriesGenerated} categorías`);
          console.log(`   Duración: ${(pipeline.summarization.duration / 1000).toFixed(2)}s`);
        } catch (error) {
          pipeline.summarization = {
            success: false,
            error: (error as Error).message,
            duration: Date.now() - summarizeStart,
          };
          throw error;
        }
      } catch (error) {
        pipeline.classification = {
          success: false,
          error: (error as Error).message,
          duration: Date.now() - classifyStart,
        };
        throw error;
      }

      // Pipeline completado
      const totalDuration = Date.now() - startTime;

      console.log(`\n✅ Pipeline completado exitosamente`);
      console.log(`   Duración total: ${(totalDuration / 1000).toFixed(2)}s`);

      return NextResponse.json({
        success: true,
        message: "Boletín generado exitosamente",
        bulletinId,
        executedAt: new Date().toISOString(),
        totalDuration: `${(totalDuration / 1000).toFixed(2)}s`,
        pipeline,
      });
    } catch (error) {
      pipeline.scraping = {
        success: false,
        error: (error as Error).message,
        duration: Date.now() - scrapeStart,
      };
      throw error;
    }
  } catch (error) {
    console.error("❌ Error en pipeline de cron:", error);

    const totalDuration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: "Error ejecutando pipeline",
        message: (error as Error).message,
        executedAt: new Date().toISOString(),
        totalDuration: `${(totalDuration / 1000).toFixed(2)}s`,
        pipeline,
      },
      { status: 500 }
    );
  }
}
