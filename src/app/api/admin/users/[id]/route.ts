import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, account } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  allowedMenus: z.array(z.string()).nullable().optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional(),
});

/**
 * PUT /api/admin/users/[id] - Actualizar usuario (isActive, allowedMenus, password)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { isActive, allowedMenus, password } = parsed.data;

    // Update isActive and/or allowedMenus in user table
    const userUpdates: Record<string, unknown> = {};
    if (isActive !== undefined) userUpdates.isActive = isActive;
    if (allowedMenus !== undefined) userUpdates.allowedMenus = allowedMenus;

    if (Object.keys(userUpdates).length > 0) {
      await db.update(user).set(userUpdates).where(eq(user.id, id));
    }

    // Update password in account table
    if (password) {
      const { hashPassword } = await import("better-auth/crypto");
      const hash = await hashPassword(password);
      await db
        .update(account)
        .set({ password: hash })
        .where(and(eq(account.userId, id), eq(account.providerId, "credential")));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}
