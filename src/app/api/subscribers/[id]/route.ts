/**
 * API Endpoints: /api/subscribers/[id]
 *
 * GET - Get a single subscriber
 * PATCH - Update a subscriber
 * DELETE - Delete a subscriber
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { z } from "zod";
import {
  getSubscriberById,
  updateSubscriber,
  deleteSubscriber,
} from "@/lib/db/queries/subscribers";
import { errorResponse } from "@/lib/http/error-response";

/**
 * Schema for updating a subscriber
 */
const UpdateSubscriberSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  name: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/subscribers/[id]
 *
 * Get a single subscriber by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await context.params;

    const subscriber = await getSubscriberById(id);

    if (!subscriber) {
      return NextResponse.json(
        { error: "Suscriptor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriber,
    });
  } catch (error) {
    console.error("❌ Error getting subscriber:", error);

    return errorResponse("Error obteniendo suscriptor", 500, error);
  }
}

/**
 * PATCH /api/subscribers/[id]
 *
 * Update a subscriber
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await context.params;

    // Check if subscriber exists
    const existing = await getSubscriberById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Suscriptor no encontrado" },
        { status: 404 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validationResult = UpdateSubscriberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Update subscriber
    const subscriber = await updateSubscriber(id, updates);

    console.log(`✅ Subscriber updated: ${subscriber?.email}`);

    return NextResponse.json({
      success: true,
      subscriber,
    });
  } catch (error) {
    console.error("❌ Error updating subscriber:", error);

    return errorResponse("Error actualizando suscriptor", 500, error);
  }
}

/**
 * DELETE /api/subscribers/[id]
 *
 * Delete a subscriber
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await context.params;

    // Check if subscriber exists
    const existing = await getSubscriberById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Suscriptor no encontrado" },
        { status: 404 }
      );
    }

    // Delete subscriber
    await deleteSubscriber(id);

    console.log(`✅ Subscriber deleted: ${existing.email}`);

    return NextResponse.json({
      success: true,
      message: "Suscriptor eliminado exitosamente",
      deletedId: id,
    });
  } catch (error) {
    console.error("❌ Error deleting subscriber:", error);

    return errorResponse("Error eliminando suscriptor", 500, error);
  }
}
