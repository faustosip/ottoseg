/**
 * Auth guards reutilizables para API routes.
 *
 * Centraliza la validación de sesión y la detección de "admin" (usuarios sin
 * `allowedMenus` restringidos, según convención existente del proyecto).
 *
 * Uso:
 *   const guard = await requireSession();
 *   if (!guard.ok) return guard.response;
 *   const { session } = guard;
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

type Session = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

type GuardSuccess = {
  ok: true;
  session: Session;
  userRecord?: {
    id: string;
    isActive: boolean;
    allowedMenus: string[] | null;
  };
};

type GuardFailure = {
  ok: false;
  response: NextResponse;
};

export type GuardResult = GuardSuccess | GuardFailure;

/**
 * Requiere una sesión activa. Devuelve la sesión o una Response 401.
 *
 * Úsala así en un route handler:
 *   const guard = await requireSession();
 *   if (!guard.ok) return guard.response;
 */
export async function requireSession(): Promise<GuardResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      ),
    };
  }

  return { ok: true, session };
}

/**
 * Requiere una sesión activa y que la cuenta esté marcada `isActive = true`.
 * También devuelve el registro de usuario para comprobar permisos adicionales
 * (por ejemplo `allowedMenus`).
 */
export async function requireActiveUser(): Promise<GuardResult> {
  const base = await requireSession();
  if (!base.ok) return base;

  const [record] = await db
    .select({
      id: user.id,
      isActive: user.isActive,
      allowedMenus: user.allowedMenus,
    })
    .from(user)
    .where(eq(user.id, base.session.user.id))
    .limit(1);

  if (!record) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 }
      ),
    };
  }

  if (!record.isActive) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Cuenta desactivada" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, session: base.session, userRecord: record };
}

/**
 * Requiere privilegios de administrador.
 *
 * Convención actual del proyecto: un usuario se considera "admin" cuando
 * `allowedMenus` es `null` (sin restricciones). Los usuarios con menús
 * restringidos son usuarios de alcance limitado.
 *
 * Si se introduce un campo `role` explícito en el schema, sustitúyase esa
 * comprobación aquí sin tocar los callers.
 */
export async function requireAdmin(): Promise<GuardResult> {
  const active = await requireActiveUser();
  if (!active.ok) return active;

  const isAdmin = active.userRecord?.allowedMenus == null;

  if (!isAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      ),
    };
  }

  return active;
}
