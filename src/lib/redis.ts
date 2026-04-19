import Redis from "ioredis";

/**
 * Cliente Redis singleton con fail-open behavior.
 *
 * Si `REDIS_URL` no está configurado, `getRedis()` devuelve `null` y los
 * consumidores (p. ej. rate-limit) deben degradar con gracia. Un Redis caído
 * no debe bloquear peticiones legítimas.
 */

let client: Redis | null = null;
let warnedMissing = false;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    if (!warnedMissing) {
      console.warn(
        "[redis] REDIS_URL no está definido — rate limiting y cache degradados."
      );
      warnedMissing = true;
    }
    return null;
  }

  if (client) return client;

  client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    connectTimeout: 2000,
    enableOfflineQueue: false,
    lazyConnect: false,
  });

  client.on("error", (err) => {
    console.error("[redis] error:", err.message);
  });

  return client;
}
