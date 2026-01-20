/**
 * API Endpoint: /api/subscribers/export
 *
 * GET - Export subscribers as CSV
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSubscribers } from "@/lib/db/queries/subscribers";

/**
 * GET /api/subscribers/export
 *
 * Export all subscribers as CSV file
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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

    return NextResponse.json(
      {
        error: "Error exportando suscriptores",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
