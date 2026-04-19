import { NextResponse } from "next/server";

/**
 * Construye una respuesta de error JSON. Incluye `message` con el detalle
 * del Error SOLO cuando `NODE_ENV === "development"`. En producción el
 * detalle se guarda únicamente en los logs del servidor.
 *
 * Uso típico:
 *   } catch (error) {
 *     console.error("contexto:", error);
 *     return errorResponse("Error al hacer X", 500, error);
 *   }
 */
export function errorResponse(
  userMessage: string,
  status: number,
  error?: unknown,
  extra?: Record<string, unknown>
): NextResponse {
  const isDev = process.env.NODE_ENV === "development";
  const body: Record<string, unknown> = { error: userMessage, ...extra };
  if (isDev && error instanceof Error) {
    body.message = error.message;
  }
  return NextResponse.json(body, { status });
}
