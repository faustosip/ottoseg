/**
 * Helpers de fetch defensivo.
 *
 * - `assertAllowedUrl()`: valida scheme, hostname contra una allowlist y que
 *   el hostname NO resuelva a IPs privadas/loopback/link-local (anti-SSRF).
 * - `fetchWithSizeLimit()`: ejecuta `fetch()` y aborta si el body supera
 *   `maxBytes`, evitando que un atacante fuerce descargas gigantescas.
 *
 * Notas de seguridad:
 * - La resolución DNS se hace ANTES del fetch. Esto no elimina por completo
 *   el riesgo de DNS-rebinding, pero reduce significativamente la superficie.
 * - La allowlist es por coincidencia de sufijo: `primicias.ec` permite
 *   `www.primicias.ec` y `api.primicias.ec`.
 */
import dns from "node:dns/promises";
import net from "node:net";

/** Hostnames permitidos (se permiten también subdominios). */
export const NEWS_SOURCE_ALLOWLIST: readonly string[] = [
  "primicias.ec",
  "lahora.com.ec",
  "elcomercio.com",
  "teleamazonas.com",
  "ecu911.gob.ec",
  // Google News RSS (usado como fallback para La Hora)
  "news.google.com",
  // Imágenes de Google News que redirigen desde artículos
  "googleusercontent.com",
  "lh3.googleusercontent.com",
];

function hostMatchesAllowlist(
  hostname: string,
  allowlist: readonly string[]
): boolean {
  const host = hostname.toLowerCase();
  return allowlist.some(
    (domain) => host === domain || host.endsWith(`.${domain}`)
  );
}

/**
 * Verifica si una IP (v4 o v6) cae en un rango privado, loopback,
 * link-local, multicast o reservado.
 */
export function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 0) return false;

  if (family === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 127.0.0.0/8 loopback
    if (a === 127) return true;
    // 169.254.0.0/16 link-local
    if (a === 169 && b === 254) return true;
    // 0.0.0.0/8
    if (a === 0) return true;
    // 100.64.0.0/10 CGNAT
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 224.0.0.0/4 multicast
    if (a >= 224 && a <= 239) return true;
    // 240.0.0.0/4 reservado
    if (a >= 240) return true;
    return false;
  }

  // IPv6
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  // fc00::/7 unique local
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
  // fe80::/10 link-local
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
  // ff00::/8 multicast
  if (lower.startsWith("ff")) return true;
  // IPv4-mapped ::ffff:a.b.c.d → validar como IPv4
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return false;
}

export interface AssertUrlOptions {
  /** Hostnames permitidos. Por defecto: NEWS_SOURCE_ALLOWLIST. */
  allowlist?: readonly string[];
  /** Si `false`, no se consulta DNS. Útil para tests. Default: true. */
  checkDns?: boolean;
}

/**
 * Valida que una URL sea segura para hacer fetch del lado del servidor.
 * - Solo `http:` / `https:`.
 * - Hostname debe estar en la allowlist (o ser un subdominio).
 * - Todas las IPs resueltas deben ser públicas.
 *
 * Lanza un Error con mensaje genérico si falla — no devuelve información
 * detallada al caller para evitar oracle de red.
 */
export async function assertAllowedUrl(
  rawUrl: string,
  options: AssertUrlOptions = {}
): Promise<URL> {
  const { allowlist = NEWS_SOURCE_ALLOWLIST, checkDns = true } = options;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL inválida");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Protocolo no permitido");
  }

  if (!hostMatchesAllowlist(parsed.hostname, allowlist)) {
    throw new Error("Hostname no permitido");
  }

  // Si el hostname ya es una IP literal, valida directamente
  if (net.isIP(parsed.hostname) !== 0) {
    if (isPrivateIp(parsed.hostname)) {
      throw new Error("IP no permitida");
    }
    return parsed;
  }

  if (checkDns) {
    try {
      const addresses = await dns.lookup(parsed.hostname, { all: true });
      if (addresses.length === 0) {
        throw new Error("DNS sin resultados");
      }
      for (const addr of addresses) {
        if (isPrivateIp(addr.address)) {
          throw new Error("DNS apunta a IP privada");
        }
      }
    } catch (err) {
      // Re-lanza como error genérico
      if (err instanceof Error && err.message.startsWith("DNS ")) throw err;
      throw new Error("Fallo resolviendo DNS");
    }
  }

  return parsed;
}

export interface FetchWithSizeLimitOptions extends RequestInit {
  /** Máximo de bytes a leer del body. Default: 5 MB. */
  maxBytes?: number;
  /** Timeout ms para la request completa. Default: 15_000. */
  timeoutMs?: number;
}

/**
 * Ejecuta un fetch y limita el tamaño del body.
 * Lanza un error si se supera `maxBytes` (5 MB por defecto).
 *
 * Devuelve `{ ok, status, headers, text }` — nota que el cuerpo se lee como
 * texto UTF-8, que es lo que consumen los extractores Cheerio del proyecto.
 */
export async function fetchWithSizeLimit(
  url: string | URL,
  options: FetchWithSizeLimitOptions = {}
): Promise<{
  ok: boolean;
  status: number;
  headers: Headers;
  text: string;
}> {
  const maxBytes = options.maxBytes ?? 5 * 1024 * 1024;
  const timeoutMs = options.timeoutMs ?? 15_000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const initSignal = options.signal;
  const signal = initSignal
    ? AbortSignal.any([controller.signal, initSignal])
    : controller.signal;

  try {
    const response = await fetch(url, { ...options, signal });

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > maxBytes) {
      // Aborta antes de leer el cuerpo
      controller.abort();
      throw new Error(
        `Respuesta excede tamaño máximo permitido (${maxBytes} bytes)`
      );
    }

    if (!response.body) {
      return {
        ok: response.ok,
        status: response.status,
        headers: response.headers,
        text: "",
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let received = 0;
    let text = "";

    // Lee en stream y corta si supera maxBytes
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          /* noop */
        }
        throw new Error(
          `Respuesta excede tamaño máximo permitido (${maxBytes} bytes)`
        );
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();

    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      text,
    };
  } finally {
    clearTimeout(timeout);
  }
}
