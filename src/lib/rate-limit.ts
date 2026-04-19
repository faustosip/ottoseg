import { NextResponse } from "next/server";
import { getRedis } from "./redis";

/**
 * Rate limiting basado en sliding window counter sobre Redis.
 *
 * Patrón de uso típico en un route handler:
 *
 *   const rl = await checkRateLimit("chat", userId, 20, 60);
 *   if (!rl.allowed) return rateLimitResponse(rl);
 *
 * Si Redis no está disponible (no configurado o caído), la función hace
 * fail-open: permite la petición y loguea el fallo. Negar todo por un Redis
 * caído es peor que no tener rate limit.
 */

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSec: number;
};

export async function checkRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    return { allowed: true, limit, remaining: limit, resetSec: windowSec };
  }

  const key = `rl:${scope}:${identifier}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSec);
    }
    const ttl = count === 1 ? windowSec : await redis.ttl(key);
    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetSec: ttl > 0 ? ttl : windowSec,
    };
  } catch (err) {
    console.error("[rate-limit] Redis error, fail-open:", err);
    return { allowed: true, limit, remaining: limit, resetSec: windowSec };
  }
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Demasiadas peticiones, intenta de nuevo en unos momentos.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.resetSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.resetSec),
      },
    }
  );
}

/**
 * Extrae la IP del cliente desde los headers de Traefik / proxy.
 *
 * Orden de preferencia: `x-forwarded-for` (primera IP), `x-real-ip`,
 * fallback `"unknown"`. El fallback garantiza que el rate-limit nunca falle
 * por no tener IP.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
