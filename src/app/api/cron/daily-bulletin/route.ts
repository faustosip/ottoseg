/**
 * API Endpoint: GET /api/cron/daily-bulletin
 *
 * Ejecuta el pipeline completo de generación de boletín
 * Este endpoint debe ser llamado por un servicio de cron (ej: Vercel Cron, GitHub Actions)
 */

import { NextRequest, NextResponse } from "next/server";
import { getTodayBulletin } from "@/lib/db/queries/bulletins";
import { errorResponse } from "@/lib/http/error-response";

/**
 * GET /api/cron/daily-bulletin
 *
 * Pipeline completo: scrape (con clasificación automática) → summarize
 */
interface PipelineStep {
  success: boolean;
  duration: number;
  error?: string;
  bulletinId?: string;
  totalNews?: number;
  sources?: Record<string, number>;
  totalClassified?: number;
  breakdown?: Record<string, number>;
  categoriesGenerated?: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const pipeline: Record<string, PipelineStep> = {};

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

    // Paso 1: Scraping (con clasificación automática)
    console.log("\n📍 Paso 1/2: Scraping + Clasificación Automática");
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

      // Paso 2: Clasificación (OMITIDO - Ya se hace automáticamente en scraping)
      console.log("\n⏭️  Paso 2: Clasificación automática ya realizada durante scraping");

      // La clasificación ya se hizo en el endpoint de scraping basándose en URLs
      // No es necesario llamar a /api/news/classify

      // Paso 2: Summarización
      console.log("\n📍 Paso 2/2: Summarización");
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

    // En producción, no exponer el campo `error` de cada paso del pipeline
    // (puede contener detalles internos). Los logs quedan en el servidor.
    const isDev = process.env.NODE_ENV === "development";
    const safePipeline = isDev
      ? pipeline
      : Object.fromEntries(
          Object.entries(pipeline).map(([k, v]) => {
            const copy: PipelineStep = { ...v };
            delete copy.error;
            return [k, copy];
          })
        );

    return errorResponse("Error ejecutando pipeline", 500, error, {
      success: false,
      executedAt: new Date().toISOString(),
      totalDuration: `${(totalDuration / 1000).toFixed(2)}s`,
      pipeline: safePipeline,
    });
  }
}
