/**
 * API Endpoint: GET /api/dashboard/stats
 *
 * Returns all dashboard KPIs and chart data
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getDashboardKPIs,
  getBulletinTrend,
  getEmailPerformanceByBulletin,
  getNewsByCategory,
  getNewsBySource,
  getPipelinePerformance,
  getRecentActivity,
} from "@/lib/db/queries/dashboard";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [kpis, bulletinTrend, emailPerformance, newsByCategory, newsBySource, pipeline, recentActivity] =
      await Promise.all([
        getDashboardKPIs(),
        getBulletinTrend(),
        getEmailPerformanceByBulletin(),
        getNewsByCategory(),
        getNewsBySource(),
        getPipelinePerformance(),
        getRecentActivity(),
      ]);

    return NextResponse.json({
      kpis,
      bulletinTrend,
      emailPerformance,
      newsByCategory,
      newsBySource,
      pipeline,
      recentActivity,
    });
  } catch (error) {
    console.error("❌ Error loading dashboard stats:", error);
    return NextResponse.json(
      { error: "Error cargando estadísticas", message: (error as Error).message },
      { status: 500 }
    );
  }
}
