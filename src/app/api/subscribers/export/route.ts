/**
 * API Endpoint: /api/subscribers/export
 *
 * GET - Export subscribers as CSV
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { getSubscribers } from "@/lib/db/queries/subscribers";
import { errorResponse } from "@/lib/http/error-response";

/**
 * GET /api/subscribers/export
 *
 * Export all subscribers as CSV file
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("isActive");

    // Get all subscribers (no limit for export)
    const { subscribers } = await getSubscribers({
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      limit: 10000, // High limit for export
      orderBy: "email",
      orderDir: "asc",
    });

    // Build CSV content
    const csvRows: string[] = [];

    // Header row
    csvRows.push("email,name,is_active,created_at");

    // Data rows
    for (const subscriber of subscribers) {
      const row = [
        `"${subscriber.email}"`,
        `"${subscriber.name || ""}"`,
        subscriber.isActive ? "true" : "false",
        `"${subscriber.createdAt.toISOString()}"`,
      ].join(",");
      csvRows.push(row);
    }

    const csvContent = csvRows.join("\n");

    // Generate filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `suscriptores_${date}.csv`;

    console.log(`✅ Export completed: ${subscribers.length} subscribers`);

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("❌ Error exporting subscribers:", error);

    return errorResponse("Error exportando suscriptores", 500, error);
  }
}
