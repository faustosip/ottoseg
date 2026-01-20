/**
 * API Endpoints: /api/subscribers/[id]
 *
 * GET - Get a single subscriber
 * PATCH - Update a subscriber
 * DELETE - Delete a subscriber
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import {
  getSubscriberById,
  updateSubscriber,
  deleteSubscriber,
} from "@/lib/db/queries/subscribers";

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
    // Validate authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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

    return NextResponse.json(
      {
        error: "Error obteniendo suscriptor",
        message: (error as Error).message,
      },
      { status: 500 }
    );
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
    // Validate authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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

    return NextResponse.json(
      {
        error: "Error actualizando suscriptor",
        message: (error as Error).message,
      },
      { status: 500 }
    );
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
    // Validate authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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

    return NextResponse.json(
      {
        error: "Error eliminando suscriptor",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
