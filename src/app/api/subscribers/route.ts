/**
 * API Endpoints: /api/subscribers
 *
 * GET - List all subscribers with filtering
 * POST - Create a new subscriber
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { z } from "zod";
import { getSubscribers, createSubscriber, getSubscriberByEmail } from "@/lib/db/queries/subscribers";
import { errorResponse } from "@/lib/http/error-response";

/**
 * Schema for creating a subscriber
 */
const CreateSubscriberSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/subscribers
 *
 * List subscribers with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const isActive = searchParams.get("isActive");
    const orderBy = searchParams.get("orderBy") as "email" | "name" | "createdAt" | undefined;
    const orderDir = searchParams.get("orderDir") as "asc" | "desc" | undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;

    const result = await getSubscribers({
      search,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      orderBy,
      orderDir,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Error listing subscribers:", error);

    return errorResponse("Error listando suscriptores", 500, error);
  }
}

/**
 * POST /api/subscribers
 *
 * Create a new subscriber
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    // Parse and validate body
    const body = await request.json();
    const validationResult = CreateSubscriberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if email already exists
    const existing = await getSubscriberByEmail(data.email);
    if (existing) {
      return NextResponse.json(
        {
          error: "El email ya está registrado",
          email: data.email,
        },
        { status: 409 }
      );
    }

    // Create subscriber
    const subscriber = await createSubscriber({
      email: data.email,
      name: data.name || null,
      isActive: data.isActive,
    });

    console.log(`✅ Subscriber created: ${subscriber.email}`);

    return NextResponse.json(
      {
        success: true,
        subscriber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating subscriber:", error);

    return errorResponse("Error creando suscriptor", 500, error);
  }
}
