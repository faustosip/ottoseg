/**
 * Validación de URLs HLS devueltas por Simli antes de pasarlas a FFmpeg.
 *
 * Simli históricamente sirve sus streams HLS desde subdominios de
 * `simli.ai` o distribuciones CloudFront. Si un atacante pudiera inyectar
 * un hls_url arbitrario, podría forzar al backend a tirar de contenidos
 * externos o de servicios internos (SSRF via ffmpeg).
 */

const ALLOWED_HLS_SUFFIXES = [".simli.ai", ".cloudfront.net"] as const;

export function isAllowedSimliHlsUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return ALLOWED_HLS_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export function assertAllowedSimliHlsUrl(raw: string): void {
  if (!isAllowedSimliHlsUrl(raw)) {
    throw new Error("URL HLS no permitida");
  }
}
